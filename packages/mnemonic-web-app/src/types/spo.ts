export type EvidenceSpan =
  | {
      span_start: number;
      span_end: number;
      doc_path?: string;
      path?: string;
      doc_bytes?: number;
      doc_lines?: number;
      block_lang?: string;
      block_index?: number;
      line_no?: number;
      array_index?: number;
    }
  | Record<string, unknown>;

export type SPOTriple = {
  id: string;
  subject: string;
  predicate: string;
  object: string;
  order?: number;
  doc?: string;
  evidence?: EvidenceSpan;
  evidence_md?: EvidenceSpan;
  lexicon_version?: string;
  parser_version?: string;
  raw?: Record<string, unknown>;
};

export enum PredicateType {
  IS_A = "is_a",
  INSTANCE_OF = "instance_of",
  TYPE_OF = "type_of",
  SUBCLASS_OF = "subclass_of",
  CATEGORY = "category",

  HAS = "has",
  USES = "uses",
  REFERENCES = "references",
  CONTAINS = "contains",
  RELATES_TO = "relates_to",
  DEPENDS_ON = "depends_on",
  DERIVES_FROM = "derives_from",

  CONTRADICTS = "contradicts",
  MODIFIES = "modifies",
  REPLACES = "replaces",

  UNKNOWN = "unknown"
}

export type LinguisticTripleFeatures = {
  subject_lemma: string;
  subject_pos: string;
  predicate_lemma: string;
  predicate_voice: "active" | "passive";
  object_lemma: string;
  object_pos: string;
  sentiment?: number;
};

export type ClassifiedTriple = SPOTriple & {
  classification: {
    type: PredicateType;
    is_noun_role: boolean;
    is_pronoun_relation: boolean;
    confidence: number;
  };
  linguistic: LinguisticTripleFeatures;
};

export type SPONode = {
  id: string;
  value: string;
  lemma: string;
  pos: string;
  parent?: string;
  children: string[];
  outgoing: SPOEdge[];
  incoming: SPOEdge[];
};

export type SPOEdge = {
  id: string;
  source: string;
  target: string;
  predicate: string;
  predicate_type: PredicateType;
  confidence: number;
};

export type SPOTree = {
  roles: {
    roots: SPONode[];
    nodes: Map<string, SPONode>;
    depth_map: Map<string, number>;
  };
  relations: {
    edges: SPOEdge[];
    adjacency: Map<string, Set<string>>;
    predicate_index: Map<PredicateType, SPOEdge[]>;
  };
  stats: {
    total_nodes: number;
    total_edges: number;
    noun_roles: number;
    pronoun_relations: number;
    max_depth: number;
    avg_depth: number;
  };
};

