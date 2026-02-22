{-# LANGUAGE OverloadedStrings #-}

module Main (main) where

import qualified Data.ByteString.Lazy as BL
import qualified Data.Text as T
import System.Exit (exitFailure)

import Desktop.CanvasEDSL (encodeNDJSON)
import MnemonicManifold.Canon (decodeCanonTriples)
import MnemonicManifold.Emit (EmitOptions(..), emitStaticFanoEvents, emitClauseEvents)

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
  canon <- BL.readFile "test/vectors/canon-mini.ndjson"
  golden <- BL.readFile "test/vectors/mnemonic-manifold.golden.ndjson"

  triples <- case decodeCanonTriples True "test/vectors/canon-mini.ndjson" canon of
    Left err -> do
      putStrLn ("FAIL: decodeCanonTriples: " ++ T.unpack err)
      exitFailure
    Right ts -> pure ts

  let opts = EmitOptions { eoEmitStatic = True, eoCentroid = False }
      out1 = encodeNDJSON (emitStaticFanoEvents <> concatMap (emitClauseEvents opts) triples)
      out2 = encodeNDJSON (emitStaticFanoEvents <> concatMap (emitClauseEvents opts) triples)

  assertEq "golden" golden out1
  assertEq "determinism" out1 out2

  case decodeCanonTriples True "testdoc" "{\"not\":\"canon\"}\n" of
    Left _ -> pure ()
    Right _ -> do
      putStrLn "FAIL: strict mode should reject unrecognized record"
      exitFailure
