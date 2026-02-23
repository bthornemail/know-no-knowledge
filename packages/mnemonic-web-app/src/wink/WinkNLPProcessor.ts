import { featuresForTerm, lemmaOf, posOf } from "../spo/simpleNlp";

export type WinkNLPConfig = {
  stemming: boolean;
  lemmatization: boolean;
  sentiment: boolean;
  wikification: boolean;
  dependency_parsing: boolean;
};

export type TokenInfo = {
  text: string;
  lemma: string;
  pos: string;
  tag: string;
  index: number;
  span: [number, number];
  is_stop_word: boolean;
  is_punctuation: boolean;
  is_entity: boolean;
  entity_type?: string;
};

export type WinkAnalysis = {
  tokens: TokenInfo[];
  sentiment: { score: number; confidence: number };
};

type MaybeWink = null | {
  nlp: any;
  its: any;
  bm25: any;
};

async function tryLoadWink(): Promise<MaybeWink> {
  try {
    const winkNlpSpec = "wink-nlp";
    const winkModelSpec = "wink-eng-lite-web-model";
    const winkBm25Spec = "wink-bm25-text-search";

    const winkMod: any = await import(/* @vite-ignore */ winkNlpSpec);
    const modelMod: any = await import(/* @vite-ignore */ winkModelSpec);
    const helpers: any = winkMod;
    const bm25Mod: any = await import(/* @vite-ignore */ winkBm25Spec);
    const nlp = winkMod.default(modelMod.default ?? modelMod);
    const its = helpers.its ?? helpers.default?.its ?? null;
    const bm25 = bm25Mod.default ?? bm25Mod;
    if (!its || !bm25) return null;
    return { nlp, its, bm25 };
  } catch {
    return null;
  }
}

export class WinkNLPProcessor {
  private config: WinkNLPConfig;
  private wink: MaybeWink = null;
  private bm25Engine: any | null = null;

  constructor(config: WinkNLPConfig) {
    this.config = config;
  }

  async init(): Promise<void> {
    this.wink = await tryLoadWink();
    if (!this.wink) return;
    this.bm25Engine = this.wink.bm25();
    this.bm25Engine.defineConfig({
      fldWeights: { text: 1 },
      bm25Params: { k1: 1.2, b: 0.75, k: 60 }
    });
    this.bm25Engine.definePrepTasks([
      (text: string) => text.toLowerCase().split(/\W+/).filter(Boolean)
    ]);
  }

  analyze(text: string): WinkAnalysis {
    if (!this.wink) {
      const tokens = tokenizeFallback(text);
      return {
        tokens,
        sentiment: { score: 0, confidence: 0 }
      };
    }

    const { nlp, its } = this.wink;
    const doc = nlp.readDoc(text);
    const tokens: TokenInfo[] = [];

    doc.tokens().each((t: any) => {
      const span = t.out(its.span);
      tokens.push({
        text: t.out(),
        lemma: this.config.lemmatization ? t.out(its.lemma) : t.out(),
        pos: t.out(its.pos),
        tag: t.out(its.tag),
        index: t.index(),
        span: [span[0], span[1]],
        is_stop_word: t.out(its.stopWordFlag),
        is_punctuation: t.out(its.punctuationFlag),
        is_entity: Boolean(t.parentEntity && t.parentEntity()),
        entity_type: t.parentEntity ? t.parentEntity()?.out(its.type) : undefined
      });
    });

    const s = this.config.sentiment ? doc.out(its.sentiment) : 0;
    return { tokens, sentiment: { score: s, confidence: Math.abs(s) } };
  }

  indexDocument(id: string, text: string): void {
    if (!this.bm25Engine) return;
    this.bm25Engine.addDoc({ text }, id);
  }

  consolidateIndex(): void {
    if (!this.bm25Engine) return;
    this.bm25Engine.consolidate();
  }

  search(query: string, limit = 10): Array<{ id: string; score: number }> {
    if (!this.bm25Engine) return [];
    const results = this.bm25Engine.search(query, limit);
    return results.map((r: any) => ({ id: r[0], score: r[1] }));
  }

  lemmatize(text: string): string {
    if (!this.wink) return featuresForTerm(text).lemma;
    const { nlp, its } = this.wink;
    const doc = nlp.readDoc(text);
    return doc.tokens().out(its.lemma).join(" ");
  }

  getPOS(text: string): string {
    if (!this.wink) return posOf(text);
    const { nlp, its } = this.wink;
    const doc = nlp.readDoc(text);
    const tokens = doc.tokens();
    if (tokens.length() === 0) return "UNKNOWN";
    return tokens.out(its.pos)[0] ?? "UNKNOWN";
  }
}

function tokenizeFallback(text: string): TokenInfo[] {
  const parts = text.split(/\b/);
  let offset = 0;
  const tokens: TokenInfo[] = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (!p) continue;
    const start = offset;
    const end = offset + p.length;
    offset = end;
    const trimmed = p.trim();
    if (!trimmed) continue;
    const lemma = lemmaOf(trimmed);
    tokens.push({
      text: trimmed,
      lemma,
      pos: posOf(trimmed),
      tag: "UNK",
      index: tokens.length,
      span: [start, end],
      is_stop_word: /^(the|a|an|and|or|of|to|in)$/.test(lemma),
      is_punctuation: /^[\.\,\;\:\(\)\[\]\{\}]+$/.test(trimmed),
      is_entity: false
    });
  }
  return tokens;
}
