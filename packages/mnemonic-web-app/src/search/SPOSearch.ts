import type { SPOTree, SPOEdge, SPONode } from "../types/spo";
import { PredicateType } from "../types/spo";
import { lemmaOf } from "../spo/simpleNlp";

export type SPOSearchQuery = {
  text?: string;
  subject?: string;
  predicate?: string | PredicateType;
  object?: string;
  only_noun_roles?: boolean;
  only_pronoun_relations?: boolean;
  min_confidence?: number;
};

export type SPOSearchResult =
  | { kind: "node"; node: SPONode; score: number; snippet: string }
  | { kind: "edge"; edge: SPOEdge; score: number; snippet: string };

const nounRoleTypes = new Set<PredicateType>([
  PredicateType.IS_A,
  PredicateType.INSTANCE_OF,
  PredicateType.TYPE_OF,
  PredicateType.SUBCLASS_OF,
  PredicateType.CATEGORY
]);

export class SPOSearch {
  private tree: SPOTree | null = null;

  setTree(tree: SPOTree) {
    this.tree = tree;
  }

  search(query: SPOSearchQuery, limit = 50): SPOSearchResult[] {
    if (!this.tree) return [];
    const tree = this.tree;
    const q = (query.text ?? "").trim().toLowerCase();

    const results: SPOSearchResult[] = [];

    for (const node of tree.roles.nodes.values()) {
      if (!q) continue;
      const hay = `${node.lemma} ${node.value}`.toLowerCase();
      if (hay.includes(q)) {
        results.push({ kind: "node", node, score: 1.0, snippet: node.lemma });
      }
    }

    for (const edge of tree.relations.edges) {
      if (query.min_confidence !== undefined && edge.confidence < query.min_confidence) {
        continue;
      }

      if (query.only_noun_roles && !nounRoleTypes.has(edge.predicate_type)) continue;
      if (query.only_pronoun_relations && nounRoleTypes.has(edge.predicate_type)) continue;

      const source = tree.roles.nodes.get(edge.source)?.lemma ?? edge.source;
      const target = tree.roles.nodes.get(edge.target)?.lemma ?? edge.target;

      if (query.subject) {
        if (lemmaOf(query.subject) !== lemmaOf(source)) continue;
      }
      if (query.object) {
        if (lemmaOf(query.object) !== lemmaOf(target)) continue;
      }
      if (query.predicate) {
        if (typeof query.predicate === "string") {
          if (!edge.predicate.toLowerCase().includes(lemmaOf(query.predicate))) continue;
        } else if (edge.predicate_type !== query.predicate) {
          continue;
        }
      }

      if (q) {
        const hay = `${source} ${edge.predicate} ${target}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }

      results.push({
        kind: "edge",
        edge,
        score: edge.confidence,
        snippet: `${source} ${edge.predicate} ${target}`
      });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }
}

