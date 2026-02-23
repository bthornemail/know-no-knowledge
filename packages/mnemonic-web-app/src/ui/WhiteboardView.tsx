import React from "react";
import type { Scene } from "../world/scene";

export function WhiteboardView({ scene }: { scene: Scene }) {
  // Minimal “camera”: use same deterministic projection for now.
  // A real implementation would add pan/zoom and filtered views.
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <BlackboardSvg scene={scene} />
    </div>
  );
}

function BlackboardSvg({ scene }: { scene: Scene }) {
  return (
    <svg
      viewBox="0 0 1200 800"
      width="100%"
      height="100%"
      style={{ background: "#0b0f14" }}
    >
      {scene.edges.map((e) => (
        <path
          key={e.id}
          d={`M ${e.x1} ${e.y1} L ${e.x2} ${e.y2}`}
          stroke="#31465f"
          strokeWidth={1.5}
          fill="none"
        />
      ))}
      {scene.nodes.map((n) => (
        <circle key={n.id} cx={n.x + n.w / 2} cy={n.y + n.h / 2} r={4} fill="#6aa6ff" />
      ))}
    </svg>
  );
}

