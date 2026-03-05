# Mnemonic Manifold Web App (Starter)

Dual-canvas UI for exploring `json-canvas` NDJSON event streams.

## Goals (v0)

- Load Canvas NDJSON events (`ulp.canvas.event.v0.1`) and render deterministically.
- Keep **nodes geometry-only**; show semantics only via edges/labels.
- Provide two synchronized views:
  - **Blackboard**: diagram view (nodes + edges).
  - **Whiteboard**: SVG explorer (same scene, different camera).

## Dev

```bash
cd packages/mnemonic-web-app
npm install
npm run dev
```

Then drop one of these onto the app:

- Canvas NDJSON events (e.g. `build/docs/mnemonic-manifold.events.ndjson`)
- Canon NDJSON with `{subject,predicate,object}` records (renders an SPO tree shadow view)
- Canon NDJSON with prose paragraph events (`{event:"paragraph",text,...}`) also works: the UI derives a deterministic, edge-only SPO overlay from simple patterns (shadow only; no canonical mutation).
- Use **Compare** mode to drop two canon NDJSON streams and view deterministic face/entity deltas.

## Demo: WWLTT story set

To generate demo outputs from the repo’s story corpus and make them available as one-click loads in the UI:

```bash
make web-demo-wwltt
```

Then run the web app and click **Load demo (WWLTT story)** (it also auto-loads if the demo files are present).

## Optional: WinkNLP

The `src/wink/WinkNLPProcessor.ts` loader attempts to dynamically import WinkNLP packages (behind a runtime check).
To enable it, install:

```bash
npm install wink-nlp wink-eng-lite-web-model wink-bm25-text-search
```
