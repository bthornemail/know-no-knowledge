import type { Scene } from "./scene";

export type CanvasNodeMeta = {
  id: string;
  doc_path: string | null;
  layer_id: string | null;
  world_id: string;
  kind: "doc" | "other";
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function asString(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function docPathToWorldId(docPath: string | null): string {
  if (!docPath) return "_unknown";
  const parts = docPath.split("/").filter((p) => p.length > 0);
  const idx = parts.indexOf("narrative-series");
  if (idx >= 0 && idx + 1 < parts.length) {
    return ["narrative-series", parts[idx + 1]].join("/");
  }
  return "_root";
}

function extractDocPathFromNodeText(text: string | undefined): string | null {
  if (!text) return null;
  let v: unknown;
  try {
    v = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isObject(v)) return null;

  const direct = asString(v.doc_path);
  if (direct) return direct;

  const doc = (v as any).doc;
  const docStr = asString(doc);
  if (docStr) return docStr;
  if (isObject(doc)) {
    const p = asString((doc as any).path);
    if (p) return p;
  }

  const evidence = (v as any).evidence;
  if (isObject(evidence)) {
    const p = asString((evidence as any).doc_path) ?? asString((evidence as any).path);
    if (p) return p;
  }
  const evidenceMd = (v as any).evidence_md;
  if (isObject(evidenceMd)) {
    const p = asString((evidenceMd as any).doc_path) ?? asString((evidenceMd as any).path);
    if (p) return p;
  }

  return null;
}

export function indexCanvasScene(scene: Scene): Map<string, CanvasNodeMeta> {
  const meta = new Map<string, CanvasNodeMeta>();
  for (const n of scene.nodes) {
    const docPath = extractDocPathFromNodeText(n.raw.text);
    const worldId = docPathToWorldId(docPath);
    meta.set(n.id, {
      id: n.id,
      doc_path: docPath,
      layer_id: docPath,
      world_id: worldId,
      kind: docPath ? "doc" : "other"
    });
  }
  return meta;
}

