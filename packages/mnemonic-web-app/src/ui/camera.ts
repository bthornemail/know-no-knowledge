export type Camera = { tx: number; ty: number; k: number };

export type Bounds = { minX: number; minY: number; maxX: number; maxY: number };

export function boundsEmpty(): Bounds {
  return { minX: 0, minY: 0, maxX: 1, maxY: 1 };
}

export function boundsOfRects(
  rects: Array<{ x: number; y: number; w: number; h: number }>
): Bounds {
  if (rects.length === 0) return boundsEmpty();
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const r of rects) {
    minX = Math.min(minX, r.x);
    minY = Math.min(minY, r.y);
    maxX = Math.max(maxX, r.x + r.w);
    maxY = Math.max(maxY, r.y + r.h);
  }
  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
    return boundsEmpty();
  }
  return { minX, minY, maxX, maxY };
}

export function cameraDefault(): Camera {
  return { tx: 0, ty: 0, k: 1 };
}

export function cameraPan(cam: Camera, dx: number, dy: number): Camera {
  return { ...cam, tx: cam.tx + dx, ty: cam.ty + dy };
}

export function cameraZoomAt(
  cam: Camera,
  nextK: number,
  anchorScreen: { x: number; y: number }
): Camera {
  const k = clamp(nextK, 0.02, 80);
  const wx = (anchorScreen.x - cam.tx) / cam.k;
  const wy = (anchorScreen.y - cam.ty) / cam.k;
  const tx = anchorScreen.x - wx * k;
  const ty = anchorScreen.y - wy * k;
  return { tx, ty, k };
}

export function visibleWorldBounds(cam: Camera, viewport: { w: number; h: number }): Bounds {
  const minX = (0 - cam.tx) / cam.k;
  const minY = (0 - cam.ty) / cam.k;
  const maxX = (viewport.w - cam.tx) / cam.k;
  const maxY = (viewport.h - cam.ty) / cam.k;
  return { minX, minY, maxX, maxY };
}

export function cameraFitBounds(
  bounds: Bounds,
  viewport: { w: number; h: number },
  opts?: { margin?: number; maxZoom?: number }
): Camera {
  const margin = opts?.margin ?? 24;
  const maxZoom = opts?.maxZoom ?? 10;
  const bw = Math.max(1e-6, bounds.maxX - bounds.minX);
  const bh = Math.max(1e-6, bounds.maxY - bounds.minY);
  const kx = (viewport.w - margin * 2) / bw;
  const ky = (viewport.h - margin * 2) / bh;
  const k = clamp(Math.min(kx, ky), 0.02, maxZoom);
  const tx = margin - bounds.minX * k;
  const ty = margin - bounds.minY * k;
  return { tx, ty, k };
}

function clamp(x: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, x));
}

