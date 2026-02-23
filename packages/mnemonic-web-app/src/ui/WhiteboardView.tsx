import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Scene } from "../world/scene";
import type { Camera } from "./camera";
import { boundsOfRects, cameraFitBounds, cameraPan, cameraZoomAt } from "./camera";
import { useElementSize } from "./useElementSize";

export function WhiteboardView({
  scene,
  camera,
  onCameraChange,
  onSelectNodeId
}: {
  scene: Scene;
  camera: Camera;
  onCameraChange: (c: Camera) => void;
  onSelectNodeId?: (id: string) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const { w, h } = useElementSize(hostRef);
  const [drag, setDrag] = useState<null | { x: number; y: number }>(null);

  const worldBounds = useMemo(() => {
    return boundsOfRects(scene.nodes.map((n) => ({ x: n.x, y: n.y, w: n.w, h: n.h })));
  }, [scene]);

  useEffect(() => {
    if (w <= 0 || h <= 0) return;
    if (scene.nodes.length === 0) return;
    if (camera.k === 1 && camera.tx === 0 && camera.ty === 0) {
      onCameraChange(cameraFitBounds(worldBounds, { w, h }, { margin: 24, maxZoom: 6 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, h, scene.nodes.length]);

  return (
    <div ref={hostRef} style={{ width: "100%", height: "100%" }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${Math.max(1, w)} ${Math.max(1, h)}`}
        style={{ background: "#0b0f14", display: "block" }}
        onPointerDown={(ev) => {
          (ev.currentTarget as any).setPointerCapture?.(ev.pointerId);
          setDrag({ x: ev.clientX, y: ev.clientY });
        }}
        onPointerMove={(ev) => {
          if (!drag) return;
          const dx = ev.clientX - drag.x;
          const dy = ev.clientY - drag.y;
          setDrag({ x: ev.clientX, y: ev.clientY });
          onCameraChange(cameraPan(camera, dx, dy));
        }}
        onPointerUp={(ev) => {
          (ev.currentTarget as any).releasePointerCapture?.(ev.pointerId);
          setDrag(null);
        }}
        onWheel={(ev) => {
          ev.preventDefault();
          const nextK = camera.k * (ev.deltaY < 0 ? 1.08 : 1 / 1.08);
          const rect = (ev.currentTarget as SVGSVGElement).getBoundingClientRect();
          const anchor = { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
          onCameraChange(cameraZoomAt(camera, nextK, anchor));
        }}
      >
        <g transform={`translate(${camera.tx} ${camera.ty}) scale(${camera.k})`}>
          {scene.edges.map((e) => (
            <path
              key={e.id}
              d={`M ${e.x1} ${e.y1} L ${e.x2} ${e.y2}`}
              stroke="#31465f"
              strokeWidth={1.5}
              fill="none"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {scene.nodes.map((n) => (
            <circle
              key={n.id}
              data-kind="node"
              data-node-id={n.id}
              cx={n.x + n.w / 2}
              cy={n.y + n.h / 2}
              r={4}
              fill="#6aa6ff"
              onPointerDown={(ev) => {
                if (onSelectNodeId) onSelectNodeId(n.id);
                ev.stopPropagation();
              }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
