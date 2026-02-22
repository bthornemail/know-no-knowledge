{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE RecordWildCards #-}

module MnemonicManifold.Canon
  ( Evidence(..)
  , CanonTriple(..)
  , decodeCanonTriples
  ) where

import qualified Data.Aeson as A
import qualified Data.Aeson.Types as A
import qualified Data.ByteString.Lazy.Char8 as BL
import qualified Data.Text as T
import Data.Text (Text)
import Data.Maybe (fromMaybe)
import MnemonicManifold.Spec (Triple(..), Versions(..))

data Evidence = Evidence
  { evDocBytes :: Int
  , evDocLines :: Int
  , evSpanStart :: Int
  , evSpanEnd :: Int
  , evLineLength :: Int
  } deriving (Eq, Show)

data CanonTriple = CanonTriple
  { ctDoc :: Text
  , ctVersions :: Versions
  , ctTriple :: Triple
  , ctEvidence :: Evidence
  } deriving (Eq, Show)

data InputContext = InputContext
  { icDocId :: Text
  , icDocBytes :: Int
  , icDocLines :: Int
  } deriving (Eq, Show)

decodeCanonTriples :: Bool -> Text -> BL.ByteString -> Either Text [CanonTriple]
decodeCanonTriples strictMode docId input =
  let ctx = InputContext
        { icDocId = docId
        , icDocBytes = fromIntegral (BL.length input)
        , icDocLines = length (BL.lines input)
        }
      lineOffsets = snd $ foldl step (0 :: Int, []) (BL.lines input)
      numbered = zip3 [1..] lineOffsets (BL.lines input)
  in foldl (accum strictMode ctx) (Right []) numbered
  where
    step (off, acc) line =
      let start = off
          len = fromIntegral (BL.length line)
          end = start + len
          next = end + 1
      in (next, acc ++ [(start, end, len)])

    accum True _ (Left err) _ = Left err
    accum True ctx (Right acc) item = do
      ct <- decodeLine True ctx item
      pure (acc ++ [ct])
    accum False ctx (Right acc) item =
      case decodeLine False ctx item of
        Left _ -> Right acc
        Right ct -> Right (acc ++ [ct])
    accum False _ (Left err) _ = Left err

decodeLine :: Bool -> InputContext -> (Int, (Int, Int, Int), BL.ByteString) -> Either Text CanonTriple
decodeLine strictMode ctx (lineNo, (spanStart, spanEnd, lineLen), rawLine)
  | BL.null rawLine =
      if strictMode then Left (linePrefix <> "empty line") else Left (linePrefix <> "skip empty line")
  | otherwise =
      case A.eitherDecode rawLine of
        Left err ->
          if strictMode
            then Left $ linePrefix <> "invalid JSON: " <> T.pack err
            else Left $ linePrefix <> "skip invalid JSON"
        Right v ->
          case parseAnyCanon ctx spanStart spanEnd lineLen v of
            Nothing ->
              if strictMode
                then Left $ linePrefix <> "unrecognized canon record"
                else Left $ linePrefix <> "skip unrecognized record"
            Just ct -> Right ct
  where
    linePrefix = "line " <> T.pack (show lineNo) <> ": "

parseAnyCanon :: InputContext -> Int -> Int -> Int -> A.Value -> Maybe CanonTriple
parseAnyCanon ctx spanStart spanEnd lineLen v = do
  A.Object o <- pure v
  let versions = parseVersions o
      docId = fromMaybe (icDocId ctx) (parseDocId o)

  triple <- parseTriple o <|> parseCanonEventTriple o
  evidence <- parseEvidence o <|> pure (fallbackEvidence ctx spanStart spanEnd lineLen)
  pure $ CanonTriple docId versions triple evidence
  where
    (<|>) :: Maybe a -> Maybe a -> Maybe a
    (<|>) (Just a) _ = Just a
    (<|>) Nothing b = b

parseVersions :: A.Object -> Versions
parseVersions o =
  Versions
    { lexiconVersion = fromMaybe "canon.v1" (o A..:? "lexicon_version")
    , parserVersion = fromMaybe "canon.v1" (o A..:? "parser_version")
    }

parseDocId :: A.Object -> Maybe Text
parseDocId o =
  case o A..:? "doc" of
    Just (A.String t) -> Just t
    Just (A.Object d) -> d A..:? "path"
    _ -> Nothing

parseTriple :: A.Object -> Maybe Triple
parseTriple o =
  parseSPO o <|> parseNested
  where
    parseSPO obj = do
      s <- obj A..:? "subject"
      p <- obj A..:? "predicate"
      ob <- obj A..:? "object"
      pure $ Triple s p ob

    parseNested = do
      A.Object t <- o A..:? "triple"
      s <- t A..:? "subject"
      p <- t A..:? "predicate"
      ob <- t A..:? "object"
      pure $ Triple s p ob

    (<|>) :: Maybe a -> Maybe a -> Maybe a
    (<|>) (Just a) _ = Just a
    (<|>) Nothing b = b

parseCanonEventTriple :: A.Object -> Maybe Triple
parseCanonEventTriple o = do
  ev <- o A..:? "event"
  obj <- pickText o
  let predParts =
        [ ("series", o A..:? "series")
        , ("article", o A..:? "article")
        , ("id", o A..:? "id")
        , ("name", o A..:? "name")
        , ("speaker", o A..:? "speaker")
        , ("voice", o A..:? "voice")
        , ("type", o A..:? "type")
        ]
      p = T.intercalate "|" $ filter (not . T.null) $ map renderPart predParts
  pure $ Triple ev p obj
  where
    pickText obj =
      (obj A..:? "text") <|> (obj A..:? "quote") <|> (obj A..:? "description")

    renderPart (k, mv) = case mv of
      Nothing -> ""
      Just v -> k <> "=" <> v

    (<|>) :: Maybe a -> Maybe a -> Maybe a
    (<|>) (Just a) _ = Just a
    (<|>) Nothing b = b

parseEvidence :: A.Object -> Maybe Evidence
parseEvidence o = do
  A.Object e <- o A..:? "evidence"
  docBytes <- e A..:? "doc_bytes"
  docLines <- e A..:? "doc_lines"
  spanStart <- e A..:? "span_start"
  spanEnd <- e A..:? "span_end"
  let lineLen = fromMaybe 0 (e A..:? "line_length")
  pure $ Evidence docBytes docLines spanStart spanEnd lineLen

fallbackEvidence :: InputContext -> Int -> Int -> Int -> Evidence
fallbackEvidence InputContext{..} spanStart spanEnd lineLen =
  Evidence
    { evDocBytes = icDocBytes
    , evDocLines = icDocLines
    , evSpanStart = spanStart
    , evSpanEnd = spanEnd
    , evLineLength = lineLen
    }
