import React, { useEffect, useMemo, useRef, useState } from "react";
import { parseCanvasEventsNdjson, parseNdjsonObjects } from "../world/ndjson";
import { buildScene } from "../world/scene";
import { BlackboardView } from "./BlackboardView";
import { WhiteboardView } from "./WhiteboardView";
import { extractCanonTriples } from "../world/canon";
import { classifyTriples } from "../spo/tripleClassifier";
import { SPOTreeBuilder } from "../spo/treeBuilder";
import { SPOTreePanel } from "./SPOTreePanel";
import { MiniMap } from "./MiniMap";
import { cameraDefault } from "./camera";
import { useElementSize } from "./useElementSize";
import { indexCanvasScene } from "../world/canvasMeta";
import { ComparePanel } from "./ComparePanel";
import { BootstrapPanel } from "./BootstrapPanel";

export function App() {
  const [raw, setRaw] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"canvas" | "spo">("canvas");
  const [appMode, setAppMode] = useState<"single" | "compare">("single");
  const [viewMode, setViewMode] = useState<"svg" | "diagram">("diagram");
  const [scopeMode, setScopeMode] = useState<"world" | "layer" | "node">("world");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [svgCamera, setSvgCamera] = useState(cameraDefault());
  const [diagramCamera, setDiagramCamera] = useState(cameraDefault());
  const [viewportPx, setViewportPx] = useState({ w: 0, h: 0 });
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const canvasSize = useElementSize(canvasHostRef);

  const [rawA, setRawA] = useState<string | null>(null);
  const [rawB, setRawB] = useState<string | null>(null);
  const [compareError, setCompareError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const manifestInputRef = useRef<HTMLInputElement>(null);
  const manifestAInputRef = useRef<HTMLInputElement>(null);
  const manifestBInputRef = useRef<HTMLInputElement>(null);
  const [buildRoot, setBuildRoot] = useState<string | null>(null);
  const [buildRootA, setBuildRootA] = useState<string | null>(null);
  const [buildRootB, setBuildRootB] = useState<string | null>(null);
  const [autoBootTried, setAutoBootTried] = useState(false);

  useEffect(() => {
    setViewportPx(canvasSize);
  }, [canvasSize]);

  const parsed = useMemo(() => {
    if (!raw) return null;
    try {
      const values = parseNdjsonObjects(raw);
      return values;
    } catch (e) {
      return null;
    }
  }, [raw]);

  const scene = useMemo(() => {
    if (!parsed) return null;
    try {
      const events = parsed as any[];
      const maybeCanvas = events.some((v) => v && typeof v === "object" && (v as any).op);
      if (!maybeCanvas) return null;
      return buildScene(parseCanvasEventsNdjson(raw!));
    } catch {
      return null;
    }
  }, [parsed, raw]);

  const canvasMeta = useMemo(() => {
    if (!scene) return null;
    return indexCanvasScene(scene);
  }, [scene]);

  const spo = useMemo(() => {
    if (!parsed) return null;
    const triples = extractCanonTriples(parsed);
    if (triples.length === 0) return null;
    const classified = classifyTriples(triples);
    const tree = new SPOTreeBuilder().build(classified);
    return { triples, tree };
  }, [parsed]);

  const parsedA = useMemo(() => {
    if (!rawA) return null;
    try {
      return parseNdjsonObjects(rawA);
    } catch {
      return null;
    }
  }, [rawA]);

  const parsedB = useMemo(() => {
    if (!rawB) return null;
    try {
      return parseNdjsonObjects(rawB);
    } catch {
      return null;
    }
  }, [rawB]);

  const spoA = useMemo(() => {
    if (!parsedA) return null;
    return extractCanonTriples(parsedA);
  }, [parsedA]);

  const spoB = useMemo(() => {
    if (!parsedB) return null;
    return extractCanonTriples(parsedB);
  }, [parsedB]);

  async function onDrop(ev: React.DragEvent) {
    ev.preventDefault();
    setError(null);
    const f = ev.dataTransfer.files?.[0];
    if (!f) return;
    const text = await f.text();
    await loadSingleText(text);
  }

  async function loadSingleText(text: string) {
    try {
      parseNdjsonObjects(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return;
    }
    setRaw(text);
    const values = parseNdjsonObjects(text);
    const hasCanvas = values.some((v) => (v as any)?.op === "addNode" || (v as any)?.op === "addEdge");
    const hasSPO = extractCanonTriples(values).length > 0;
    if (hasSPO && !hasCanvas) setMode("spo");
    else setMode("canvas");
    setSelectedNodeId(null);
    setScopeMode("world");
    setActiveLayerId(null);
  }

  async function onDropCompare(which: "A" | "B", ev: React.DragEvent) {
    ev.preventDefault();
    setCompareError(null);
    const f = ev.dataTransfer.files?.[0];
    if (!f) return;
    const text = await f.text();
    try {
      parseNdjsonObjects(text);
    } catch (e) {
      setCompareError(e instanceof Error ? e.message : String(e));
      return;
    }
    if (which === "A") setRawA(text);
    else setRawB(text);
  }

  async function loadCompareSample() {
    setCompareError(null);
    try {
      const [a, b] = await Promise.all([
        fetch("/sample.canon.a.ndjson").then((r) => r.text()),
        fetch("/sample.canon.b.ndjson").then((r) => r.text())
      ]);
      setRawA(a);
      setRawB(b);
    } catch (e) {
      setCompareError(e instanceof Error ? e.message : String(e));
    }
  }

  async function loadSampleCanvas() {
    setError(null);
    try {
      const text = await fetch("/sample.canvas.ndjson").then((r) => r.text());
      await loadSingleText(text);
      setMode("canvas");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function loadSampleCanon() {
    setError(null);
    try {
      const text = await fetch("/sample.canon.a.ndjson").then((r) => r.text());
      await loadSingleText(text);
      setMode("spo");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function loadDemoWwltt() {
    setError(null);
    try {
      const [events, manifest] = await Promise.all([
        fetch("/demo/wwltt/mnemonic-manifold.events.ndjson").then((r) => {
          if (!r.ok) throw new Error("WWLTT demo not found. Run `make web-demo-wwltt`.");
          return r.text();
        }),
        fetch("/demo/wwltt/manifest.json").then((r) => (r.ok ? r.json() : null))
      ]);
      await loadSingleText(events);
      setMode("canvas");
      const root = typeof (manifest as any)?.root_sha256 === "string" ? (manifest as any).root_sha256 : null;
      setBuildRoot(root);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function loadManifestFile(
    f: File,
    setRoot: (v: string | null) => void,
    setErr: (v: string | null) => void
  ) {
    try {
      const text = await f.text();
      const j = JSON.parse(text);
      const root = typeof j?.root_sha256 === "string" ? j.root_sha256 : null;
      if (!root) throw new Error("manifest.json missing `root_sha256`");
      setRoot(root);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setRoot(null);
    }
  }

  useEffect(() => {
    if (autoBootTried) return;
    if (raw) return;
    if (appMode !== "single") return;
    setAutoBootTried(true);
    fetch("/demo/wwltt/mnemonic-manifold.events.ndjson", { method: "HEAD" })
      .then((r) => {
        if (r.ok) loadDemoWwltt();
      })
      .catch(() => {});
  }, [autoBootTried, raw, appMode]);

  return (
    <div
      className="app"
      onDragOver={(e) => e.preventDefault()}
      onDrop={appMode === "single" ? onDrop : undefined}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".ndjson,.jsonl"
        style={{ display: "none" }}
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const text = await f.text();
          await loadSingleText(text);
          e.target.value = "";
        }}
      />
      <input
        ref={manifestInputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: "none" }}
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          await loadManifestFile(f, setBuildRoot, setError);
          e.target.value = "";
        }}
      />
      <input
        ref={manifestAInputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: "none" }}
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          await loadManifestFile(f, setBuildRootA, setCompareError);
          e.target.value = "";
        }}
      />
      <input
        ref={manifestBInputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: "none" }}
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          await loadManifestFile(f, setBuildRootB, setCompareError);
          e.target.value = "";
        }}
      />
      <div className="topbar">
        <div className="title">Mnemonic Manifold</div>
        <div className="hint">
          {appMode === "single" ? (
            <>
              Drop <code>*.ndjson</code> (Canvas events or canon SPO records)
            </>
          ) : (
            <>
              Compare: drop two canon NDJSON streams (explicit{" "}
              <code>{"{subject,predicate,object}"}</code> and/or prose{" "}
              <code>{"{event:\"paragraph\",text,...}"}</code>)
            </>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            className="btn"
            onClick={() => setAppMode("single")}
            aria-pressed={appMode === "single"}
          >
            Single
          </button>
          <button
            className="btn"
            onClick={() => setAppMode("compare")}
            aria-pressed={appMode === "compare"}
          >
            Compare
          </button>
        </div>
        {appMode === "single" && raw && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button className="btn" onClick={() => setMode("canvas")} aria-pressed={mode === "canvas"}>
              Canvas
            </button>
            <button className="btn" onClick={() => setMode("spo")} aria-pressed={mode === "spo"}>
              SPO
            </button>
          </div>
        )}
        {appMode === "single" && raw && (
          <button className="btn" onClick={() => setRaw(null)}>
            Clear
          </button>
        )}
      </div>

      <div className="sidebar">
        <h3 style={{ marginTop: 0 }}>Corpus</h3>
        <div style={{ color: "var(--muted)", fontSize: 13 }}>
          This starter UI renders deterministically (stable ordering by id). It
          does not mutate canonical state.
        </div>
        {appMode === "single" && raw && (
          <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
            <button className="btn" onClick={() => manifestInputRef.current?.click()}>
              Load manifest…
            </button>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              build.root: <code>{buildRoot ?? "∅"}</code>
            </div>
          </div>
        )}
        {appMode === "compare" && (
          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn" onClick={() => manifestAInputRef.current?.click()}>
              Manifest A…
            </button>
            <button className="btn" onClick={() => manifestBInputRef.current?.click()}>
              Manifest B…
            </button>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              A: <code>{buildRootA ?? "∅"}</code> · B: <code>{buildRootB ?? "∅"}</code>
            </div>
          </div>
        )}
        {error && (
          <pre style={{ whiteSpace: "pre-wrap", color: "#ff8a8a" }}>
            {error}
          </pre>
        )}
        {compareError && (
          <pre style={{ whiteSpace: "pre-wrap", color: "#ff8a8a" }}>
            {compareError}
          </pre>
        )}
        {mode === "canvas" && scene && (
          <div style={{ marginTop: 12, fontSize: 13, color: "var(--muted)" }}>
            <div>Nodes: {scene.nodes.length}</div>
            <div>Edges: {scene.edges.length}</div>
          </div>
        )}
        {mode === "spo" && spo && (
          <div style={{ marginTop: 12, fontSize: 13, color: "var(--muted)" }}>
            <div>Triples: {spo.triples.length}</div>
            <div>Nodes: {spo.tree.stats.total_nodes}</div>
            <div>Edges: {spo.tree.stats.total_edges}</div>
          </div>
        )}
      </div>

      <div className="main">
        {appMode === "compare" ? (
          <div className="compare">
            <div
              className="compareDrop"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDropCompare("A", e)}
            >
              <div style={{ fontSize: 12, color: "var(--muted)" }}>A</div>
              <div style={{ fontSize: 13 }}>
                Drop canon NDJSON (e.g. <code>build/docs/ndjson/all.ndjson</code>)
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                Manifest: <code>{buildRootA ?? "∅"}</code>
              </div>
              {rawA && (
                <div style={{ marginTop: 8, fontSize: 12, color: "var(--muted)" }}>
                  Loaded ({(parsedA?.length ?? 0).toLocaleString()} records)
                </div>
              )}
            </div>
            <div
              className="compareDrop"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDropCompare("B", e)}
            >
              <div style={{ fontSize: 12, color: "var(--muted)" }}>B</div>
              <div style={{ fontSize: 13 }}>
                Drop canon NDJSON (e.g. <code>build/docs/ndjson/all.ndjson</code>)
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                Manifest: <code>{buildRootB ?? "∅"}</code>
              </div>
              {rawB && (
                <div style={{ marginTop: 8, fontSize: 12, color: "var(--muted)" }}>
                  Loaded ({(parsedB?.length ?? 0).toLocaleString()} records)
                </div>
              )}
            </div>
            <div className="compareBody">
              {parsedA && parsedB && spoA && spoB ? (
                <div style={{ padding: 12, overflow: "auto", height: "100%" }}>
                  <ComparePanel
                    valuesA={parsedA}
                    triplesA={spoA}
                    valuesB={parsedB}
                    triplesB={spoB}
                    buildRootA={buildRootA ?? undefined}
                    buildRootB={buildRootB ?? undefined}
                  />
                </div>
              ) : (
                <div className="drop" style={{ position: "relative", margin: 12 }}>
                  <div style={{ display: "grid", gap: 10, justifyItems: "center" }}>
                    <div>Load A and B to compute deterministic deltas.</div>
                    <button className="btn" onClick={loadCompareSample}>
                      Load compare samples
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : !raw ? (
          <div className="boot">
            <BootstrapPanel
              onPickFile={() => fileInputRef.current?.click()}
              onLoadDemoWwltt={loadDemoWwltt}
              onLoadSampleCanvas={loadSampleCanvas}
              onLoadSampleCanon={loadSampleCanon}
            />
          </div>
        ) : mode === "canvas" ? (
          <div
            className="pane"
            ref={canvasHostRef}
            style={{ height: "100%", position: "relative" }}
          >
            <div className="paneHeader">
              {viewMode === "diagram" ? "Blackboard (diagram)" : "Whiteboard (SVG explorer)"}
            </div>
            {scene ? (
              viewMode === "diagram" ? (
                <BlackboardView
                  scene={scene}
                  camera={diagramCamera}
                  onCameraChange={setDiagramCamera}
                  onSelectNodeId={(id) => setSelectedNodeId(id)}
                />
              ) : (
                <WhiteboardView
                  scene={scene}
                  camera={svgCamera}
                  onCameraChange={setSvgCamera}
                  onSelectNodeId={(id) => setSelectedNodeId(id)}
                />
              )
            ) : (
              <div className="drop" style={{ fontSize: 13 }}>
                Not a Canvas event stream (no <code>op:addNode</code>/<code>op:addEdge</code> records).
              </div>
            )}

            {scene && (
              <MiniMap
                scene={scene}
                activeViewMode={viewMode}
                scopeMode={scopeMode}
                activeLayerId={activeLayerId}
                selectedNodeId={selectedNodeId}
                metaByNodeId={canvasMeta ?? new Map()}
                svgCamera={svgCamera}
                diagramCamera={diagramCamera}
                viewportPx={viewportPx}
                onSetViewMode={setViewMode}
                onSetScopeMode={setScopeMode}
                onSetActiveLayerId={setActiveLayerId}
                onSetSelectedNodeId={setSelectedNodeId}
                onSetSvgCamera={setSvgCamera}
                onSetDiagramCamera={setDiagramCamera}
              />
            )}
          </div>
        ) : (
          <div className="pane" style={{ height: "100%" }}>
            <div className="paneHeader">SPO Tree (shadow analysis)</div>
            <div style={{ padding: 12, overflow: "auto", height: "100%" }}>
              {spo ? (
                <SPOTreePanel triples={spo.triples} tree={spo.tree} buildRootSha256={buildRoot ?? undefined} />
              ) : (
                <div style={{ color: "var(--muted)", fontSize: 13 }}>
                  No <code>{"{subject,predicate,object}"}</code> records detected
                  in this NDJSON stream.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="sidebar right">
        <h3 style={{ marginTop: 0 }}>Inspector</h3>
        <div style={{ color: "var(--muted)", fontSize: 13 }}>
          {appMode === "compare" ? (
            <div>
              Compare mode: deltas are computed deterministically from explicit
              SPO records plus a shadow SPO overlay derived from prose paragraph
              events (when present). No canonical mutation.
            </div>
          ) : mode === "canvas" ? (
            <div>
              <div>
                View: <code>{viewMode}</code>
              </div>
              <div>
                Scope: <code>{scopeMode}</code>
              </div>
              {activeLayerId && (
                <div>
                  Layer: <code>{activeLayerId}</code>
                </div>
              )}
              <div>
                Selected:{" "}
                <code>{selectedNodeId ?? "∅"}</code>
              </div>
              {scene && selectedNodeId && (
                <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, marginTop: 10 }}>
                  {JSON.stringify(scene.nodesById.get(selectedNodeId), null, 2)}
                </pre>
              )}
            </div>
          ) : (
            <div>
              SPO shadow analysis; no canonical mutation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
