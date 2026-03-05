import type { SPOTriple } from "../types/spo";
import { sha256HexUtf8 } from "./sha256";

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

type ProseMatch = { subject: string; predicate: string; object: string; at: number };

function normalizeTerm(s: string): string {
  return s
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^[“”"']+/, "")
    .replace(/[“”"':;,.!?]+$/, "")
    .trim();
}

function proseMatchesFromText(text: string): ProseMatch[] {
  const t = text.replace(/\s+/g, " ");
  const matches: Array<ProseMatch & { prio: number }> = [];

  const patterns: Array<{
    prio: number;
    predicate: string;
    re: RegExp;
  }> = [
    // X is a/an/the Y
    {
      prio: 10,
      predicate: "is_a",
      re: /\b([A-Za-z][A-Za-z0-9'’\-]*(?:\s+[A-Za-z][A-Za-z0-9'’\-]*){0,5})\s+(?:is|are|was|were)\s+(?:an?|the)\s+([A-Za-z][A-Za-z0-9'’\-]*(?:\s+[A-Za-z][A-Za-z0-9'’\-]*){0,5})\b/gi
    },
    // X is Y
    {
      prio: 20,
      predicate: "is",
      re: /\b([A-Za-z][A-Za-z0-9'’\-]*(?:\s+[A-Za-z][A-Za-z0-9'’\-]*){0,5})\s+(?:is|are|was|were)\s+([A-Za-z][A-Za-z0-9'’\-]*(?:\s+[A-Za-z][A-Za-z0-9'’\-]*){0,5})\b/gi
    },
    // X has Y
    {
      prio: 30,
      predicate: "has",
      re: /\b([A-Za-z][A-Za-z0-9'’\-]*(?:\s+[A-Za-z][A-Za-z0-9'’\-]*){0,5})\s+(?:has|have|had)\s+(?:an?|the)?\s*([A-Za-z][A-Za-z0-9'’\-]*(?:\s+[A-Za-z][A-Za-z0-9'’\-]*){0,5})\b/gi
    },
    // X uses Y
    {
      prio: 40,
      predicate: "uses",
      re: /\b([A-Za-z][A-Za-z0-9'’\-]*(?:\s+[A-Za-z][A-Za-z0-9'’\-]*){0,5})\s+(?:uses|use|used|utilizes|utilize|employs|employ)\s+(?:an?|the)?\s*([A-Za-z][A-Za-z0-9'’\-]*(?:\s+[A-Za-z][A-Za-z0-9'’\-]*){0,5})\b/gi
    },
    // X depends on Y
    {
      prio: 50,
      predicate: "depends_on",
      re: /\b([A-Za-z][A-Za-z0-9'’\-]*(?:\s+[A-Za-z][A-Za-z0-9'’\-]*){0,5})\s+(?:depends|depend|depended)\s+on\s+(?:an?|the)?\s*([A-Za-z][A-Za-z0-9'’\-]*(?:\s+[A-Za-z][A-Za-z0-9'’\-]*){0,5})\b/gi
    },
    // X refers to Y
    {
      prio: 60,
      predicate: "references",
      re: /\b([A-Za-z][A-Za-z0-9'’\-]*(?:\s+[A-Za-z][A-Za-z0-9'’\-]*){0,5})\s+(?:refers|refer|referred|references|reference|cites|cite|cited)\s+to\s+(?:an?|the)?\s*([A-Za-z][A-Za-z0-9'’\-]*(?:\s+[A-Za-z][A-Za-z0-9'’\-]*){0,5})\b/gi
    }
  ];

  for (const p of patterns) {
    p.re.lastIndex = 0;
    for (;;) {
      const m = p.re.exec(t);
      if (!m) break;
      const subject = normalizeTerm(m[1] ?? "");
      const object = normalizeTerm(m[2] ?? "");
      if (!subject || !object) continue;
      matches.push({ subject, predicate: p.predicate, object, at: m.index, prio: p.prio });
    }
  }

  matches.sort((a, b) => a.at - b.at || a.prio - b.prio || a.predicate.localeCompare(b.predicate));
  return matches.map(({ prio: _p, ...rest }) => rest);
}

function stableProseTripleId(parts: {
  doc: string;
  paragraphId: string;
  at: number;
  subject: string;
  predicate: string;
  object: string;
}): string {
  const key = `spo.prose.v1|doc=${parts.doc}|pid=${parts.paragraphId}|at=${parts.at}|s=${parts.subject}|p=${parts.predicate}|o=${parts.object}`;
  return `spo:prose:${sha256HexUtf8(key)}`;
}

function extractProseTriples(values: unknown[]): SPOTriple[] {
  const out: SPOTriple[] = [];
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (!isObject(v)) continue;
    const event = asString(v.event);
    const text = asString(v.text);
    if (event !== "paragraph" || text === null) continue;

    const doc = asString(v.doc) ?? (isObject(v.evidence) ? asString((v.evidence as any).doc_path) : null) ?? "_unknown";
    const paragraphId = asString(v.id) ?? `p${i + 1}`;
    const baseOrder = asNumber(v.order) ?? null;

    const matches = proseMatchesFromText(text);
    for (let k = 0; k < matches.length; k++) {
      const m = matches[k];
      const id = stableProseTripleId({
        doc,
        paragraphId,
        at: m.at,
        subject: m.subject,
        predicate: m.predicate,
        object: m.object
      });
      out.push({
        id,
        subject: m.subject,
        predicate: m.predicate,
        object: m.object,
        doc,
        order: baseOrder === null ? undefined : baseOrder * 100 + k,
        evidence_md: isObject(v.evidence) ? (v.evidence as any) : undefined,
        parser_version: "web.prose.spo.v1",
        raw: v
      });
    }
  }
  return out;
}

/**
 * Canon triple extractor for the web app:
 * - includes explicit `{subject,predicate,object}` records
 * - optionally derives additional SPO triples from prose paragraph events
 *
 * This does not mutate canonical NDJSON; it is an edge-only shadow overlay.
 */
export function extractCanonTriples(values: unknown[]): SPOTriple[] {
  const explicit = extractSPOTriples(values);
  const derived = extractProseTriples(values);
  const all = [...explicit, ...derived];
  all.sort((a, b) => a.id.localeCompare(b.id));
  return all;
}
