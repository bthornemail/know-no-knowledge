import React, { useMemo, useState } from "react";
import type { SPOTriple, SPOTree } from "../types/spo";
import { analyzeTree } from "../spo/analyzer";
import { buildRelationOverlays, downloadText, overlaysToNdjson } from "../world/overlays";

export function SPOTreePanel({
  triples,
  tree,
  buildRootSha256
}: {
  triples: SPOTriple[];
  tree: SPOTree;
  buildRootSha256?: string;
}) {
  const [mode, setMode] = useState<"insights" | "roles" | "relations">("insights");
  const [query, setQuery] = useState("");

  const insights = useMemo(() => analyzeTree(tree), [tree]);

  const filteredEdges = useMemo(() => {
    const q = query.trim().toLowerCase();
    const edges = tree.relations.edges;
    if (!q) return edges;
    return edges.filter((e) => {
      const s = tree.roles.nodes.get(e.source)?.lemma ?? e.source;
      const t = tree.roles.nodes.get(e.target)?.lemma ?? e.target;
      return (
        s.toLowerCase().includes(q) ||
        t.toLowerCase().includes(q) ||
        e.predicate.toLowerCase().includes(q)
      );
    });
  }, [query, tree]);

  const filteredNodes = useMemo(() => {
    const q = query.trim().toLowerCase();
    const nodes = [...tree.roles.nodes.values()].sort((a, b) =>
      a.id.localeCompare(b.id)
    );
    if (!q) return nodes;
    return nodes.filter(
      (n) => n.lemma.toLowerCase().includes(q) || n.value.toLowerCase().includes(q)
    );
  }, [query, tree]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button
          className="btn"
          onClick={() => {
            const overlays = buildRelationOverlays(triples, buildRootSha256);
            const ndjson = overlaysToNdjson(overlays);
            downloadText("overlay.relation.ndjson", ndjson);
          }}
        >
          Export faces
        </button>
        <button
          className="btn"
          onClick={() => setMode("insights")}
          aria-pressed={mode === "insights"}
        >
          Insights
        </button>
        <button
          className="btn"
          onClick={() => setMode("roles")}
          aria-pressed={mode === "roles"}
        >
          Roles
        </button>
        <button
          className="btn"
          onClick={() => setMode("relations")}
          aria-pressed={mode === "relations"}
        >
          Relations
        </button>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Filter (lemma/predicate)..."
        style={{
          width: "100%",
          padding: "8px 10px",
          borderRadius: 8,
          border: "1px solid #223041",
          background: "#0f1620",
          color: "var(--fg)"
        }}
      />

      <div style={{ fontSize: 13, color: "var(--muted)" }}>
        Triples: {triples.length} · Nodes: {tree.stats.total_nodes} · Edges:{" "}
        {tree.stats.total_edges}
      </div>

      {mode === "insights" && (
        <div style={{ fontSize: 13, lineHeight: 1.5 }}>
          <div>
            Role structure: <code>{insights.role_structure}</code>
          </div>
          <div>
            Relation structure: <code>{insights.relation_structure}</code>
          </div>
          <div>
            Role complexity:{" "}
            <code>{Math.round(insights.role_complexity * 100)}%</code>
          </div>
          <div>
            Relation complexity:{" "}
            <code>{Math.round(insights.relation_complexity * 100)}%</code>
          </div>
          <ul style={{ marginTop: 10, paddingLeft: 16 }}>
            {insights.insights.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
          <div style={{ marginTop: 10, color: "var(--muted)" }}>
            This panel is a shadow analysis over canon SPO; it does not mutate
            canonical NDJSON or Canvas events.
          </div>
        </div>
      )}

      {mode === "roles" && (
        <div style={{ overflow: "auto", maxHeight: 520 }}>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
            Nodes are lemma-keyed (deterministic), not “entities”.
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", fontSize: 12, color: "var(--muted)" }}>
                <th style={{ padding: "6px 0" }}>id</th>
                <th style={{ padding: "6px 0" }}>lemma</th>
                <th style={{ padding: "6px 0" }}>pos</th>
                <th style={{ padding: "6px 0" }}>children</th>
              </tr>
            </thead>
            <tbody>
              {filteredNodes.slice(0, 200).map((n) => (
                <tr key={n.id} style={{ borderTop: "1px solid #142030" }}>
                  <td style={{ padding: "6px 0", fontFamily: "monospace" }}>
                    {n.id}
                  </td>
                  <td style={{ padding: "6px 0" }}>{n.lemma}</td>
                  <td style={{ padding: "6px 0", color: "var(--muted)" }}>{n.pos}</td>
                  <td style={{ padding: "6px 0", color: "var(--muted)" }}>
                    {n.children.length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredNodes.length > 200 && (
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
              Showing first 200 of {filteredNodes.length}.
            </div>
          )}
        </div>
      )}

      {mode === "relations" && (
        <div style={{ overflow: "auto", maxHeight: 520 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", fontSize: 12, color: "var(--muted)" }}>
                <th style={{ padding: "6px 0" }}>from</th>
                <th style={{ padding: "6px 0" }}>predicate</th>
                <th style={{ padding: "6px 0" }}>to</th>
              </tr>
            </thead>
            <tbody>
              {filteredEdges.slice(0, 200).map((e) => {
                const s = tree.roles.nodes.get(e.source)?.lemma ?? e.source;
                const t = tree.roles.nodes.get(e.target)?.lemma ?? e.target;
                return (
                  <tr key={e.id} style={{ borderTop: "1px solid #142030" }}>
                    <td style={{ padding: "6px 0" }}>{s}</td>
                    <td style={{ padding: "6px 0", color: "var(--muted)" }}>
                      {e.predicate}
                    </td>
                    <td style={{ padding: "6px 0" }}>{t}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredEdges.length > 200 && (
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
              Showing first 200 of {filteredEdges.length}.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
