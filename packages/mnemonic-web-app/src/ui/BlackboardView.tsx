import React, { useMemo } from "react";
import type { Scene } from "../world/scene";

export function BlackboardView({ scene }: { scene: Scene }) {
  const viewBox = useMemo(() => {
    if (scene.nodes.length === 0) return "0 0 1000 800";
    const xs = scene.nodes.map((n) => n.x);
    const ys = scene.nodes.map((n) => n.y);
    const ws = scene.nodes.map((n) => n.w);
    const hs = scene.nodes.map((n) => n.h);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs.map((x, i) => x + ws[i]));
    const maxY = Math.max(...ys.map((y, i) => y + hs[i]));
    const pad = 40;
    return `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${
      maxY - minY + pad * 2
    }`;
  }, [scene]);

  return (
    <svg
      viewBox={viewBox}
      width="100%"
      height="100%"
      style={{ background: "#0b0f14" }}
    >
      <g>
        {scene.edges.map((e) => (
          <line
            key={e.id}
            x1={e.x1}
            y1={e.y1}
            x2={e.x2}
            y2={e.y2}
            stroke="#2a3a4f"
            strokeWidth={2}
          />
        ))}
      </g>
      <g>
        {scene.nodes.map((n) => (
          <g key={n.id}>
            <rect
              x={n.x}
              y={n.y}
              width={Math.max(6, n.w)}
              height={Math.max(6, n.h)}
              rx={10}
              fill="#0f1620"
              stroke="#223041"
            />
            <text x={n.x + 10} y={n.y + 20} fill="#9fb0c3" fontSize={12}>
              {n.id}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

