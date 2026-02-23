export type TermFeatures = {
  lemma: string;
  pos: string;
};

export function normalizeSpace(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

export function lemmaOf(text: string): string {
  const s = normalizeSpace(text).toLowerCase();
  return s.replace(/^[\[\(\{]+|[\]\)\}]+$/g, "");
}

export function posOf(text: string): string {
  const s = lemmaOf(text);
  if (s.length === 0) return "UNKNOWN";
  if (/^(the|a|an)\b/.test(s)) return "DET";
  if (/^(shall|may|must|should|can|will)\b/.test(s)) return "AUX";
  if (/\b(ing|ed)\b/.test(s)) return "VERB";
  if (/^(is|are|was|were|be|being|been)$/.test(s)) return "VERB";
  return "NOUN";
}

export function featuresForTerm(text: string): TermFeatures {
  return { lemma: lemmaOf(text), pos: posOf(text) };
}

export function detectPredicateVoice(predicate: string): "active" | "passive" {
  const p = lemmaOf(predicate);
  if (/\b(be|is|are|was|were|been|being)\b/.test(p) && /\bed\b/.test(p)) {
    return "passive";
  }
  return "active";
}

