import type { ClassifiedTriple, SPOTriple } from "../types/spo";
import { PredicateType } from "../types/spo";
import { detectPredicateVoice, featuresForTerm, lemmaOf } from "./simpleNlp";

function classifyPredicateType(predicate: string): {
  type: PredicateType;
  is_noun_role: boolean;
  is_pronoun_relation: boolean;
  confidence: number;
} {
  const p = lemmaOf(predicate);

  const eq = (s: string) => p === s;
  const has = (s: string) => p.includes(s);

  if (eq("is_a") || eq("is a") || eq("isa") || eq("is")) {
    return {
      type: PredicateType.IS_A,
      is_noun_role: true,
      is_pronoun_relation: false,
      confidence: 1.0
    };
  }
  if (has("instance") && has("of")) {
    return {
      type: PredicateType.INSTANCE_OF,
      is_noun_role: true,
      is_pronoun_relation: false,
      confidence: 1.0
    };
  }
  if (has("type") && has("of")) {
    return {
      type: PredicateType.TYPE_OF,
      is_noun_role: true,
      is_pronoun_relation: false,
      confidence: 1.0
    };
  }
  if (has("subclass") || has("sub-class") || has("kind of")) {
    return {
      type: PredicateType.SUBCLASS_OF,
      is_noun_role: true,
      is_pronoun_relation: false,
      confidence: 0.9
    };
  }
  if (has("category") || has("belongs to") || has("member of")) {
    return {
      type: PredicateType.CATEGORY,
      is_noun_role: true,
      is_pronoun_relation: false,
      confidence: 0.8
    };
  }

  if (eq("has") || eq("have") || eq("owns") || eq("possesses")) {
    return {
      type: PredicateType.HAS,
      is_noun_role: false,
      is_pronoun_relation: true,
      confidence: 1.0
    };
  }
  if (eq("uses") || eq("use") || eq("utilizes") || eq("employs") || eq("applies")) {
    return {
      type: PredicateType.USES,
      is_noun_role: false,
      is_pronoun_relation: true,
      confidence: 1.0
    };
  }
  if (has("reference") || has("refer") || has("cite") || has("point to")) {
    return {
      type: PredicateType.REFERENCES,
      is_noun_role: false,
      is_pronoun_relation: true,
      confidence: 0.9
    };
  }
  if (has("contain") || has("include") || has("comprise")) {
    return {
      type: PredicateType.CONTAINS,
      is_noun_role: false,
      is_pronoun_relation: true,
      confidence: 0.8
    };
  }
  if (has("depend") || has("require") || has("need")) {
    return {
      type: PredicateType.DEPENDS_ON,
      is_noun_role: false,
      is_pronoun_relation: true,
      confidence: 0.8
    };
  }
  if (has("derive") || has("originate") || has("stem from") || has("descend")) {
    return {
      type: PredicateType.DERIVES_FROM,
      is_noun_role: false,
      is_pronoun_relation: true,
      confidence: 0.8
    };
  }
  if (has("contradict") || has("conflict") || has("oppose")) {
    return {
      type: PredicateType.CONTRADICTS,
      is_noun_role: false,
      is_pronoun_relation: true,
      confidence: 1.0
    };
  }
  if (has("modif") || has("change") || has("alter") || has("update")) {
    return {
      type: PredicateType.MODIFIES,
      is_noun_role: false,
      is_pronoun_relation: true,
      confidence: 0.9
    };
  }
  if (has("replace") || has("supersede") || has("substitute")) {
    return {
      type: PredicateType.REPLACES,
      is_noun_role: false,
      is_pronoun_relation: true,
      confidence: 0.9
    };
  }

  return {
    type: PredicateType.UNKNOWN,
    is_noun_role: false,
    is_pronoun_relation: false,
    confidence: 0.0
  };
}

export function classifyTriple(triple: SPOTriple): ClassifiedTriple {
  const s = featuresForTerm(triple.subject);
  const o = featuresForTerm(triple.object);
  const p = featuresForTerm(triple.predicate);

  const classification = classifyPredicateType(triple.predicate);

  return {
    ...triple,
    classification,
    linguistic: {
      subject_lemma: s.lemma,
      subject_pos: s.pos,
      predicate_lemma: p.lemma,
      predicate_voice: detectPredicateVoice(triple.predicate),
      object_lemma: o.lemma,
      object_pos: o.pos
    }
  };
}

export function classifyTriples(triples: SPOTriple[]): ClassifiedTriple[] {
  return triples.map(classifyTriple);
}

