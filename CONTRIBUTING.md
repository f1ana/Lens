# Contributing to Lens

[docs/BUILDING.md](docs/BUILDING.md) covers setup, scripts, the project layout, adding a format and refreshing the reference data. This file covers how changes are made and checked. Coding agents should also read [AGENTS.md](AGENTS.md).

## Before you open a pull request

- `lint`, `knip`, `cycles` and `test` pass, and so does `build` if you touched config, data or imports. The pre-commit hook runs only ESLint and Prettier on staged files, so run the rest yourself.
- New behavior has a test, and a bug fix has a test that failed before the fix.
- If you changed user-visible behavior, supported versions, scripts or the project layout, update README.md and docs/BUILDING.md in the same change.
- Don't commit another package manager's lockfile, and don't change `bun.lock` unless dependencies changed.

## Tests

Tests use the real game logs in `tests/fixtures/logs`. Add a fixture only when the existing ones can't cover a behavior, use a log the game actually produced, and don't hand-edit one to make a test pass.

Before adding a test, look for one to extend. `tests/formats/**` and `tests/scripts/**` mirror their sources, but `tests/app/` is flat and named by behavior, so search by what a test checks. Don't delete or loosen a test just to make a failure go away.

Notes:

- `open()` in `tests/helpers.ts` reads logs with pinned data files (`tests/formats/<game>/data-<release>.ts`), so new release data doesn't change those tests. `openLogText`, the corpus test and the App tests use the real lazy loader and are async.
- `SeedView` is `lazy()`, so wait with `findBy*` or `waitFor`.
- Long lists are virtualized and render only rows near the viewport. See `tests/app/virtual-rows.test.tsx`.

## Code

- Keep to the layer boundaries in BUILDING.md's "Project layout". ESLint enforces them; move the code rather than disabling the rule.
- Import across folders with the `@/` alias, and use `./` only inside a folder.
- Code should be self documenting.  One or two lines at most of an explanation is needed.
- `src/components/ui/` is shadcn output. Add or update components with the shadcn CLI.
- Never edit `src/formats/*/data/` by hand. Fix the generator in `scripts/<game>/` and regenerate.

## Commits

One logical change per pull request.  Please squash and rebase before opening a PR.
