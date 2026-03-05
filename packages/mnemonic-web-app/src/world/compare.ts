import type { SPOTriple } from "../types/spo";
import { lemmaOf } from "../spo/simpleNlp";
import { relationSynsetId } from "../spo/relationSynset";

export type CorpusStats = {
  records: number;
  spo_triples: number;
  by_face: Array<{ k: string; n: number }>;
  by_subject: Array<{ k: string; n: number }>;
  by_object: Array<{ k: string; n: number }>;
  by_world: Array<{ k: string; n: number }>;
  by_layer: Array<{ k: string; n: number }>;
};

export type DeltaRow = { k: string; a: number; b: number; d: number };

export type CorpusDelta = {
  predicates: DeltaRow[];
  subjects: DeltaRow[];
  objects: DeltaRow[];
  worlds: DeltaRow[];
  layers: DeltaRow[];
};

function keyOfWorld(docPath: string | undefined): string {
  if (!docPath) return "_unknown";
  const parts = docPath.split("/").filter(Boolean);
  const idx = parts.indexOf("narrative-series");
  if (idx >= 0 && idx + 1 < parts.length) return `narrative-series/${parts[idx + 1]}`;
  return "_root";
}

function keyOfLayer(docPath: string | undefined): string {
  return docPath ?? "_unknown";
}

function countBy(items: string[]): Array<{ k: string; n: number }> {
  const m = new Map<string, number>();
  for (const it of items) m.set(it, (m.get(it) ?? 0) + 1);
  return [...m.entries()]
    .map(([k, n]) => ({ k, n }))
    .sort((a, b) => b.n - a.n || a.k.localeCompare(b.k));
}

export function computeCorpusStats(values: unknown[], triples: SPOTriple[]): CorpusStats {
  const faces = triples.map((t) => relationSynsetId(t));
  const subjects = triples.map((t) => lemmaOf(t.subject));
  const objects = triples.map((t) => lemmaOf(t.object));
  const worlds = triples.map((t) => keyOfWorld(docPathOfTriple(t)));
  const layers = triples.map((t) => keyOfLayer(docPathOfTriple(t)));

  return {
    records: values.length,
    spo_triples: triples.length,
    by_face: countBy(faces).slice(0, 40),
    by_subject: countBy(subjects).slice(0, 40),
    by_object: countBy(objects).slice(0, 40),
    by_world: countBy(worlds),
    by_layer: countBy(layers).slice(0, 80)
  };
}

function docPathOfTriple(t: SPOTriple): string | undefined {
  if (typeof t.doc === "string") return t.doc;
  const e: any = (t as any).evidence;
  const emd: any = (t as any).evidence_md;
  return e?.doc_path ?? e?.path ?? emd?.doc_path ?? emd?.path ?? undefined;
}

function deltaRows(
  a: Array<{ k: string; n: number }>,
  b: Array<{ k: string; n: number }>,
  limit: number
): DeltaRow[] {
  const ma = new Map(a.map((x) => [x.k, x.n]));
  const mb = new Map(b.map((x) => [x.k, x.n]));
  const keys = new Set<string>([...ma.keys(), ...mb.keys()]);
  const rows: DeltaRow[] = [];
  for (const k of keys) {
    const na = ma.get(k) ?? 0;
    const nb = mb.get(k) ?? 0;
    rows.push({ k, a: na, b: nb, d: nb - na });
  }
  rows.sort((x, y) => Math.abs(y.d) - Math.abs(x.d) || y.b - x.b || x.k.localeCompare(y.k));
  return rows.slice(0, limit);
}

export function computeCorpusDelta(a: CorpusStats, b: CorpusStats): CorpusDelta {
  return {
    predicates: deltaRows(a.by_face, b.by_face, 30),
    subjects: deltaRows(a.by_subject, b.by_subject, 30),
    objects: deltaRows(a.by_object, b.by_object, 30),
    worlds: deltaRows(a.by_world, b.by_world, 30),
    layers: deltaRows(a.by_layer, b.by_layer, 30)
  };
}
