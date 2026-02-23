import React, { useMemo, useState } from "react";
import { parseCanvasEventsNdjson } from "../world/ndjson";
import { buildScene } from "../world/scene";
import { BlackboardView } from "./BlackboardView";
import { WhiteboardView } from "./WhiteboardView";

export function App() {
  const [raw, setRaw] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scene = useMemo(() => {
    if (!raw) return null;
    try {
      const events = parseCanvasEventsNdjson(raw);
      return buildScene(events);
    } catch (e) {
      return null;
    }
  }, [raw]);

  async function onDrop(ev: React.DragEvent) {
    ev.preventDefault();
    setError(null);
    const f = ev.dataTransfer.files?.[0];
    if (!f) return;
    const text = await f.text();
    try {
      parseCanvasEventsNdjson(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return;
    }
    setRaw(text);
  }

  return (
    <div
      className="app"
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <div className="topbar">
        <div className="title">Mnemonic Manifold</div>
        <div className="hint">
          Drop <code>*.ndjson</code> Canvas events (e.g.{" "}
          <code>mnemonic-manifold.events.ndjson</code>)
        </div>
        {raw && (
          <button className="btn" onClick={() => setRaw(null)}>
            Clear
          </button>
        )}
      </div>

      <div className="sidebar">
        <h3 style={{ marginTop: 0 }}>Corpus</h3>
        <div style={{ color: "var(--muted)", fontSize: 13 }}>
          This starter UI renders the event stream deterministically (sort by
          node/edge id). It does not mutate canonical state.
        </div>
        {error && (
          <pre style={{ whiteSpace: "pre-wrap", color: "#ff8a8a" }}>
            {error}
          </pre>
        )}
        {scene && (
          <div style={{ marginTop: 12, fontSize: 13, color: "var(--muted)" }}>
            <div>Nodes: {scene.nodes.length}</div>
            <div>Edges: {scene.edges.length}</div>
          </div>
        )}
      </div>

      <div className="main">
        {!scene ? (
          <div className="drop">
            Drop a Canvas NDJSON event stream here.
          </div>
        ) : (
          <div className="split">
            <div className="pane">
              <div className="paneHeader">Blackboard (diagram)</div>
              <BlackboardView scene={scene} />
            </div>
            <div className="pane">
              <div className="paneHeader">Whiteboard (SVG explorer)</div>
              <WhiteboardView scene={scene} />
            </div>
          </div>
        )}
      </div>

      <div className="sidebar right">
        <h3 style={{ marginTop: 0 }}>Inspector</h3>
        <div style={{ color: "var(--muted)", fontSize: 13 }}>
          Placeholder panel (timeline/search/WinkNLP can be layered here without
          altering canonical data).
        </div>
      </div>
    </div>
  );
}

