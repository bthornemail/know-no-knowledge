{-# LANGUAGE OverloadedStrings #-}

module Main (main) where

import qualified Data.ByteString.Lazy as BL
import qualified Data.Text as T
import qualified Data.Text.IO as TIO
import System.Exit (exitFailure)

import Desktop.MdExtract (extractNdjsonFromMarkdown)

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

  out1 <- case extractNdjsonFromMarkdown True False ["ndjson","jsonl","jsonlines","json","hash"] "md-sample.md" md of
    Left err -> do
      putStrLn ("FAIL: extract: " ++ T.unpack err)
      exitFailure
    Right bs -> pure bs

  out2 <- case extractNdjsonFromMarkdown True False ["ndjson","jsonl","jsonlines","json","hash"] "md-sample.md" md of
    Left err -> do
      putStrLn ("FAIL: extract determinism: " ++ T.unpack err)
      exitFailure
    Right bs -> pure bs

  assertEq "golden" golden out1
  assertEq "determinism" out1 out2

  let bad = "```ndjson\n{not json}\n```\n"
  case extractNdjsonFromMarkdown True False ["ndjson"] "bad.md" bad of
    Left _ -> pure ()
    Right _ -> do
      putStrLn "FAIL: strict should reject invalid JSON line in ndjson block"
      exitFailure

  let unclosed = "```ndjson\n{\"a\":1}\n"
  case extractNdjsonFromMarkdown True False ["ndjson"] "unclosed.md" unclosed of
    Left _ -> pure ()
    Right _ -> do
      putStrLn "FAIL: strict should reject unclosed fence"
      exitFailure
