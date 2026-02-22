{-# LANGUAGE OverloadedStrings #-}

module Main (main) where

import qualified Data.ByteString.Lazy as BL
import Control.Monad (when)
import qualified Data.Text as T
import qualified Data.Text.IO as TIO
import System.Directory (copyFile, createDirectoryIfMissing, doesDirectoryExist, doesFileExist, removePathForcibly)
import System.FilePath ((</>))
import System.Exit (exitFailure)

import Desktop.MdExtract (ExtractConfig (..), ExtractMode (..), extractNdjsonFromMarkdown, extractNdjsonFromTree)
import Desktop.MdManifest (ManifestOptions (..), writeManifest)

assertEq :: String -> BL.ByteString -> BL.ByteString -> IO ()
assertEq label expected actual =
  if expected == actual
    then pure ()
    else do
      putStrLn ("FAIL: " ++ label)
      putStrLn ("expected bytes: " ++ show (BL.length expected))
      putStrLn ("actual bytes:   " ++ show (BL.length actual))
      exitFailure

main :: IO ()
main = do
  md <- TIO.readFile "test/vectors/md-sample.md"
  golden <- BL.readFile "test/vectors/md-extract.golden.ndjson"

  out1 <- case extractNdjsonFromMarkdown True False False ["ndjson","jsonl","jsonlines","json","hash"] "md-sample.md" md of
    Left err -> do
      putStrLn ("FAIL: extract: " ++ T.unpack err)
      exitFailure
    Right bs -> pure bs

  out2 <- case extractNdjsonFromMarkdown True False False ["ndjson","jsonl","jsonlines","json","hash"] "md-sample.md" md of
    Left err -> do
      putStrLn ("FAIL: extract determinism: " ++ T.unpack err)
      exitFailure
    Right bs -> pure bs

  assertEq "golden" golden out1
  assertEq "determinism" out1 out2

  let bad = "```ndjson\n{not json}\n```\n"
  case extractNdjsonFromMarkdown True False False ["ndjson"] "bad.md" bad of
    Left _ -> pure ()
    Right _ -> do
      putStrLn "FAIL: strict should reject invalid JSON line in ndjson block"
      exitFailure

  let unclosed = "```ndjson\n{\"a\":1}\n"
  case extractNdjsonFromMarkdown True False False ["ndjson"] "unclosed.md" unclosed of
    Left _ -> pure ()
    Right _ -> do
      putStrLn "FAIL: strict should reject unclosed fence"
      exitFailure

  -- Canvas pointers (tree extraction)
  canvasGolden <- BL.readFile "test/vectors/md-canvas-pointers.golden.ndjson"
  manifestGolden <- BL.readFile "test/vectors/md-manifest.golden.json"
  let tmpBase = "dist-newstyle" </> "tmp-md-extract-canvas"
      root = tmpBase </> "root"
      out = tmpBase </> "out"
  exists <- doesDirectoryExist tmpBase
  when exists $ removePathForcibly tmpBase
  createDirectoryIfMissing True root
  copyFile "test/vectors/md-canvas-sample.md" (root </> "md-canvas-sample.md")

  extractNdjsonFromTree
    ExtractConfig
      { ecRoot = root
      , ecOut = out
      , ecStrict = True
      , ecMode = ModeAll
      , ecLangs = ["canvas"]
      , ecAggregate = True
      , ecLooseNdjson = False
      , ecCanonFilter = False
      , ecEmitCanvasPointers = True
      }

  pointers <- BL.readFile (out </> "ndjson" </> "canvas.blocks.ndjson")
  assertEq "canvas pointers golden" canvasGolden pointers

  canvasOutExists <- doesFileExist (out </> "canvas" </> "md-canvas-sample.md.block0.canvas.json")
  if canvasOutExists
    then pure ()
    else do
      putStrLn "FAIL: expected extracted canvas JSON file to exist"
      exitFailure

  writeManifest
    ManifestOptions
      { moRoot = root
      , moOut = out
      , moMode = "all"
      , moLangs = ["canvas"]
      , moStrict = True
      , moAggregate = True
      , moLooseNdjson = False
      , moCanonFilter = False
      , moEmitCanvasPointers = True
      , moEmitManifest = True
      , moManifestPath = out </> "manifest.json"
      , moIncludeGitHead = False
      , moTimestamp = False
      , moToolName = "json-canvas"
      , moToolVersion = "0.1.0.0"
      }

  manifest <- BL.readFile (out </> "manifest.json")
  assertEq "manifest golden" manifestGolden manifest
