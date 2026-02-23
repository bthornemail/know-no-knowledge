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
- Use **Compare** mode to drop two canon NDJSON streams and view deterministic predicate/entity deltas.

## Optional: WinkNLP

The `src/wink/WinkNLPProcessor.ts` loader attempts to dynamically import WinkNLP packages (behind a runtime check).
To enable it, install:

```bash
npm install wink-nlp wink-eng-lite-web-model wink-bm25-text-search
```
