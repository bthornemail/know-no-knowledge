import type {
  ClassifiedTriple,
  SPOEdge,
  SPONode,
  SPOTree
} from "../types/spo";
import { PredicateType } from "../types/spo";

function nodeIdFromLemma(lemma: string): string {
  return lemma.toLowerCase().replace(/\s+/g, "_");
}

export class SPOTreeBuilder {
  private nodes = new Map<string, SPONode>();
  private edges: SPOEdge[] = [];
  private roleRoots = new Set<string>();

  build(triples: ClassifiedTriple[]): SPOTree {
    this.nodes.clear();
    this.edges = [];
    this.roleRoots.clear();

    this.createNodes(triples);
    this.buildRoleHierarchy(triples.filter((t) => t.classification.is_noun_role));
    this.buildRelationGraph(
      triples.filter((t) => t.classification.is_pronoun_relation)
    );

    const depthMap = this.computeDepthMap();
    const depths = [...depthMap.values()];
    const maxDepth = depths.length ? Math.max(...depths) : 0;
    const avgDepth = depths.length
      ? depths.reduce((a, b) => a + b, 0) / depths.length
      : 0;

    const nounRoles = this.edges.filter((e) =>
      [
        PredicateType.IS_A,
        PredicateType.INSTANCE_OF,
        PredicateType.TYPE_OF,
        PredicateType.SUBCLASS_OF,
        PredicateType.CATEGORY
      ].includes(e.predicate_type)
    ).length;

    return {
      roles: {
        roots: [...this.roleRoots]
          .map((id) => this.nodes.get(id)!)
          .filter(Boolean)
          .sort((a, b) => a.id.localeCompare(b.id)),
        nodes: this.nodes,
        depth_map: depthMap
      },
      relations: {
        edges: this.edges.slice().sort((a, b) => a.id.localeCompare(b.id)),
        adjacency: this.buildAdjacencyMap(),
        predicate_index: this.buildPredicateIndex()
      },
      stats: {
        total_nodes: this.nodes.size,
        total_edges: this.edges.length,
        noun_roles: nounRoles,
        pronoun_relations: this.edges.length - nounRoles,
        max_depth: maxDepth,
        avg_depth: avgDepth
      }
    };
  }

  private getOrCreateNode(value: string, lemma: string, pos: string): SPONode {
    const id = nodeIdFromLemma(lemma);
    const existing = this.nodes.get(id);
    if (existing) return existing;
    const node: SPONode = {
      id,
      value,
      lemma,
      pos,
      children: [],
      outgoing: [],
      incoming: []
    };
    this.nodes.set(id, node);
    this.roleRoots.add(id);
    return node;
  }

  private createNodes(triples: ClassifiedTriple[]) {
    for (const t of triples) {
      this.getOrCreateNode(t.subject, t.linguistic.subject_lemma, t.linguistic.subject_pos);
      this.getOrCreateNode(t.object, t.linguistic.object_lemma, t.linguistic.object_pos);
    }
  }

  private buildRoleHierarchy(nounRoles: ClassifiedTriple[]) {
    for (const t of nounRoles) {
      const childId = nodeIdFromLemma(t.linguistic.subject_lemma);
      const parentId = nodeIdFromLemma(t.linguistic.object_lemma);
      const child = this.nodes.get(childId);
      const parent = this.nodes.get(parentId);
      if (!child || !parent) continue;
      child.parent = parentId;
      if (!parent.children.includes(childId)) parent.children.push(childId);
      this.roleRoots.delete(childId);
    }
  }

  private buildRelationGraph(relations: ClassifiedTriple[]) {
    for (const t of relations) {
      const source = nodeIdFromLemma(t.linguistic.subject_lemma);
      const target = nodeIdFromLemma(t.linguistic.object_lemma);
      const sourceNode = this.nodes.get(source);
      const targetNode = this.nodes.get(target);
      if (!sourceNode || !targetNode) continue;

      const edge: SPOEdge = {
        id: t.id,
        source,
        target,
        predicate: t.predicate,
        predicate_type: t.classification.type,
        confidence: t.classification.confidence
      };
      this.edges.push(edge);
      sourceNode.outgoing.push(edge);
      targetNode.incoming.push(edge);
    }
  }

  private computeDepthMap(): Map<string, number> {
    const depth = new Map<string, number>();
    const queue: Array<{ id: string; d: number }> = [];
    for (const rootId of this.roleRoots) queue.push({ id: rootId, d: 0 });

    while (queue.length) {
      const cur = queue.shift()!;
      if (depth.has(cur.id)) continue;
      depth.set(cur.id, cur.d);
      const node = this.nodes.get(cur.id);
      if (!node) continue;
      const children = node.children.slice().sort();
      for (const childId of children) queue.push({ id: childId, d: cur.d + 1 });
    }
    return depth;
  }

  private buildAdjacencyMap(): Map<string, Set<string>> {
    const adj = new Map<string, Set<string>>();
    for (const e of this.edges) {
      if (!adj.has(e.source)) adj.set(e.source, new Set());
      adj.get(e.source)!.add(e.target);
    }
    return adj;
  }

  private buildPredicateIndex(): Map<PredicateType, SPOEdge[]> {
    const idx = new Map<PredicateType, SPOEdge[]>();
    for (const e of this.edges) {
      if (!idx.has(e.predicate_type)) idx.set(e.predicate_type, []);
      idx.get(e.predicate_type)!.push(e);
    }
    for (const [k, v] of idx.entries()) {
      v.sort((a, b) => a.id.localeCompare(b.id));
      idx.set(k, v);
    }
    return idx;
  }
}

