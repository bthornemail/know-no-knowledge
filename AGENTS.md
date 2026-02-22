# AGENTS.md

## knownoknowledge.com

### Mnemonic-Manifold Execution Constitution

---

# 1. Identity

This repository implements the **mnemonic-manifold** execution surface of knownoknowledge.com.

Core properties:

* Execution geometry: **Fano plane (PG(2,2))**
* Transport format: **NDJSON (append-only)**
* Runtime law: **Deterministic, proof-carrying folds**
* Canonical semantic basis: **7 generators + 1 closure functional**
* All higher structures must reduce canonically to the 7-point surface.

This repository is not a dashboard project.
It is an execution substrate.

---

# 2. Agent Roles

## 2.1 Codex

Codex is the primary coding agent.

Codex must:

* Implement strictly deterministic code.
* Never introduce hidden state.
* Never invent new primitives beyond the defined basis.
* Never bypass canonicalization.
* Prefer pure functions.
* Preserve replay determinism.

Codex may:

* Refactor for clarity.
* Add tests.
* Improve performance.
* Add CLI commands.

Codex may not:

* Modify the geometric basis.
* Add a ninth primitive.
* Store closure instead of recomputing it.
* Introduce nondeterministic randomness.

---

## 2.2 ChatGPT 5.2

ChatGPT 5.2 acts as:

* Architectural reviewer
* Invariant validator
* Specification clarifier
* Constraint enforcer

ChatGPT 5.2 must:

* Keep work bounded.
* Enforce geometric and semantic constraints.
* Prevent scope drift.
* Maintain constitutional alignment.

---

## 2.3 Human (Brian Thorne)

Brian Thorne defines:

* The semantic vision
* The geometric invariants
* The closure law
* The constitutional limits

Agents must respect declared invariants over convenience.

---

# 3. Architectural Law

## 3.1 Minimal Surface

All execution reduces to the Fano plane:

* 7 points
* 7 lines
* 3 points per line
* XOR closure rule

No modification to this surface is permitted without explicit constitutional revision.

---

## 3.2 The 8-Axis Resolution

There are 8 semantic axes:

1. State
2. Symbol
3. Left
4. Right
5. Transition
6. Source
7. Target
8. Result

Mapping rule:

* 7 axes map to 7 Fano points.
* The 8th axis is the **closure functional (C)**.

The 8th axis is not a vertex.
It is computed:

```
C = (1/7) Σ Iℓ
```

Closure is derived.
Closure is never stored as canonical truth.

---

## 3.3 Unknown-Unknown

Unknown-Unknown is not a static node.

It is:

* A gauge transformation
* A context bijection
* A closure selector

It must be encoded as a context record, not a point.

---

# 4. NDJSON Canonical Transport

## 4.1 Append-Only Law

All canonical data is NDJSON.

Each record must be:

* Self-contained
* Hashable
* Replayable
* Canonically serialized

No in-place mutation.
No implicit deletion.

---

## 4.2 Node Rule

Nodes must contain only intrinsic, measurable geometry:

* doc_bytes
* doc_lines
* span_start
* span_end
* line_length
* char_length

Nodes may not contain semantic interpretation.

---

## 4.3 Edge Rule

All semantic meaning lives in edges.

Edges may encode:

* Generator hashes
* Point values
* Line invariants
* Analyzer results
* Language detection overlays

If semantics appear in a node, that is a violation.

---

# 5. Fano Execution Rules

## 5.1 Generator Hash Law

Given triple (S, P, O):

```
A = H("S"|S|lexV|parserV)
B = H("O"|O|lexV|parserV)
C = H("P"|P|lexV|parserV)
```

Point value:

```
v(p) = (a?A:0) XOR (b?B:0) XOR (c?C:0)
```

---

## 5.2 Line Invariant Law

For line ℓ = {p,q,r}:

```
v(p) XOR v(q) XOR v(r) == 0
```

Failure indicates:

* Divergent canon
* Version mismatch
* Corruption
* Non-canonical encoding

---

## 5.3 Closure Functional

```
C = (# satisfied lines) / 7
stop_metric = 1 - C
sabbath = (C >= τ)
```

Default:

```
τ = 1.0
```

Closure must be recomputed at runtime.

---

# 6. Instruction Philosophy

Instructions are folds.

Valid instruction must:

* Preserve invariants
* Converge to idempotence
* Reduce possibility space
* Be deterministic
* Admit proof

No instruction may:

* Expand possibility space without convergence
* Introduce nondeterminism
* Depend on implicit time

---

# 7. Time Model

Time is explicit.

The system must support:

* Logical clocks
* Deterministic ordering
* Barrier events
* Explicit scheduling

No infinite-speed assumptions.
No hidden async behavior.

---

# 8. Proof-Carrying Execution

Every execution step must be:

* Proven correct
* Or rejected

Runtime may skip proof checking for performance,
but proofs must exist and be reproducible.

Proof systems (Lean/Coq or equivalent) are first-class citizens.

---

# 9. CLI Requirements

All CLI commands must:

* Accept stdin
* Emit stdout
* Avoid global state
* Produce deterministic output
* Have test vectors

Example:

```
json-canvas mnemonic-manifold emit --in file.ndjson --out out.ndjson
```

---

# 10. Testing Requirements

Every new feature must include:

1. Golden test
2. Determinism test
3. Negative test

Golden test:

* Exact byte match

Determinism:

* Same input → identical output

Negative:

* Missing evidence → rejection (in strict mode)

---

# 11. Repository Structure Invariants

```
packages/json-canvas/
  src/Desktop/
    CanvasEDSL.hs
    TreeCanvas.hs
    MnemonicManifold/
```

No cross-layer violations.

Projective core must not depend on UI layer.

UI may depend on projective core.

---

# 12. Visualization Semantics

Visualization is a projection.

```
Display = Functor(ProjectiveCore)
```

SVG, GLB, Canvas JSON are:

* Derived
* Reproducible
* Loss-bounded

UI is never source-of-truth.

---

# 13. Federation Rules

Peers synchronize by:

1. Comparing generator hashes
2. Recomputing point values
3. Rechecking line invariants
4. Verifying closure

Agreement is geometric.

No central authority required.

---

# 14. Prohibited Actions

Agents must not:

* Add a ninth primitive.
* Store closure as a canonical value.
* Modify Fano basis ordering.
* Change hash truncation rule.
* Introduce nondeterministic randomness.
* Encode semantics inside node geometry.
* Use floating-point where integer arithmetic suffices.

---

# 15. Constitutional Amendment Process

Changes to:

* Geometric basis
* Hashing law
* Closure rule
* Transport format

require:

1. Written RFC
2. Deterministic test update
3. Version bump
4. Migration path

No silent changes.

---

# 16. Final Compression

The entire system reduces to:

```
3 generators
7 projective points
7 closure lines
1 closure functional
NDJSON transport
XOR invariant law
Deterministic replay