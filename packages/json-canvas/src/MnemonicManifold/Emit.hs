{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE RecordWildCards #-}

module MnemonicManifold.Emit
  ( EmitOptions(..)
  , emitStaticFanoEvents
  , emitClauseEvents
  ) where

import Desktop.CanvasEDSL
import Data.Text (Text)
import qualified Data.Text as T
import Data.Bits (xor)
import Data.Word (Word64)

import MnemonicManifold.Canon (CanonTriple(..), Evidence(..))
import MnemonicManifold.Spec
  ( Versions(..)
  , Triple(..)
  , Point(..)
  , Line(..)
  , allPoints
  , allLines
  , pointBitsText
  , hashS
  , hashP
  , hashO
  , pointValue
  , lineInvariantHolds
  , closureRatio
  , sabbath
  , stopMetric
  )
import MnemonicManifold.JsonText
import MnemonicManifold.Ids (shortHashHex16)

data EmitOptions = EmitOptions
  { eoEmitStatic :: Bool
  , eoCentroid :: Bool
  } deriving (Eq, Show)

emitStaticFanoEvents :: [CanvasEvent]
emitStaticFanoEvents =
  map (EvAddNode . pointNode) (zip allPoints [0..]) <>
  map (EvAddNode . lineNode) (zip allLines [0..])
  where
    pointNode (p, i) =
      let nid = pointNodeId p
          pos = (100 + i * 220, 40)
          size = (200, 60)
          payload = jsonObj
            [ ("kind", jsonText "mnemonic.fano.point")
            , ("bits", jsonText (pointBitsText p))
            ]
      in (textNode nid pos size payload) `withColor` Just (PresetColor 2)

    lineNode (Line name (p,q,r), i) =
      let nid = lineNodeId name
          pos = (100 + i * 220, 140)
          size = (200, 60)
          payload = jsonObj
            [ ("kind", jsonText "mnemonic.fano.line")
            , ("name", jsonText name)
            , ("points", jsonArray (map (jsonText . pointBitsText) [p,q,r]))
            ]
      in (textNode nid pos size payload) `withColor` Just (PresetColor 5)

emitClauseEvents :: EmitOptions -> CanonTriple -> [CanvasEvent]
emitClauseEvents EmitOptions{..} CanonTriple{..} =
  [EvAddNode clauseNode] <>
  pointEdges <>
  lineEdges <>
  centroidEvents
  where
    Evidence{..} = ctEvidence
    charLength = max 0 (evSpanEnd - evSpanStart)

    clauseNodeId :: NodeId
    clauseNodeId =
      let h = shortHashHex16 (ctDoc <> "|" <> T.pack (show evSpanStart) <> "|" <> T.pack (show evSpanEnd))
      in NodeId ("MM:CLAUSE:" <> h)

    clauseNode :: Node
    clauseNode =
      let payload = jsonObj
            [ ("kind", jsonText "mnemonic.clause")
            , ("doc", jsonText ctDoc)
            , ("evidence", jsonObj
                [ ("doc_bytes", jsonInt evDocBytes)
                , ("doc_lines", jsonInt evDocLines)
                , ("span_start", jsonInt evSpanStart)
                , ("span_end", jsonInt evSpanEnd)
                , ("line_length_bytes", jsonInt evLineLength)
                , ("char_length", jsonInt charLength)
                ])
            ]
      in (textNode clauseNodeId (evDocBytes, evDocLines) (evSpanStart, charLength) payload)
           `withColor` Just (PresetColor 1)

    a = hashS ctVersions (tSubject ctTriple)
    b = hashO ctVersions (tObject ctTriple)
    c = hashP ctVersions (tPredicate ctTriple)

    pointEdges :: [CanvasEvent]
    pointEdges = flip map allPoints $ \p ->
      let v = pointValue ctVersions ctTriple p
          payload = jsonObj
            [ ("kind", jsonText "mnemonic.point.value")
            , ("point", jsonText (pointBitsText p))
            , ("value_u64", jsonWord64 v)
            , ("generators", jsonObj
                [ ("A_S_u64", jsonWord64 a)
                , ("B_O_u64", jsonWord64 b)
                , ("C_P_u64", jsonWord64 c)
                ])
            , ("versions", jsonObj
                [ ("lexicon", jsonText (lexiconVersion ctVersions))
                , ("parser", jsonText (parserVersion ctVersions))
                ])
            ]
          eid = EdgeId ("MM:E:" <> shortHashHex16 (unNodeId clauseNodeId <> ":P:" <> pointBitsText p))
      in EvAddEdge $ (edge eid clauseNodeId (pointNodeId p)) `withEdgeLabel` Just payload

    lineEdges :: [CanvasEvent]
    lineEdges = flip map allLines $ \(Line name (p,q,r)) ->
      let vp = pointValue ctVersions ctTriple p
          vq = pointValue ctVersions ctTriple q
          vr = pointValue ctVersions ctTriple r
          ok = (vp `xor` vq `xor` vr) == 0
          payload = jsonObj
            [ ("kind", jsonText "mnemonic.line.invariant")
            , ("line", jsonText name)
            , ("points", jsonArray (map (jsonText . pointBitsText) [p,q,r]))
            , ("xor_ok", jsonBool ok)
            ]
          eid = EdgeId ("MM:E:" <> shortHashHex16 (unNodeId clauseNodeId <> ":L:" <> name))
      in EvAddEdge $ (edge eid clauseNodeId (lineNodeId name)) `withEdgeLabel` Just payload

    centroidEvents :: [CanvasEvent]
    centroidEvents
      | not eoCentroid = []
      | otherwise =
          let nid = NodeId ("MM:OBSERVER:" <> shortHashHex16 (unNodeId clauseNodeId))
              payload = jsonObj
                [ ("kind", jsonText "mnemonic.observer")
                , ("closure_ratio", T.pack (show (closureRatio ctVersions ctTriple)))
                , ("stop_metric", T.pack (show (stopMetric ctVersions ctTriple)))
                , ("sabbath", jsonBool (sabbath ctVersions ctTriple))
                ]
              node = (textNode nid (evDocBytes, evDocLines + 40) (240, 80) payload) `withColor` Just (PresetColor 6)
              eid = EdgeId ("MM:E:" <> shortHashHex16 (unNodeId clauseNodeId <> ":OBSERVER"))
              e = (edge eid clauseNodeId nid) `withEdgeLabel` Just (jsonObj [("kind", jsonText "mnemonic.observer.link")])
          in [EvAddNode node, EvAddEdge e]

pointNodeId :: Point -> NodeId
pointNodeId p = NodeId ("MM:POINT:" <> pointBitsText p)

lineNodeId :: Text -> NodeId
lineNodeId name = NodeId ("MM:LINE:" <> name)
