# 轮谱 · Burrowkeep

A one-page, read-only pixel loom and musical score for confirmed Squeekchain Sepolia settlements. Simplified Chinese is the default; English is available from the header.

## Install, build and preview

Requires Node.js 22 or newer and npm.

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run preview
```

Open `http://127.0.0.1:8765/preview/`. An optional port can be passed with `npm run preview -- 9000`.

The finished static site is already in **`dist/`**, alongside its source and `package-lock.json`. Upload the contents of `dist/` to any static host. Asset paths are relative, and the preview deliberately serves under a subpath. There is no deployment step, server API, build-time secret, or runtime framework dependency. Serve over HTTP rather than opening the HTML as a `file:` URL, because modules and the local archive use browser fetches.

`npm run build` recreates `dist/` deterministically by copying the seven required runtime files; no dependency code, source maps, or packaging archives are exported. Edit root `index.html`, `score.js`, `cloth.js`, and `styles.css`, then rebuild. `assets/share.svg` is the editable source of the bundled 1200×630 sharing image; it is not a runtime asset.

## Use

- **播放昨夜 / Play last night** plays the rounds of last night, stated in the player as a dated window; the same button stops it. Volume can be set to zero. Sound begins only after activation.
- Select a stitch on the cloth, use the round range, or focus the cloth and press Left/Right, Home/End. The inspector provides the full round, work, type, and note.
- **保存织物 / Save cloth** downloads an original-resolution PNG of last night's confirmed stitches only. **保存旋律 / Save melody** downloads the same sequence as a standard MIDI file, including rests and fifths.
- Refresh reads the public feed again. Playback holds its current sequence until it stops, so a refresh cannot change the score underneath it.

## Data and exact behavior

Behavior was studied at [beibei030/burrowkeep, commit 33dede8ec2165a98cd01c25416556cddb67c7e57](https://github.com/beibei030/burrowkeep/tree/33dede8ec2165a98cd01c25416556cddb67c7e57), particularly its `index.html`, `score.js`, and `cloth.js`. This is a fresh implementation of that read-only surface.

The page makes credential-free GET requests to:

- [Recent protocol events](https://api.squeekchain.com/v1/events?category=protocol&limit=100)
- [Wheel measurements](https://api.squeekchain.com/v1/status)

Only `system.settlement_completed` with `source.confirmationStatus === "safe"` and `settledThroughRound === previousSettledThroughRound + 1` enters the cloth. Explicit chain IDs other than Sepolia `11155111` are rejected. Unsigned decimal work/round values retain their precision through BigInt. Duplicate rounds count once; conflicting duplicate work values are omitted. No missing round is invented.

| Work | Cloth | Sound |
| --- | --- | --- |
| 0 | One dark stitch | A silent step |
| 1–499 | One short gold weft | C4/D4/E4/G4/A4, selected by work modulo 5 |
| ≥500 | Light weft and a 2×2 red knot | The same pitch plus a perfect fifth |

All cells are 8×24 source pixels. Work does not control height. A score step lasts 220ms; short notes last 110ms and accents 180ms. MIDI uses the same timing and pitches (format 0, 220 PPQN, 440,000µs per quarter). Playback uses a soft triangle voice; a MIDI player's instrument may sound different.

The last column is always open. Its neutral needle advances only with increasing `measurement.distanceMm`; `measurement.rpmMilli` controls its moving/rest state. RPM alone does not advance it. The baseline resets on a new confirmed round or a distance-counter reset. Missing/stale/invalid measurements stop it. No unconfirmed work field is accessed. No worker or wallet is created, and the historical game/mining modules are absent.

**“Last night” is one fixed window: the most recently finished 20:00 to 08:00, Asia/Shanghai (UTC+8), start inclusive and end exclusive.** The page follows the feed's `nextCursor` until the events are older than the window's start (at most 30 pages), then keeps later polls to the first page by joining them to that walk. The cloth shows every qualifying round from the window's start to now, with a line marking the night; Play, PNG and MIDI use only the rounds inside the window. If the window has no settlements, the player says so and those three are disabled. A read that stops partway cannot vouch for the night, so it never plays as if complete: rounds already on screen stay, or, with nothing on screen, the player says the night is not fully read yet. An empty read also keeps what is on screen, with a note that the refresh failed.

`data/settlements.json` contains 121 genuine safe single-round events from the public feed, rounds **1141–1263** without 1167–1168, which the feed settled together. The first 50 (rounds 1214–1263) were captured on **2026-11-04 at 08:24 UTC**; rounds 1141–1213 were read shortly after by following `nextCursor`, and give the archive the complete night of 3 November, 70 stitches with 11 sounding. It records its capture time, public source URL, and transaction hashes. It supplies a useful fallback when the external API cannot be reached. The loom says **存档 / Archive**, with its date below, until a successful live read. Once the archived night is no longer last night, the player names it **这一夜 / This night** rather than last night. The feed is checked every 15 seconds while visible, with an 8-second request timeout. Live access depends on the public API's availability and CORS policy.

## Validation

```sh
npm run typecheck
npm test
npx playwright install chromium
npm run test:browser
```

`test:browser` starts and closes its own preview server and browser. It tests the actual production export under `/preview/`, uses deterministic API fixtures only in the test process, and also checks the bundled archive with external requests blocked. Optional environment settings: `TEST_BROWSER=webkit`, `PLAYWRIGHT_MODULE` for an alternate installed module, and `BROWSER_EXECUTABLE` for an installed browser binary.

**The current source has not been run.** In the revision that added the night window, this machine's shell and browser both failed to start, so the production build, typecheck, unit tests, browser checks and taste probe could not be executed:

- Shell: `Sandbox is required but failed to initialize: Failed to create bridge sockets after 5 attempts.`
- Browser: Chromium aborted with `Socket path too long` on its singleton socket under the working directory's temporary path.

What that means for this revision:

| Check | Result |
| --- | --- |
| Production build (`npm run build`) | Not run. `dist/` was edited by hand with the same changes as the source; run the build to confirm it matches |
| Typecheck (`tsc --noEmit`) | Not run |
| Node tests, new night-window, feed-walk and archive cases included | Written, not run |
| Browser interactions, new paging, quiet-night, empty-read, no-`AbortSignal.timeout` and failed-read cases included | Written, not run |
| Taste probe, rendered 390px first screen, Better Interface rendered checks | Not run on this revision |
| Better Interface without-a-browser review | Done for the changed code; see [the validation record](artifacts/validation.md) |
| Archive rows | Read through a model-assisted web fetch rather than raw JSON. Work values were checked against the feed's `cumulativeWork` and three overlapping rows matched the earlier capture byte for byte. The other transaction hashes were not checked independently |

The previous accepted revision passed its production export, typecheck, 13 Node tests, 15 Chromium interaction checks, 6 keyboard/error/reflow checks, 16/16 of the taste probe and zero-violation axe scans. Those results describe the earlier code, not this source. Screen readers, physical phones, native browser zoom and subjective audio listening have never been tested.

See [the validation record](artifacts/validation.md) and [implemented design](DESIGN.md). The site needs no npm registry or API access to serve its bundled archive and local assets after installation/build.

## Submission budget

Maximum: **8,388,608 bytes**. Explicit path budget: source/manifests/config/tests/scripts ≤512KiB; source assets/data ≤256KiB; `dist/` ≤256KiB; documentation/evidence ≤2MiB; `.gitignore` ≤1KiB. Excluded dependency/cache/scratch trees contribute **zero submitted bytes**. `.gitignore` names `**/node_modules/`, `**/.cache/`, `**/.npm/`, `**/.vite/`, and `test/scratch/`; it does not exclude `dist/`. No vendored registry, dependency archives, or submodules are needed.

The design review follows the pinned Better Interface guide supplied with this assignment.
