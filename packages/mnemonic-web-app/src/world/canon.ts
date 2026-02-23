import type { SPOTriple } from "../types/spo";

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function asString(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function asNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function stableIdFromIndex(i: number): string {
  return `spo:${String(i).padStart(8, "0")}`;
}

export function extractSPOTriples(values: unknown[]): SPOTriple[] {
  const out: SPOTriple[] = [];
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (!isObject(v)) continue;
    const subject = asString(v.subject);
    const predicate = asString(v.predicate);
    const object = asString(v.object);
    if (subject === null || predicate === null || object === null) continue;

    const doc =
      asString(v.doc) ??
      (isObject(v.doc) ? asString((v.doc as any).path) : null) ??
      null;
    const order = asNumber(v.order) ?? null;

    out.push({
      id: asString(v.id) ?? stableIdFromIndex(i),
      subject,
      predicate,
      object,
      doc: doc ?? undefined,
      order: order ?? undefined,
      evidence: isObject(v.evidence) ? (v.evidence as any) : undefined,
      evidence_md: isObject(v.evidence_md) ? (v.evidence_md as any) : undefined,
      lexicon_version: asString(v.lexicon_version) ?? undefined,
      parser_version: asString(v.parser_version) ?? undefined,
      raw: v
    });
  }
  return out;
}

