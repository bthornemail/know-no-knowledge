import type { SPOTree } from "../types/spo";

export type SPOInsights = {
  role_structure: "hierarchical" | "flat" | "mixed";
  relation_structure: "sparse" | "dense" | "clustered";
  role_complexity: number;
  relation_complexity: number;
  insights: string[];
};

export function analyzeTree(tree: SPOTree): SPOInsights {
  const maxDepth = tree.stats.max_depth;
  const avgDepth = tree.stats.avg_depth;

  const role_structure: SPOInsights["role_structure"] =
    maxDepth === 0 ? "flat" : maxDepth >= 3 ? "hierarchical" : "mixed";

  const nodeCount = tree.roles.nodes.size;
  const edgeCount = tree.relations.edges.length;
  const possibleEdges = nodeCount * Math.max(0, nodeCount - 1);
  const density = possibleEdges ? edgeCount / possibleEdges : 0;

  const relation_structure: SPOInsights["relation_structure"] =
    density < 0.1 ? "sparse" : density > 0.5 ? "dense" : "clustered";

  const role_complexity = clamp01((Math.min(maxDepth, 5) / 5 + Math.min(avgDepth, 5) / 5) / 2);
  const relation_complexity = clamp01(density);

  const insights: string[] = [];
  insights.push(
    `Roles: ${tree.stats.noun_roles} noun-role edges; Relations: ${tree.stats.pronoun_relations} pronoun-relation edges.`
  );
  if (role_structure === "flat") {
    insights.push("Role taxonomy is flat (no parent/child structure detected).");
  } else if (role_structure === "hierarchical") {
    insights.push(`Role taxonomy is hierarchical (max depth ${maxDepth}).`);
  } else {
    insights.push(`Role taxonomy is mixed (max depth ${maxDepth}).`);
  }
  insights.push(`Relation graph density: ${(density * 100).toFixed(2)}%.`);

  return {
    role_structure,
    relation_structure,
    role_complexity,
    relation_complexity,
    insights
  };
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

