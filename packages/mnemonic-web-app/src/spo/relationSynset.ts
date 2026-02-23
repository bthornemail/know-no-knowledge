import type { SPOTriple } from "../types/spo";
import { lemmaOf } from "./simpleNlp";

export type PosClass = "PRONOUN" | "PROPN" | "NOUN" | "OTHER";

const pronouns = new Set([
  "i",
  "me",
  "my",
  "mine",
  "you",
  "your",
  "yours",
  "he",
  "him",
  "his",
  "she",
  "her",
  "hers",
  "it",
  "its",
  "we",
  "us",
  "our",
  "ours",
  "they",
  "them",
  "their",
  "theirs",
  "this",
  "that",
  "these",
  "those",
  "who",
  "whom",
  "which",
  "what"
]);

export function bracketDepth(text: string): number {
  let d = 0;
  let s = text;
  while (s.startsWith("[") && s.endsWith("]") && s.length >= 2) {
    d++;
    s = s.slice(1, -1);
  }
  return d;
}

export function posClassOfTerm(surface: string): PosClass {
  const lemma = lemmaOf(surface);
  if (pronouns.has(lemma)) return "PRONOUN";
  if (/[A-Z]/.test(surface) && /[a-z]/.test(surface)) return "PROPN";
  if (/[a-z0-9]/.test(lemma)) return "NOUN";
  return "OTHER";
}

/**
 * Deterministic "relation synset" key: a face tuple derived from observable SPO
 * structure. This is NOT WordNet; it is a content-addressable slot key we can
 * later hash if/when needed.
 */
export function relationFaceKey(triple: SPOTriple): string {
  const p = lemmaOf(triple.predicate);
  const s = posClassOfTerm(triple.subject);
  const o = posClassOfTerm(triple.object);
  const sd = bracketDepth(triple.subject);
  const od = bracketDepth(triple.object);
  const pd = bracketDepth(triple.predicate);
  return `rs.v1|p=${p}|s=${s}|o=${o}|sd=${sd}|pd=${pd}|od=${od}`;
}

