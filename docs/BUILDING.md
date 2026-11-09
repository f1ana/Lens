# Building and running Lens

Lens is a static web page built with Vite and React. There is no server or database, so running it locally means starting a dev server and opening it in a browser.

## Requirements

- **Node.js 24.** The version is in [.nvmrc](../.nvmrc). A version manager such as nvm, fnm or mise will pick it up from there.
- **A package manager.** Any Node package manager can install and run the project. See [Choosing a package manager](#choosing-a-package-manager).
- **Git.** Installing dependencies sets up a pre-commit hook, which needs a Git checkout.

## Run it

From the repository root, install the dependencies and start the dev server:

```sh
<package manager> install
<package manager> run dev
```

Vite prints the local address, usually <http://localhost:5173>. The page reloads as you edit files.

To try it, open one of the spoiler logs in `tests/fixtures/logs`, or one of your own. Ship writes its logs into the `Randomizer` folder inside its save folder. 2 Ship 2 Harkinian writes its logs into a `randomizer` folder inside its app folder, unless "Generate Spoiler File" has been switched off. Lighthouse writes `<seed>.json` into a `randomizer` folder inside its app folder.

## Scripts

| Script                         | What it does                                                                |
| ------------------------------ | --------------------------------------------------------------------------- |
| `dev`                          | Starts the dev server.                                                      |
| `build`                        | Type checks, then builds the site into `dist/`.                             |
| `preview`                      | Serves the contents of `dist/` so you can check a production build locally. |
| `test`                         | Runs the tests once.                                                        |
| `lint`                         | Runs ESLint, with no warnings allowed.                                      |
| `typecheck`                    | Runs the TypeScript compiler.                                               |
| `knip`                         | Reports unused files, exports and dependencies.                             |
| `cycles`                       | Fails if any modules import each other in a circle.                         |
| `format`                       | Formats the code with Prettier.                                             |
| `generate:data`                | Builds the lookup data for one Ship release, fetched from GitHub.           |
| `generate:releases`            | Rebuilds the release list from GitHub. Needs the `gh` CLI.                  |
| `generate:2ship-data`          | Builds the lookup data for one 2Ship release, fetched from GitHub.          |
| `generate:2ship-releases`      | Rebuilds the 2Ship release list from GitHub. Needs the `gh` CLI.            |
| `generate:lighthouse-data`     | Builds the lookup data for one Lighthouse release, fetched from GitHub.     |
| `generate:lighthouse-releases` | Rebuilds the Lighthouse release list from GitHub. Needs the `gh` CLI.       |

Run any of them with your package manager's run command, for example `<package manager> run test`.

CI runs `lint`, `knip` and `cycles` in one job, `test` in another, and `build` (which type checks first) in a third. The pre-commit hook runs only ESLint and Prettier on the staged files, so run all of them before you open a pull request.

The `generate:` scripts are only for refreshing the committed data when Ship, 2Ship or Lighthouse changes. You don't need them to run Lens. See [Refresh the reference data](#refresh-the-reference-data).

## Build a production copy

```sh
<package manager> run build
<package manager> run preview
```

The build writes plain static files to `dist/`. It uses a relative base path, so you can host the folder at any address, including a sub-path.

## Tests

The tests use the real spoiler logs in `tests/fixtures/logs`. Two of them cover cases that are easy to get wrong: a log where every hint stone is a `Hardcoded Message`, and an entrance-shuffled log from 9.3.0.

Four 2 Ship 2 Harkinian 5.0.1 logs sit beside them, each with `2ship-5.0.1-` in front of its name:

- `all-shuffles.json` is Glitchless logic with the clock, swim, boss soul, Tycoon wallet and Triforce piece shuffles on.
- `glitchless.json` is Glitchless logic with those shuffles off.
- `no-logic-plentiful.json` is No Logic with Plentiful Items on, so an item can sit in more than one place.
- `vanilla.json` is Vanilla logic. It is the one log that lists all 2,641 checks, including the two Moon Majora pots that the others leave out.

Two Lighthouse 1.2.2 logs sit beside them, each with `lighthouse-1.2.2-` in front of its name:

- `all-shuffles.json` is Glitchless logic with every shuffle and junk on. It lists all 1,207 checks, plus the `RC_UNKNOWN` entry every log has.
- `no-logic.json` is No Logic with Jinjos and molehills off, so those 60 checks are absent. It shows how No Logic puts the game's dummy "Unknown" item on one real check, and it starts with two extra abilities.

`tests/corpus.test.ts` opens every log in a list of folders and checks that each one either opens with every section readable or is rejected only for its version. By default it reads the fixtures. To run it against your own logs, give it folders separated by colons:

```sh
LENS_LOG_DIRS="/path/to/Randomizer:/path/to/more/logs" <package manager> run test tests/corpus.test.ts
```

`tests/app/damage.test.tsx` removes or replaces each top-level key of a log with wrong-typed values, then opens the result and renders and clicks through every part of the page. Nothing in a log may throw past `openLogText` or crash the page.

## Refresh the reference data

A spoiler log doesn't hold everything Lens shows. Which area a check belongs to, what type of check it is, entrance names and hash icon names come from JSON files committed under `src/formats/ship/data`. The 2Ship files are in `src/formats/2ship/data`, and the Lighthouse files in `src/formats/lighthouse/data`. Each release has its own folder, named for its tag, such as `src/formats/ship/data/9.3.1`. Each game has a script that writes the data for one of its releases, and another that writes its release list. Run them only when Ship, 2Ship or Lighthouse publishes a release, then review and commit the result. Running Lens doesn't depend on them.

The data scripts fetch their source files from GitHub, so they need no checkout of Shipwright, 2 Ship 2 Harkinian or Lighthouse, and no `git` or `gh`. They need network access. GitHub's API allows 60 unauthenticated calls an hour. A run makes only a few, but if you hit the limit, set a `GITHUB_TOKEN` environment variable to a GitHub token, and the scripts use it. The token needs no scopes, because the repositories are public.

### Lookup data from Shipwright

`generate:data` reads the source of [Shipwright](https://github.com/HarbourMasters/Shipwright), the Ship of Harkinian source, as it was at one release. You give it the release's tag as the one argument, such as `9.3.1`.

1. The tag must be listed in `src/formats/ship/data/releases.json`, because that file records the commit the script reads. If the release is new, run `generate:releases` first and see [Official release list](#official-release-list).
2. Run the script, giving it the tag:

   | Package manager | Command                                   |
   | --------------- | ----------------------------------------- |
   | npm             | `npm run generate:data -- <release-tag>`  |
   | pnpm            | `pnpm generate:data <release-tag>`        |
   | Yarn            | `yarn generate:data <release-tag>`        |
   | Bun             | `bun run generate:data <release-tag>`     |

   The `--` in the npm command stops npm from taking the tag as an option of its own.

The script fetches a fixed set of source files and writes `areas.json`, `entrances.json`, `hash-icons.json`, `check-types.json` and `source.json` in `src/formats/ship/data/<release-tag>`. It prints the commit it read and a count for each file. `source.json` holds that commit, so the data always says which Shipwright it came from.

If Shipwright has moved or reshaped one of those files, the script stops and names the file it couldn't read. Nothing is written in that case, so fix the parser in `scripts/ship/parse.ts` and run it again.

When it finishes:

1. Look through the diff. A change you can't explain from what changed in Ship is worth a closer look.
2. Run the tests. Check names change between Ship versions, so each release keeps its own data, and the tests open the real logs in `tests/fixtures/logs` to check them. A test also fails if a release at or above the minimum version has no data folder.
3. Commit the new folder.

### Official release list

`generate:releases` writes `releases.json`, the commit each stable HarbourMasters release was tagged at. Lens matches a log's recorded commit against that list to say whether the build is official. It needs no checkout. Unlike the data scripts, it does need:

- the [GitHub CLI](https://cli.github.com) (`gh`), signed in, on your path
- network access to GitHub

Run it with the same pattern as the other scripts, and no argument:

```sh
<package manager> run generate:releases
```

Run it and commit the result when Ship publishes a release. Until then, a log from a newer version shows as "Build not verified" rather than "Unofficial build", and `generate:data` can't be run for it.

### Lookup data from 2 Ship 2 Harkinian

`generate:2ship-data` reads the source of [2 Ship 2 Harkinian](https://github.com/2ship2harkinian/2ship2harkinian) as it was at one release, and works like `generate:data`: you give it the release's tag, such as `5.0.1`. The tag must be listed in `src/formats/2ship/data/releases.json`, so run `generate:2ship-releases` first if the release is new.

| Package manager | Command                                         |
| --------------- | ----------------------------------------------- |
| npm             | `npm run generate:2ship-data -- <release-tag>`  |
| pnpm            | `pnpm generate:2ship-data <release-tag>`        |
| Yarn            | `yarn generate:2ship-data <release-tag>`        |
| Bun             | `bun run generate:2ship-data <release-tag>`     |

It writes `areas.json`, `checks.json`, `items.json`, `options.json` and `source.json` in `src/formats/2ship/data/<release-tag>`, and prints the commit and the four counts. The script doesn't check those counts against anything, so look at them yourself: a release that adds checks should grow them, and a drop is worth a closer look. `ORIGINAL_SCENES`, `PARENT_SCENES` and `AREA_NAMES` in `scripts/2ship/parse.ts` are hand copies of 2Ship tables, so check them against the source on each refresh.

### 2Ship release list

`generate:2ship-releases` writes `releases.json` in `src/formats/2ship/data`, the commit each stable 2Ship release was tagged at. A 2Ship log records only a commit, so Lens uses this list to name the release and to reject a log from before 5.0.1. It needs the `gh` CLI and network access, as the Ship release list does, and takes no argument.

Run both 2Ship scripts for each new 2Ship release, the release list first. Until then, its logs show as "Build not verified".

### Lookup data from Lighthouse

`generate:lighthouse-data` reads the source of [Lighthouse](https://github.com/HarbourMasters/Lighthouse) as it was at one release, and works like the others: you give it the release's tag, such as `1.2.2`. The tag must be listed in `src/formats/lighthouse/data/releases.json`, so run `generate:lighthouse-releases` first if the release is new. That script needs the `gh` CLI, as the other release scripts do.

| Package manager | Command                                              |
| --------------- | ---------------------------------------------------- |
| npm             | `npm run generate:lighthouse-data -- <release-tag>`  |
| pnpm            | `pnpm generate:lighthouse-data <release-tag>`        |
| Yarn            | `yarn generate:lighthouse-data <release-tag>`        |
| Bun             | `bun run generate:lighthouse-data <release-tag>`     |

It fetches the randomizer's type, check, item and option tables, its menu and its starting-loadout table, the game's `ShipUtils.cpp`, the pause menu's level table and two enum headers. It writes `abilities.json`, `checks.json`, `items.json`, `loadout.json`, `options.json`, `source.json`, `types.json` and `worlds.json` in `src/formats/lighthouse/data/<release-tag>`. Check names are the ones the game's tracker shows, worked out by the generator with the game's own rule, so the app never translates a code itself. The script prints the commit and the counts of checks, items, options, worlds and types: for 1.2.2 they are 1207, 13, 9, 11 and 7. It also says when it spells a type differently from its code: `RCTYPE_STOP_N_SWOP` shows as "Stop n Swop", the menu's spelling.

A Lighthouse log records no version or commit, so the release list only records which commit each release's data comes from. Lighthouse logs show as "Version not found in log".

### How Lens picks the data for a log

Each release's data loads on demand, so a visitor downloads only the data for the log they open.

- **Ship** uses the version the log says it is from, whether or not the build is verified.
- **2Ship** logs record only a commit, so Lens uses the release whose commit matches.
- **Lighthouse** logs record no version or commit, so Lens always uses the newest data it has, and the page says "Read as" that release.
- When Lens holds no data for that version or commit, such as a release newer than the committed data or a build from an unknown commit, it uses the newest data it has. It does this quietly.
- A Ship log below 9.3.0, or a 2Ship log from before 5.0.1, is rejected as unsupported. Data folders below those minimums are ignored.
- If a release's data can't be loaded, Lens shows a message about that and keeps the saved log.

Because of the newest-data rule, a new release usually opens fine before its data is committed, but its checks may be named or placed differently until you refresh. The minimums are `MINIMUM_VERSION` in `src/formats/ship/version.ts`, `src/formats/2ship/build.ts` and `src/formats/lighthouse/build.ts`.

## Project layout

- `src/model/` is the seed model. It knows no game and imports nothing else from Lens.
- `src/formats/ship/` is everything specific to Ship: recognizing a log, reading its JSON, the version rule, lookup data, hint rules and the list of sections.
- `src/formats/2ship/` is the same for 2 Ship 2 Harkinian: recognizing a log, reading its JSON, the version rule, lookup data, the hints Lens works out from the log and the list of sections.
- `src/formats/lighthouse/` is the same for Lighthouse: recognizing a log, reading its JSON, lookup data and the list of sections.
- `src/formats/shared/` is what any format can reuse: grouping rows, reading sections and showing plain lists.
- `src/app/` is the page. It sees logs only through `@/formats` and the model.
- `src/storage/` saves the last log, its ticks and layout choices, and works without browser storage.

ESLint enforces these boundaries.

## Adding a format

A format is a module that implements `LogFormat` from `src/model/seed.ts`:

1. Write `recognizes(log)`, which says whether a parsed JSON object is one of this format's logs. Use keys no other game's log has.
2. Write `read(log)`, which returns a `Seed` or a rejection. Pass the sections to `readSections` from `src/formats/shared/sections.ts`, which turns a section that throws into a notice and leaves the others alone. A section that a game's logs can't fill returns `null`, so it gets no tab.
3. Add the module to the `formats` list in `src/formats/index.ts`.
4. Add real logs to `tests/fixtures/logs`. The corpus test then covers them automatically, and the damage test needs its own block in `tests/app/damage.test.tsx`.
5. Give the format a color scheme. Add its id to `GameTheme` in `src/model/seed.ts`, set `theme` on the format and on the seed's `provenance`, add the id and its background to `THEME_COLORS` in `src/app/themes.ts`, and add a `[data-game='<id>']` block in `src/index.css` that sets the same variables as the others. The colors follow the port's page on [harbourmasters.org](https://www.harbourmasters.org).

The page shows whatever sections the format provides.

## Deployment

A GitHub Actions workflow lints, type checks, tests and builds on every push and pull request, and publishes `dist/` to GitHub Pages on each push to `main`.

In the repository settings, Pages must be set to deploy from GitHub Actions. This is a one-time step.

## Choosing a package manager

The commands above work the same way with npm, pnpm, Yarn or Bun:

| Package manager | Install        | Run a script           |
| --------------- | -------------- | ---------------------- |
| npm             | `npm install`  | `npm run dev`          |
| pnpm            | `pnpm install` | `pnpm dev`             |
| Yarn            | `yarn install` | `yarn dev`             |
| Bun             | `bun install`  | `bun run dev`          |

The repository's `bun.lock` and the `packageManager` field in `package.json` record Bun, which is what CI and the maintainers use. That is the only way it is special. If you use another package manager, you get your own lockfile, and the versions it resolves can differ from the ones in `bun.lock`. Don't commit that lockfile.

Bun is still used only to install packages and run scripts; the scripts themselves run on Node (`.nvmrc`). Corepack doesn't manage Bun, so install it yourself if you want to use it.

## Troubleshooting

- **The wrong Node version.** Switch to the version in `.nvmrc` and install again.
- **The install fails in the `prepare` step.** The step sets up Git hooks, so run the install inside a Git checkout, not a downloaded archive.
- **The port is taken.** Vite moves to the next free port and prints it.
