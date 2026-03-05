import React, { useMemo, useState } from "react";
import type { SPOTriple } from "../types/spo";
import type { CorpusDelta, CorpusStats } from "../world/compare";
import { computeCorpusDelta, computeCorpusStats } from "../world/compare";
import { buildRelationOverlays, downloadText, overlaysToNdjson } from "../world/overlays";

function Table({
  title,
  rows
}: {
  title: string;
  rows: Array<{ k: string; a: number; b: number; d: number }>;
}) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
        {title}
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", fontSize: 12, color: "var(--muted)" }}>
            <th style={{ padding: "6px 0" }}>key</th>
            <th style={{ padding: "6px 0" }}>A</th>
            <th style={{ padding: "6px 0" }}>B</th>
            <th style={{ padding: "6px 0" }}>Δ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.k} style={{ borderTop: "1px solid #142030" }}>
              <td style={{ padding: "6px 0" }}>{r.k}</td>
              <td style={{ padding: "6px 0", color: "var(--muted)" }}>{r.a}</td>
              <td style={{ padding: "6px 0", color: "var(--muted)" }}>{r.b}</td>
              <td
                style={{
                  padding: "6px 0",
                  color: r.d === 0 ? "var(--muted)" : r.d > 0 ? "#86efac" : "#fca5a5"
                }}
              >
                {r.d}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ComparePanel({
  valuesA,
  triplesA,
  valuesB,
  triplesB,
  buildRootA,
  buildRootB
}: {
  valuesA: unknown[];
  triplesA: SPOTriple[];
  valuesB: unknown[];
  triplesB: SPOTriple[];
  buildRootA?: string;
  buildRootB?: string;
}) {
  const [tab, setTab] = useState<"faces" | "subjects" | "objects" | "worlds" | "layers">("faces");

  const statsA: CorpusStats = useMemo(
    () => computeCorpusStats(valuesA, triplesA),
    [valuesA, triplesA]
  );
  const statsB: CorpusStats = useMemo(
    () => computeCorpusStats(valuesB, triplesB),
    [valuesB, triplesB]
  );
  const delta: CorpusDelta = useMemo(
    () => computeCorpusDelta(statsA, statsB),
    [statsA, statsB]
  );

  const rows =
    tab === "faces"
      ? delta.predicates
      : tab === "subjects"
        ? delta.subjects
        : tab === "objects"
          ? delta.objects
          : tab === "worlds"
            ? delta.worlds
            : delta.layers;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button
          className="btn"
          onClick={() => {
            const overlays = buildRelationOverlays(triplesA, buildRootA);
            downloadText("overlay.relation.A.ndjson", overlaysToNdjson(overlays));
          }}
        >
          Export faces A
        </button>
        <button
          className="btn"
          onClick={() => {
            const overlays = buildRelationOverlays(triplesB, buildRootB);
            downloadText("overlay.relation.B.ndjson", overlaysToNdjson(overlays));
          }}
        >
          Export faces B
        </button>
        <button className="btn" onClick={() => setTab("faces")} aria-pressed={tab === "faces"}>
          Faces
        </button>
        <button className="btn" onClick={() => setTab("subjects")} aria-pressed={tab === "subjects"}>
          Subjects
        </button>
        <button className="btn" onClick={() => setTab("objects")} aria-pressed={tab === "objects"}>
          Objects
        </button>
        <button className="btn" onClick={() => setTab("worlds")} aria-pressed={tab === "worlds"}>
          Worlds
        </button>
        <button className="btn" onClick={() => setTab("layers")} aria-pressed={tab === "layers"}>
          Layers
        </button>
      </div>

      <div style={{ fontSize: 13, color: "var(--muted)" }}>
        A: {statsA.spo_triples} SPO triples ({statsA.records} records) · B: {statsB.spo_triples} SPO triples ({statsB.records} records)
      </div>

      <Table title={`Top deltas: ${tab}`} rows={rows} />
    </div>
  );
}
