# Repository Guidelines

## Project Structure & Module Organization

- `docs/`: published/reference writing (see `docs/CONSTITUTION.md`, `docs/MANIFESTO.md`).
- `docs/narrative-series/`: long-form series content organized by series directory.
- `dev-docs/`: working notes, implementation sketches, and generated artifacts (not always “finished”).
- `packages/json-canvas/`: a small Haskell-based JSON Canvas toolkit (scripts + library modules).
  - `packages/json-canvas/app/Main.hs`: CLI entry point (work-in-progress; not currently wired to a build file).
  - `packages/json-canvas/src/Desktop/*.hs`: reusable canvas/tree utilities.

## Build, Test, and Development Commands

This repo is primarily documentation; there is no top-level build.

- Run the example generator script: `runhaskell packages/json-canvas/GenerateGraph.hs`
- Folder graph script (review before running): `runhaskell packages/json-canvas/GenerateFolderGraph.hs`
  - Note: it contains hard-coded paths and may write outside the repo.
- Search the vault quickly: `rg "keyword" docs/ dev-docs/ packages/`

## Coding Style & Naming Conventions

- Markdown: keep headings hierarchical (`#`, `##`, `###`), use relative links, and prefer small, reviewable diffs.
- Naming patterns already in use:
  - `dev-docs/YYYY-MM-DD-Topic.md` for dated technical notes.
  - Series titles under `docs/narrative-series/<Series Name>/`.
- Haskell (`packages/json-canvas/`): match existing style (2-space indentation, explicit module structure under `src/Desktop/`).

## Testing Guidelines

- No automated test suite is currently configured.
- For behavior changes to `packages/json-canvas/`, include a brief manual check in your PR (e.g., command run + expected output file).

## Commit & Pull Request Guidelines

- Git history is minimal (single “first commit”); no established message convention yet.
- Recommended: short, imperative commit subjects; optionally scope with prefixes like `docs:`, `dev-docs:`, `packages:`.
- PRs: describe intent and location of changes, link related issues/notes, and include before/after screenshots for canvas/diagram output when applicable.

## Security, Configuration, and Agent Notes

- Don’t commit secrets or private paths; prefer repo-relative configuration.
- `.obsidian/` may contain editor/vault settings—treat changes there as intentional and review carefully.
