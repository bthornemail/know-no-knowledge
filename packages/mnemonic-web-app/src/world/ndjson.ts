export type CanvasEvent =
  | { schema: string; op: "addNode"; node: CanvasNode }
  | { schema: string; op: "addEdge"; edge: CanvasEdge }
  | { schema: string; op: string; [k: string]: unknown };

export type CanvasNode = {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  color?: string;
};

export type CanvasEdge = {
  id: string;
  fromNode: string;
  toNode: string;
  label?: string;
  color?: string;
};

export function parseNdjsonObjects(input: string): unknown[] {
  const lines = input.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const values: unknown[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let v: unknown;
    try {
      v = JSON.parse(line);
    } catch (e) {
      throw new Error(`Invalid JSON on line ${i + 1}`);
    }
    if (typeof v !== "object" || v === null) {
      throw new Error(`Non-object record on line ${i + 1}`);
    }
    values.push(v);
  }
  return values;
}

export function parseCanvasEventsNdjson(input: string): CanvasEvent[] {
  return parseNdjsonObjects(input) as CanvasEvent[];
}
