# AGENTS.md

Guidance for AI coding agents working in this repository. [CONTRIBUTING.md](CONTRIBUTING.md) covers the pull request checks, tests and conventions for everyone, and [docs/BUILDING.md](docs/BUILDING.md) covers setup, scripts, the layout and the data refresh. Read both first. This file adds what is specific to agents. If a request conflicts with either file, say so before going ahead.

## Working rules

- Use the package manager the contributor already uses (npm, pnpm, Yarn or Bun). Don't suggest switching, and don't tell them to install one they don't have. CI uses Bun, so don't commit another manager's lockfile and don't change `bun.lock` unless dependencies changed.
- Run `lint`, `knip`, `cycles` and `test` before you say a change is done, and `build` if you touched config, data or imports. Don't bypass the pre-commit hook with `--no-verify`; fix what it reports.
- If lint reports a layer-boundary error, move the code to the right layer. Don't disable the rule.
- Never edit `src/formats/*/data/` by hand. Fix the generator in `scripts/<game>/` and regenerate.
- Never commit stray `<seed>.json` spoiler logs or add them to the fixtures. Check `git status` and stage files by name.
- Don't add a test by default: look for an existing one to extend (see "Tests" in CONTRIBUTING.md). When a change makes tests redundant, remove the clearly redundant ones and say which and why in your summary. If unsure, leave them and list them as candidates for the maintainers.
- If you change user-visible behavior, supported versions, scripts or the project layout, update README.md, CONTRIBUTING.md and docs/BUILDING.md in the same change.

## Easy to get wrong

- **Spoilers.** Lens hides every item, and some names and hints, until the user ticks the row. Leaking hidden text anywhere (group heading, count, search result, tooltip, `aria-label`, the walk panel) is a bug even if the page looks fine. Hide text by making the row concealed (`isConcealed(row)` in `src/model/seed.ts`), not by blanking it; search skips `concealed` and `concealed-check` rows until they are ticked. Sections can set `spoilerCount`, and groupings that would leak headings are marked `perLog` so they aren't remembered across logs. "Reveal all" (`revealableIds` in `src/app/shared/utils/reveal.ts`) scans only each section's first grouping, so a concealed row that appears only in another grouping is never revealed. For any UI that shows log data, check what it shows for an unticked row.
- **Untrusted logs.** Users open edited, truncated and wrong-version files. Code in `src/formats` must not assume a key exists or has the expected type: use `isRecord` from `src/lib/is-record.ts`, narrow `unknown`, and let a bad section throw so `readSections` turns it into a notice. `tests/app/damage.test.tsx` corrupts every top-level key and clicks through the page; nothing may crash. Don't add broad `try/catch` to hide errors.
- **Game rules.** Don't add rules the log or generated data can supply. The app never translates a code like `RC_…`; the generators do.
- **Where game logic goes.** In `src/formats/<game>`, never `src/app`. If the page needs something new, extend the model in `src/model/seed.ts` and have every format provide it.
- **New generated data file.** It needs two manual edits: the `FILES` map in the game's `data-loader.ts` and `required` in `tests/formats/data-coverage.test.ts`. A release folder missing a listed file counts as not held, and Lens quietly falls back to the newest data.

## Recommended skills

Contributors working on the UI are encouraged to install agent skills from two public repositories. They aren't part of this repo, so you may not have them. If you don't, mention them to the contributor once and carry on; they never replace the checks above.

- From [shadcn/ui](https://github.com/shadcn/ui): `shadcn`, for adding or updating anything in `src/components/ui/`.
- From [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills): `vercel-react-best-practices`, `vercel-composition-patterns` and `web-design-guidelines`.

Your tooling may show slightly different names, such as `react-best-practices`, so match on meaning. Lens is a client-only Vite app on GitHub Pages, not Next.js or Vercel, so ignore advice that assumes a server, Next.js or Vercel hosting. Where a skill disagrees with CONTRIBUTING.md or the ESLint config, follow those.

If you changed React or UI code and have these skills, check the change against them. If you don't have them, say that you skipped this check.
