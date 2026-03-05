import type { SPOTriple } from "../types/spo";
import { lemmaOf } from "../spo/simpleNlp";
import { bracketDepth, posClassOfTerm, relationFaceKey, relationSynsetId } from "../spo/relationSynset";

export type OverlayRelation = {
  type: "overlay.relation";
  triple_id: string;
  rs: string;
  face: string;
  p: { surface: string; lemma: string };
  s: { surface: string; pos_class: string; ref_depth: number };
  o: { surface: string; pos_class: string; ref_depth: number };
  doc?: string;
  order?: number;
  evidence?: unknown;
  build?: { root?: string };
};

export function buildRelationOverlay(triple: SPOTriple, buildRootSha256?: string): OverlayRelation {
  const face = relationFaceKey(triple);
  const rs = relationSynsetId(triple);
  const sDepth = bracketDepth(triple.subject);
  const oDepth = bracketDepth(triple.object);

  return {
    type: "overlay.relation",
    triple_id: triple.id,
    rs,
    face,
    p: { surface: triple.predicate, lemma: lemmaOf(triple.predicate) },
    s: { surface: triple.subject, pos_class: posClassOfTerm(triple.subject), ref_depth: sDepth },
    o: { surface: triple.object, pos_class: posClassOfTerm(triple.object), ref_depth: oDepth },
    doc: triple.doc,
    order: triple.order,
    evidence: triple.evidence ?? triple.evidence_md,
    build: buildRootSha256 ? { root: buildRootSha256 } : undefined
  };
}

export function buildRelationOverlays(triples: SPOTriple[], buildRootSha256?: string): OverlayRelation[] {
  const out = triples.map((t) => buildRelationOverlay(t, buildRootSha256));
  out.sort((a, b) => a.triple_id.localeCompare(b.triple_id));
  return out;
}

export function overlaysToNdjson(objs: unknown[]): string {
  return objs.map((o) => JSON.stringify(o)).join("\n") + "\n";
}

export function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/x-ndjson" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
