# Contributing to Wera Admin

## Setup

Requirements: Node 26 (what CI and the Docker image use) and a running Wera API.

```sh
npm ci
npm run dev         # Vite on :5175; /api goes to WERA_API (default :8080)
```

## Checks before a pull request

```sh
npm run lint        # ESLint with type-aware rules, zero warnings
npm run typecheck
npm test            # Vitest; npm run coverage for the CI threshold
```

## Layout

- `src/pages`: one file per console page.
- `src/api`: the client for `/api/admin/*`; `src/components`: shared UI.
- `src/test`: render helpers. Tests sit next to the code they test.

## Branches and pull requests

- Work on a branch from `dev` and open a pull request into `dev`. `dev` then
  reaches `main` through its own pull request. CI must pass at each step.
- Keep commits small and focused: one logical change each.
- Commit subjects follow [Conventional Commits](https://www.conventionalcommits.org):
  `type(scope): subject`, lowercase and imperative, no trailing period, e.g.
  `feat(tracker): drag jobs between columns` or `fix(api): refuse expired tokens`.
  Types: `feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `build`, `ci`, `chore`.
  The body says why. A pull request check enforces the format.
- Releases are automatic: release-please reads the commits on `main` and keeps
  a release pull request with the next version and the changelog. Merging it
  cuts the release.

## Code style

- Write code that reads like the code around it: same naming, same comment
  density, same idioms.
- Comments explain why, not what. Exported names get a doc comment.
- Every lint exception names its rule and says why.
- New behavior comes with tests; bugs get a test that fails before the fix.

## Diagrams

The architecture diagrams are Excalidraw files; see `docs/diagrams/README.md`.
