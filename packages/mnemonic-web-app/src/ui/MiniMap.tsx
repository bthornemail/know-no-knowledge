import React, { useMemo, useRef, useState } from "react";
import type { Scene } from "../world/scene";
import type { Bounds, Camera } from "./camera";
import { boundsOfRects, visibleWorldBounds } from "./camera";
import type { CanvasNodeMeta } from "../world/canvasMeta";

type ViewMode = "svg" | "diagram";
type ScopeMode = "world" | "layer" | "node";

export function MiniMap({
  scene,
  activeViewMode,
  scopeMode,
  activeLayerId,
  selectedNodeId,
  metaByNodeId,
  svgCamera,
  diagramCamera,
  viewportPx,
  onSetViewMode,
  onSetScopeMode,
  onSetActiveLayerId,
  onSetSelectedNodeId,
  onSetSvgCamera,
  onSetDiagramCamera
}: {
  scene: Scene;
  activeViewMode: ViewMode;
  scopeMode: ScopeMode;
  activeLayerId: string | null;
  selectedNodeId: string | null;
  metaByNodeId: Map<string, CanvasNodeMeta>;
  svgCamera: Camera;
  diagramCamera: Camera;
  viewportPx: { w: number; h: number };
  onSetViewMode: (m: ViewMode) => void;
  onSetScopeMode: (m: ScopeMode) => void;
  onSetActiveLayerId: (id: string | null) => void;
  onSetSelectedNodeId: (id: string | null) => void;
  onSetSvgCamera: (c: Camera) => void;
  onSetDiagramCamera: (c: Camera) => void;
}) {
  const w = 200;
  const h = 200;
  const pad = 8;
  const svgRef = useRef<SVGSVGElement>(null);

  const worldNodes = useMemo(() => scene.nodes, [scene]);

  const layerNodes = useMemo(() => {
    if (!activeLayerId) return worldNodes;
    return worldNodes.filter((n) => metaByNodeId.get(n.id)?.layer_id === activeLayerId);
  }, [activeLayerId, metaByNodeId, worldNodes]);

  const nodeNodes = useMemo(() => {
    if (!selectedNodeId) return layerNodes;
    // keep it simple: show the whole layer for node scope too (still deterministic),
    // but bounds will tighten to the selected node neighborhood.
    return layerNodes;
  }, [layerNodes, selectedNodeId]);

  const worldBounds = useMemo(() => {
    return boundsOfRects(worldNodes.map((n) => ({ x: n.x, y: n.y, w: n.w, h: n.h })));
  }, [worldNodes]);

  const layerBounds = useMemo(() => {
    return boundsOfRects(layerNodes.map((n) => ({ x: n.x, y: n.y, w: n.w, h: n.h })));
  }, [layerNodes]);

  const nodeBounds = useMemo((): Bounds | null => {
    if (!selectedNodeId) return null;
    const n = worldNodes.find((x) => x.id === selectedNodeId);
    if (!n) return null;
    const margin = 40;
    return {
      minX: n.x - margin,
      minY: n.y - margin,
      maxX: n.x + n.w + margin,
      maxY: n.y + n.h + margin
    };
  }, [scene, selectedNodeId]);

  const bounds =
    scopeMode === "node" && nodeBounds
      ? nodeBounds
      : scopeMode === "layer"
        ? layerBounds
        : worldBounds;

  const fit = useMemo(() => fitTo(bounds, w, h, pad), [bounds]);

  const activeCamera = activeViewMode === "svg" ? svgCamera : diagramCamera;
  const activeViewportWorld = useMemo(() => {
    if (viewportPx.w <= 0 || viewportPx.h <= 0) return null;
    return visibleWorldBounds(activeCamera, viewportPx);
  }, [activeCamera, viewportPx]);

  const viewportRectMini = useMemo(() => {
    if (!activeViewportWorld) return null;
    const a = worldToMini({ x: activeViewportWorld.minX, y: activeViewportWorld.minY }, fit);
    const b = worldToMini({ x: activeViewportWorld.maxX, y: activeViewportWorld.maxY }, fit);
    const x = Math.min(a.x, b.x);
    const y = Math.min(a.y, b.y);
    const rw = Math.abs(b.x - a.x);
    const rh = Math.abs(b.y - a.y);
    return { x, y, w: rw, h: rh };
  }, [activeViewportWorld, fit]);

  const [draggingViewport, setDraggingViewport] = useState<null | { startX: number; startY: number }>(
    null
  );

  function setActiveCamera(next: Camera) {
    if (activeViewMode === "svg") onSetSvgCamera(next);
    else onSetDiagramCamera(next);
  }

  function onPointerDown(ev: React.PointerEvent) {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r) return;
    const mx = ev.clientX - r.left;
    const my = ev.clientY - r.top;

    if (viewportRectMini && pointInRect(mx, my, viewportRectMini)) {
      (ev.currentTarget as any).setPointerCapture?.(ev.pointerId);
      setDraggingViewport({ startX: mx, startY: my });
      ev.preventDefault();
      return;
    }

    const world = miniToWorld({ x: mx, y: my }, fit);
    const visible = scopeMode === "layer" ? layerNodes : scopeMode === "node" ? nodeNodes : worldNodes;
    const hit = hitTest(visible, world.x, world.y);
    if (hit) {
      onSetSelectedNodeId(hit.id);
      onSetScopeMode("node");
      const nodeMeta = metaByNodeId.get(hit.id);
      if (nodeMeta?.layer_id) onSetActiveLayerId(nodeMeta.layer_id);
      const forced = ev.shiftKey
        ? "svg"
        : ev.altKey
          ? "diagram"
          : inferViewModeFromMeta(nodeMeta);
      onSetViewMode(forced);
      focusNode(hit, forced);
      return;
    }

    // background: pan to clicked point
    const cam = activeCamera;
    const targetScreen = { x: viewportPx.w / 2, y: viewportPx.h / 2 };
    const tx = targetScreen.x - world.x * cam.k;
    const ty = targetScreen.y - world.y * cam.k;
    setActiveCamera({ ...cam, tx, ty });
  }

  function focusNode(node: { x: number; y: number; w: number; h: number }, mode: ViewMode) {
    const cam = mode === "svg" ? svgCamera : diagramCamera;
    const cx = node.x + node.w / 2;
    const cy = node.y + node.h / 2;
    const targetScreen = { x: viewportPx.w / 2, y: viewportPx.h / 2 };
    const tx = targetScreen.x - cx * cam.k;
    const ty = targetScreen.y - cy * cam.k;
    const next = { ...cam, tx, ty };
    if (mode === "svg") onSetSvgCamera(next);
    else onSetDiagramCamera(next);
  }

  function onPointerMove(ev: React.PointerEvent) {
    if (!draggingViewport) return;
    const r = svgRef.current?.getBoundingClientRect();
    if (!r) return;
    const mx = ev.clientX - r.left;
    const my = ev.clientY - r.top;
    const dx = mx - draggingViewport.startX;
    const dy = my - draggingViewport.startY;
    setDraggingViewport({ startX: mx, startY: my });

    // delta in minimap coords → delta in world coords → pan camera
    const dwx = dx / fit.scale;
    const dwy = dy / fit.scale;
    const cam = activeCamera;
    setActiveCamera({ ...cam, tx: cam.tx - dwx * cam.k, ty: cam.ty - dwy * cam.k });
  }

  function onPointerUp(ev: React.PointerEvent) {
    if (!draggingViewport) return;
    (ev.currentTarget as any).releasePointerCapture?.(ev.pointerId);
    setDraggingViewport(null);
  }

  return (
    <div
      style={{
        position: "absolute",
        left: 12,
        bottom: 12,
        width: w,
        height: h + 34,
        background: "rgba(11,15,20,0.85)",
        border: "1px solid #223041",
        borderRadius: 10,
        overflow: "hidden",
        backdropFilter: "blur(8px)"
      }}
    >
      <div style={{ display: "flex", gap: 6, padding: "6px 8px", borderBottom: "1px solid #223041" }}>
        <button className="btn" onClick={() => onSetViewMode("svg")} aria-pressed={activeViewMode === "svg"}>
          SVG
        </button>
        <button
          className="btn"
          onClick={() => onSetViewMode("diagram")}
          aria-pressed={activeViewMode === "diagram"}
        >
          Diagram
        </button>
        <div style={{ flex: 1 }} />
        <button className="btn" onClick={() => onSetScopeMode("world")} aria-pressed={scopeMode === "world"}>
          World
        </button>
        <button className="btn" onClick={() => onSetScopeMode("layer")} aria-pressed={scopeMode === "layer"}>
          Layer
        </button>
        <button className="btn" onClick={() => onSetScopeMode("node")} aria-pressed={scopeMode === "node"}>
          Node
        </button>
      </div>

      <svg
        ref={svgRef}
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ display: "block", touchAction: "none" }}
      >
        <g>
          {(scopeMode === "layer" ? scene.edges.filter((e) => inLayer(metaByNodeId, activeLayerId, e.from, e.to)) : scene.edges)
            .slice(0, 1200)
            .map((e) => {
            const a = worldToMini({ x: e.x1, y: e.y1 }, fit);
            const b = worldToMini({ x: e.x2, y: e.y2 }, fit);
            return (
              <line
                key={e.id}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#223041"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
                opacity={0.6}
              />
            );
          })}
        </g>
        <g>
          {(scopeMode === "layer" ? layerNodes : scene.nodes).map((n) => {
            const a = worldToMini({ x: n.x, y: n.y }, fit);
            const b = worldToMini({ x: n.x + Math.max(2, n.w), y: n.y + Math.max(2, n.h) }, fit);
            const x = Math.min(a.x, b.x);
            const y = Math.min(a.y, b.y);
            const rw = Math.max(2, Math.abs(b.x - a.x));
            const rh = Math.max(2, Math.abs(b.y - a.y));
            const isSelected = selectedNodeId === n.id;
            return (
              <rect
                key={n.id}
                x={x}
                y={y}
                width={rw}
                height={rh}
                fill={isSelected ? "#6aa6ff" : "#0f1620"}
                stroke={isSelected ? "#b9d5ff" : "#31465f"}
                opacity={isSelected ? 1 : 0.9}
              />
            );
          })}
        </g>

        {viewportRectMini && (
          <rect
            x={viewportRectMini.x}
            y={viewportRectMini.y}
            width={viewportRectMini.w}
            height={viewportRectMini.h}
            fill="none"
            stroke="#6aa6ff"
            strokeWidth={2}
          />
        )}
      </svg>
    </div>
  );
}

function inferViewModeFromMeta(meta: CanvasNodeMeta | undefined): ViewMode {
  if (meta?.kind === "doc") return "svg";
  return "diagram";
}

function hitTest(nodes: Scene["nodes"], wx: number, wy: number): { id: string; x: number; y: number; w: number; h: number } | null {
  const hits = nodes.filter((n) => wx >= n.x && wx <= n.x + n.w && wy >= n.y && wy <= n.y + n.h);
  if (hits.length === 0) return null;
  hits.sort((a, b) => a.id.localeCompare(b.id));
  const n = hits[0]!;
  return { id: n.id, x: n.x, y: n.y, w: n.w, h: n.h };
}

function pointInRect(x: number, y: number, r: { x: number; y: number; w: number; h: number }): boolean {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

function fitTo(bounds: Bounds, w: number, h: number, pad: number) {
  const bw = bounds.maxX - bounds.minX || 1;
  const bh = bounds.maxY - bounds.minY || 1;
  const sx = (w - pad * 2) / bw;
  const sy = (h - pad * 2) / bh;
  const scale = Math.min(sx, sy);
  const tx = pad - bounds.minX * scale;
  const ty = pad - bounds.minY * scale;
  return { scale, tx, ty };
}

function worldToMini(p: { x: number; y: number }, fit: { scale: number; tx: number; ty: number }) {
  return { x: p.x * fit.scale + fit.tx, y: p.y * fit.scale + fit.ty };
}

function miniToWorld(p: { x: number; y: number }, fit: { scale: number; tx: number; ty: number }) {
  return { x: (p.x - fit.tx) / fit.scale, y: (p.y - fit.ty) / fit.scale };
}

function inLayer(
  metaByNodeId: Map<string, CanvasNodeMeta>,
  activeLayerId: string | null,
  fromId: string,
  toId: string
): boolean {
  if (!activeLayerId) return true;
  const a = metaByNodeId.get(fromId)?.layer_id;
  const b = metaByNodeId.get(toId)?.layer_id;
  return a === activeLayerId && b === activeLayerId;
}
