# MNEMONIC MANIFOLD CONSTITUTION

## (Unified Fano–NDJSON–Runtime Specification)

**Project:** knownoknowledge.com
**Surface:** mnemonic-manifold
**Execution Geometry:** Fano Plane (PG(2,2))
**Transport:** NDJSON (append-only)
**Runtime:** Deterministic, proof-carrying

---

# I. Foundational Geometry

## 1. The Minimal Execution Surface

The system is grounded in the Fano plane (PG(2,2)):

* 7 points
* 7 lines
* 3 points per line
* Closed under XOR
* Fully incidence determined

All higher-dimensional representations must canonically reduce to this structure.

---

## 2. The 8-Axis Resolution

The semantic system contains eight axes:

1. State
2. Symbol
3. Left
4. Right
5. Transition
6. Source
7. Target
8. Result

But the Fano plane contains only 7 structural points.

Therefore:

> Seven axes are generators.
> The eighth axis is the closure functional.

This resolves the 8-in-7 tension .

Formally:

* Let V = {7 Fano points}
* Let L = {7 Fano lines}
* Let Iℓ = line invariants
* Let C = closure functional

Execution = C(Σ Iℓ)

The 8th axis is C, not a vertex.

---

# II. Unknown-Unknown Is Not a Node

The “UNKNOWN UNKNOWN” is not a static point.

It is:

* A centroid
* A gauge transformation
* A bijection over the six anchored roles
* A dynamic completion operator

This matches the reinterpretation in the Fano NDJSON document .

It must be encoded as a context record:

```json
{"type":"context",
 "mode":"unknown_unknown",
 "bijection": {...}}
```

Not as a geometric point.

---

# III. NDJSON as Canonical Substrate

## 1. Document Is the Mnemonic Basis

The document itself is the feature set .

Every clause must emit:

* triple
* evidence span
* document size
* line count
* canonical hash

Geometry derives from measurable document facts.

### Witness Rectangle Rule

```
x = doc_bytes
y = doc_lines
width = span_start
height = span_end - span_start
```

Nodes do not store semantics.
Edges carry semantics.

---

## 2. Projective Core Encoding

Each Fano point is encoded as:

```json
{"type":"point","vec":[1,0,0]}
```

Each line:

```json
{"type":"line","points":["P1","P2","P4"]}
```

Closure is recomputed, never trusted.

---

# IV. Runtime Law (Behavior, Not Just Rendering)

Rendering is insufficient.

The system must enforce:

### 1. Line Invariants

For every line ℓ = {a,b,c}:

```
v(a) XOR v(b) XOR v(c) == 0
```

Failure = rejection or quarantine.

---

### 2. Deterministic Canonicalization

All events must be:

* Canonically serialized
* Hash stable
* Replayable
* Byte identical across peers

Mapped to runtime modules :

| Article          | Module               |
| ---------------- | -------------------- |
| Canonicalization | ULP.Canonical        |
| Validation       | ULP.Validate         |
| Merkle binding   | ULP.Merkle           |
| Merge law        | ULP.Merge            |
| Replay           | browser-v1 commit.js |

---

### 3. Proof-Carrying Execution

Every fold must:

* Preserve invariants
* Admit proof
* Be idempotent
* Reduce possibility space

Runtime may omit proofs for speed,
but proofs must exist and be reproducible.

---

# V. Closure Functional

Define:

```
C(x) = (1/7) Σ Iℓ
```

Then:

```
stop_metric = 1 − C(x)
sabbath = (C(x) ≥ τ)
```

τ defaults to 1.0 (perfect closure).

The centroid node (if visualized) reflects C(x),
but C(x) is not stored — only recomputed.

---

# VI. Federation & Mnemonic Synchronization

Federation is achieved by:

* Shared canonical document corpus
* Shared hashing law
* Shared line invariants
* Optional shared mnemonic lexicon (2048 word list, WordNet, etc.)

Peers synchronize by:

1. Comparing generator hashes
2. Recomputing point values
3. Verifying closure invariants

Agreement is geometric, not rhetorical.

---

# VII. Canvas Is a Projection Functor

The Canvas JSON (UI coordinates) is:

```
Display = F(ProjectiveCore)
```

Coordinates are not truth.
They are view.

As stated in the Fano NDJSON interpretation :

> UI is a functor from projective core to display.

---

# VIII. Tree and Repository Integration

The repository tree (TreeCanvas.hs) is a separate projection layer .

Filesystem → Canvas
Projective Core → Canvas

But only the NDJSON Fano structure is canonical.

Everything else is derivative.

---

# IX. Constitutional Guarantees

The system guarantees:

1. Minimal surface (7-point closure)
2. Deterministic replay
3. Proof-verifiable folds
4. No ninth primitive
5. Unknown-unknown is dynamic, not ontological
6. Canonical reduction of all higher forms

---

# X. Operational Definition of Knowledge

Knowledge is:

> Selection of a consistent bijection over generators that preserves closure.

Wisdom is:

> Maintaining closure under time constraints.

The Mark (failure mode) is:

> Metric without invariant (number without closure) 

---

# XI. Final Compression

Everything reduces to:

```
Generators: 3
Projective points: 7
Closure lines: 7
Observer: 1 functional
Transport: NDJSON
Law: XOR consistency
Validation: deterministic replay
```