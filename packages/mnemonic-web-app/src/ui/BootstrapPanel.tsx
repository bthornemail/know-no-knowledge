import React from "react";

export function BootstrapPanel({
  onLoadSampleCanvas,
  onLoadSampleCanon,
  onLoadDemoWwltt,
  onPickFile
}: {
  onLoadSampleCanvas: () => void;
  onLoadSampleCanon: () => void;
  onLoadDemoWwltt: () => void;
  onPickFile: () => void;
}) {
  return (
    <div style={{ padding: 18, maxWidth: 860 }}>
      <h2 style={{ marginTop: 0, marginBottom: 6 }}>Mnemonic Manifold (SVG-first)</h2>
      <div style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.5 }}>
        Load an NDJSON stream and explore deterministically. Canonical data stays
        append-only; the UI is a pure projection (nodes geometry-only, semantics
        on edges).
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
        <button className="btn" onClick={onPickFile}>
          Open NDJSON…
        </button>
        <button className="btn" onClick={onLoadDemoWwltt}>
          Load demo (WWLTT story)
        </button>
        <button className="btn" onClick={onLoadSampleCanvas}>
          Load sample (Canvas events)
        </button>
        <button className="btn" onClick={onLoadSampleCanon}>
          Load sample (canon SPO)
        </button>
      </div>

      <div style={{ marginTop: 16, fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
        Recommended files from this repo:
        <ul style={{ marginTop: 8, paddingLeft: 16 }}>
          <li>
            Canvas events: <code>build/docs/mnemonic-manifold.events.ndjson</code>
          </li>
          <li>
            Canon IR: <code>build/docs/ndjson/all.ndjson</code>
          </li>
          <li>
            Manifest: <code>build/docs/manifest.json</code> (for build identity / integrity)
          </li>
          <li>
            Demo (WWLTT articles): run <code>make demo-wwltt demo-wwltt-emit</code> then open{" "}
            <code>build/demo/wwltt/mnemonic-manifold.events.ndjson</code>. For one-click loading in the web UI, also run{" "}
            <code>make web-demo-wwltt</code>.
          </li>
        </ul>
      </div>
    </div>
  );
}
