import type { CanvasEvent, CanvasNode, CanvasEdge } from "./ndjson";

export type SceneNode = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  raw: CanvasNode;
};

export type SceneEdge = {
  id: string;
  from: string;
  to: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  raw: CanvasEdge;
};

export type Scene = {
  nodes: SceneNode[];
  edges: SceneEdge[];
  nodesById: Map<string, CanvasNode>;
};

export function buildScene(events: CanvasEvent[]): Scene {
  const nodesById = new Map<string, CanvasNode>();
  const edges: CanvasEdge[] = [];

  for (const ev of events) {
    if (ev && (ev as any).op === "addNode" && (ev as any).node) {
      const n = (ev as any).node as CanvasNode;
      nodesById.set(n.id, n);
    } else if (ev && (ev as any).op === "addEdge" && (ev as any).edge) {
      edges.push((ev as any).edge as CanvasEdge);
    }
  }

  const nodes: SceneNode[] = [...nodesById.values()]
    .map((n) => ({
      id: n.id,
      x: n.x,
      y: n.y,
      w: n.width,
      h: n.height,
      raw: n
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  const centers = new Map<string, { cx: number; cy: number }>();
  for (const n of nodes) {
    centers.set(n.id, { cx: n.x + n.w / 2, cy: n.y + n.h / 2 });
  }

  const sceneEdges: SceneEdge[] = edges
    .map((e) => {
      const a = centers.get(e.fromNode) ?? { cx: 0, cy: 0 };
      const b = centers.get(e.toNode) ?? { cx: 0, cy: 0 };
      return {
        id: e.id,
        from: e.fromNode,
        to: e.toNode,
        x1: a.cx,
        y1: a.cy,
        x2: b.cx,
        y2: b.cy,
        raw: e
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));

  return { nodes, edges: sceneEdges, nodesById };
}
