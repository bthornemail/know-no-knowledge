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

Then drop a file like `build/docs/mnemonic-manifold.events.ndjson` onto the app.

