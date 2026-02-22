{-# LANGUAGE LambdaCase #-}
{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE RecordWildCards #-}

module Desktop.MdExtract
  ( ExtractMode(..)
  , ExtractConfig(..)
  , extractNdjsonFromMarkdown
  , extractNdjsonFromTree
  ) where

import Control.Monad (forM, forM_, when)
import Data.Aeson (Value)
import Data.Aeson ((.=))
import qualified Data.Aeson as A
import qualified Data.ByteString.Lazy.Char8 as BL
import Data.Char (isSpace)
import Data.List (sort)
import Data.Maybe (catMaybes)
import Data.Text (Text)
import qualified Data.Text as T
import qualified Data.Text.Encoding as TE
import qualified Data.Text.IO as TIO
import System.Directory
import System.FilePath
import qualified Data.ByteString as BS
import qualified Data.Vector as V

data ExtractMode
  = ModeNdjsonOnly
  | ModeAll
  deriving (Eq, Show)

data ExtractConfig = ExtractConfig
  { ecRoot :: FilePath
  , ecOut :: FilePath
  , ecStrict :: Bool
  , ecMode :: ExtractMode
  , ecLangs :: [Text]
  , ecAggregate :: Bool
  , ecLooseNdjson :: Bool
  } deriving (Eq, Show)

-- | Extract NDJSON records from fenced blocks in a Markdown file.
-- Output is canonicalized NDJSON: each emitted record is parsed as JSON then re-encoded with aeson.
extractNdjsonFromMarkdown :: Bool -> Bool -> [Text] -> FilePath -> Text -> Either Text BL.ByteString
extractNdjsonFromMarkdown strictMode looseNdjson allowedLangs relPath markdown =
  fmap (BL.unlines . map A.encode) (extractValues strictMode looseNdjson allowedLangs relPath markdown)

-- | Walk ecRoot and extract from all *.md files. Writes:
--   <out>/ndjson/all.ndjson (if ecAggregate)
--   <out>/ndjson/<relpath>.ndjson (always)
extractNdjsonFromTree :: ExtractConfig -> IO ()
extractNdjsonFromTree ExtractConfig{..} = do
  mdFiles <- sort <$> findMdFiles ecRoot
  createDirectoryIfMissing True (ecOut </> "ndjson")
  when (ecMode == ModeAll) $ createDirectoryIfMissing True (ecOut </> "canvas")

  let langsToUse =
        case ecMode of
          ModeNdjsonOnly -> filter (`elem` ["ndjson","jsonl","jsonlines"]) (map normalizeLang ecLangs)
          ModeAll -> map normalizeLang ecLangs
      canvasEnabled = "canvas" `elem` langsToUse

  perFile <- forM mdFiles $ \absPath -> do
    let rel = makeRelative ecRoot absPath
    content <- TIO.readFile absPath
    case extractNdjsonFromMarkdown ecStrict ecLooseNdjson langsToUse rel content of
      Left err ->
        if ecStrict
          then ioError (userError (T.unpack err))
          else do
            -- In non-strict mode, still write an empty file for reproducibility.
            let outPath = ecOut </> "ndjson" </> addExtension rel "ndjson"
            createDirectoryIfMissing True (takeDirectory outPath)
            BL.writeFile outPath BL.empty
            pure (rel, BL.empty)
      Right ndjson -> do
        let outPath = ecOut </> "ndjson" </> addExtension rel "ndjson"
        createDirectoryIfMissing True (takeDirectory outPath)
        BL.writeFile outPath ndjson
        when (ecMode == ModeAll) $ do
          when canvasEnabled $ do
            case extractCanvasBlocks ecStrict rel content of
              Left err ->
                if ecStrict then ioError (userError (T.unpack err)) else pure ()
              Right canvases -> do
                forM_ canvases $ \(blockIndex, canvasValue) -> do
                  let canvasOut =
                        ecOut </> "canvas" </> addExtension (rel <> ".block" <> show blockIndex) "canvas.json"
                  createDirectoryIfMissing True (takeDirectory canvasOut)
                  BL.writeFile canvasOut (A.encode canvasValue)
        pure (rel, ndjson)

  when ecAggregate $ do
    let allOut = ecOut </> "ndjson" </> "all.ndjson"
        combined = BL.unlines (filter (not . BL.null) (map snd perFile))
    BL.writeFile allOut combined

findMdFiles :: FilePath -> IO [FilePath]
findMdFiles root = go root
  where
    go dir = do
      entries <- listDirectory dir
      paths <- forM entries $ \e -> do
        let p = dir </> e
        isDir <- doesDirectoryExist p
        if isDir
          then if shouldSkipDir e then pure [] else go p
          else pure [p | takeExtension p == ".md"]
      pure (concat paths)

    shouldSkipDir name =
      name `elem` [".git", "dist-newstyle", "node_modules", "build", ".obsidian"]

data Fence = Fence
  { fLang :: Text
  , fStartLine :: Int
  , fLines :: [Text]
  } deriving (Eq, Show)

extractValues :: Bool -> Bool -> [Text] -> FilePath -> Text -> Either Text [Value]
extractValues strictMode looseNdjson allowedLangs relPath markdown = do
  fences <- parseFences strictMode relPath (T.lines markdown)
  fenceVals <- concat <$> traverse (fenceToValues strictMode allowedLangs relPath) (zip [0 :: Int ..] fences)
  looseVals <-
    if looseNdjson
      then extractLooseNdjsonValues strictMode relPath (T.lines markdown)
      else Right []
  pure (fenceVals <> looseVals)

parseFences :: Bool -> FilePath -> [Text] -> Either Text [Fence]
parseFences strictMode relPath = go 1 Nothing [] []
  where
    go _ Nothing acc _ [] = Right (reverse acc)
    go lineNo (Just (lang, startLine, cur)) acc _ [] =
      if strictMode
        then Left (errAt startLine ("unclosed fence lang=" <> lang))
        else Right (reverse (Fence lang startLine (reverse cur) : acc))
    go lineNo st acc _ (ln:rest) =
      case st of
        Nothing ->
          case fenceStart ln of
            Nothing -> go (lineNo + 1) Nothing acc [] rest
            Just lang -> go (lineNo + 1) (Just (lang, lineNo, [])) acc [] rest
        Just (lang, startLine, cur) ->
          if fenceEnd ln
            then go (lineNo + 1) Nothing (Fence lang startLine (reverse cur) : acc) [] rest
            else go (lineNo + 1) (Just (lang, startLine, ln : cur)) acc [] rest

    errAt l msg = T.pack relPath <> ":" <> T.pack (show l) <> ": " <> msg

fenceStart :: Text -> Maybe Text
fenceStart t =
  let s = T.dropWhile isSpace t
  in if "```" `T.isPrefixOf` s
       then
         let rest = T.strip (T.drop 3 s)
         in if T.null rest
              then Just ""
              else Just (T.toLower rest)
       else Nothing

fenceEnd :: Text -> Bool
fenceEnd t = T.strip t == "```"

fenceToValues :: Bool -> [Text] -> FilePath -> (Int, Fence) -> Either Text [Value]
fenceToValues strictMode allowedLangs relPath (blockIndex, Fence{..}) =
  case normalizeLang fLang of
    lang
      | not (null allowedLangs) && lang `notElem` map normalizeLang allowedLangs ->
          Right []
      | lang `elem` ["ndjson","jsonl","jsonlines"] ->
          parseNdjsonLines strictMode relPath blockIndex fStartLine fLines
      | lang == "json" ->
          parseJsonBlock strictMode relPath blockIndex fStartLine fLines
      | lang == "hash" ->
          parseHashLines relPath blockIndex fStartLine fLines
      | lang == "canvas" ->
          Right []
      | otherwise ->
          Right []

normalizeLang :: Text -> Text
normalizeLang = T.toLower . T.takeWhile (not . isSpace)

parseNdjsonLines :: Bool -> FilePath -> Int -> Int -> [Text] -> Either Text [Value]
parseNdjsonLines strictMode relPath blockIndex startLine ls =
  fmap catMaybes $ traverse go (zip [0 :: Int ..] ls)
  where
    go (i, raw) =
      let lineNo = startLine + i
          t = T.strip raw
      in if T.null t || isComment t
           then Right Nothing
           else case A.eitherDecodeStrict' (encodeUtf8 t) of
             Left err ->
               if strictMode
                 then Left (mkErr lineNo ("invalid JSON in ndjson block: " <> T.pack err))
                 else Right Nothing
             Right v -> Right (Just v)

    mkErr l msg =
      T.pack relPath <> ":" <> T.pack (show l) <> ": block " <> T.pack (show blockIndex) <> ": " <> msg

isComment :: Text -> Bool
isComment t = "#" `T.isPrefixOf` t || "//" `T.isPrefixOf` t

parseJsonBlock :: Bool -> FilePath -> Int -> Int -> [Text] -> Either Text [Value]
parseJsonBlock strictMode relPath blockIndex startLine ls =
  case A.eitherDecodeStrict' (encodeUtf8 (T.unlines ls)) of
    Left err ->
      if strictMode
        then Left (mkErr startLine ("invalid JSON block: " <> T.pack err))
        else Right []
    Right v ->
      case v of
        A.Array arr -> Right (V.toList arr)
        A.Object _ -> Right [v]
        _ ->
          if strictMode
            then Left (mkErr startLine "json block must be object or array")
            else Right []
  where
    mkErr l msg =
      T.pack relPath <> ":" <> T.pack (show l) <> ": block " <> T.pack (show blockIndex) <> ": " <> msg

parseHashLines :: FilePath -> Int -> Int -> [Text] -> Either Text [Value]
parseHashLines relPath blockIndex startLine ls =
  Right $ catMaybes $ zipWith mk [0 :: Int ..] ls
  where
    mk i raw =
      let t = T.strip raw
      in if T.null t || isComment t
           then Nothing
           else Just $ A.object
              [ "event" .= ("hash" :: Text)
              , "doc" .= relPath
              , "block_index" .= blockIndex
              , "line" .= (startLine + i)
              , "value" .= t
              ]

encodeUtf8 :: Text -> BS.ByteString
encodeUtf8 = TE.encodeUtf8

extractLooseNdjsonValues :: Bool -> FilePath -> [Text] -> Either Text [Value]
extractLooseNdjsonValues strictMode relPath = go 1 False []
  where
    go _ _ acc [] = Right (reverse acc)
    go lineNo inFence acc (ln:rest) =
      case () of
        _
          | not inFence
          , Just _ <- fenceStart ln -> go (lineNo + 1) True acc rest
          | inFence
          , fenceEnd ln -> go (lineNo + 1) False acc rest
          | inFence -> go (lineNo + 1) True acc rest
          | otherwise ->
              let t = T.strip ln
              in if looksLikeJson t
                   then case A.eitherDecodeStrict' (encodeUtf8 t) of
                     Left err ->
                       if strictMode
                         then Left (mkErr lineNo ("invalid JSON on loose line: " <> T.pack err))
                         else go (lineNo + 1) False acc rest
                     Right v -> go (lineNo + 1) False (v : acc) rest
                   else go (lineNo + 1) False acc rest

    looksLikeJson t =
      (T.isPrefixOf "{" t && T.isSuffixOf "}" t) || (T.isPrefixOf "[" t && T.isSuffixOf "]" t)

    mkErr l msg = T.pack relPath <> ":" <> T.pack (show l) <> ": " <> msg

extractCanvasBlocks :: Bool -> FilePath -> Text -> Either Text [(Int, Value)]
extractCanvasBlocks strictMode relPath markdown = do
  fences <- parseFences strictMode relPath (T.lines markdown)
  let canvasFences = [ (i, f) | (i, f) <- zip [0 :: Int ..] fences, normalizeLang (fLang f) == "canvas" ]
  traverse (one strictMode relPath) canvasFences
  where
    one st rp (i, Fence{..}) = do
      vals <- parseJsonBlock st rp i fStartLine fLines
      case vals of
        [v@(A.Object _)] -> Right (i, v)
        [v] ->
          if st then Left (T.pack rp <> ":" <> T.pack (show fStartLine) <> ": canvas block must be a JSON object") else Right (i, v)
        _ ->
          if st then Left (T.pack rp <> ":" <> T.pack (show fStartLine) <> ": canvas block must be a single JSON object") else Right (i, A.object [])
