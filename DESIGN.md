# 轮谱 · Burrowkeep design

## Overview

A quiet, read-only instrument for people who want to see and hear confirmed Squeekchain Sepolia rounds. The visual idea is a dark pixel loom on warm paper. The cloth and player are the primary surface; the stitch inspector and the explanation follow it. `index.html` supplies the semantic structure, `styles.css` the visual system, `score.js` the interaction states, and `cloth.js` the exact pixel geometry.

## Colors

Canonical UI values are the custom properties at the start of `styles.css`.

| Token | Value | Role |
| --- | --- | --- |
| `--paper` | `#f4f1e8` | Page and player background |
| `--paper-hover` | `#e9e4d8` | Neutral control hover |
| `--ink` | `#2e352d` | Primary text |
| `--muted` | `#676d62` | Supporting text and data captions |
| `--rule` | `#d5d5c6` | Structural borders and unplayed progress |
| `--olive` / `--olive-hover` | `#3e4b37` / `#303d2a` | Play control and native range accent |
| `--on-olive` | `#faf8ee` | Play control text |
| `--loom` | `#272d25` | Cloth workspace |
| `--loom-text` / `--loom-muted` | `#e9e6d9` / `#b8beae` | Loom text and captions |
| `--loom-rule` | `#505a48` | Loom separators and scrollbar |
| `--focus` | `#976022` | Keyboard focus on paper |

The `THREAD` object in `cloth.js` owns raster colors: warp `#5b4737`, alternate warp `#503d30`, hem `#35291f`, rest `#30251d`, short gold `#e1ad62`, accent light `#f4dfad`, red knot `#de6047`, and neutral needle `#f8f0de`. The legend SVGs repeat these values intentionally. Red means an accent knot; it does not indicate a transaction or an error.

Rendered text contrast, measured before the night window was added and unchanged in these tokens: ink/paper **11.18:1**, muted/paper **4.72:1**, loom text/loom **11.28:1**, loom muted/loom **7.40:1**, play text/olive **8.70:1**. There is one light interface theme and one dark art surface, not a theme switch. The canvas scroller uses a light focus outline over its dark background.

## Typography

Two system font stacks; there are no font downloads. Body: `Inter`, `Noto Sans SC`, `PingFang SC`, `Microsoft YaHei`, `system-ui`, sans-serif. Display: `Noto Serif SC`, `Songti SC`, `STSong`, `SimSun`, Georgia, serif. The first available system face renders, so exact glyph shapes depend on the device.

The six sizes are 13px captions, 14px control labels, 16px body, 22px section/player headings, 28px brand, and 56px main heading. The main heading becomes 44px at 1050px, 36px at 720px, and 28px at 360px. Weights are 400 and 600. Body line height is 1.6; display 1.2; player headings 1.4. Only the main heading has tracking, at `-.03em`. Headings balance; paragraphs use pretty wrapping. Changing data uses tabular numerals. Work values wrap without truncation. Long method text is capped at 74ch.

## Layout

`.page-width` aligns the header, main and footer. It is at most 1248px with 48px side margins, becoming at most 1320px beyond 1500px. Margins step down to 28px at 1050px, 20px at 720px and 16px at 360px. Spacing uses a 4px base with 8/12/16px inside groups and 24/28/32px between groups.

`.instrument` uses a fluid loom and a 300px player. The player becomes 270px at 1050px; at 720px the player moves below the cloth. The mobile play control spans the full inner width. Downloads share a row until 360px, where they stack. The inspector changes from two columns to one, and the three legend items stack. The mobile header hides its secondary about link and keeps the language control. The English brand subtitle hides below 360px.

Each round is **8×24 source pixels**, with 4px top/bottom hems. The raster is displayed at an integer scale: 4× desktop, 3× through 720px. The scroller contains long cloths instead of shrinking their cells or overflowing the page. The latest end stays visible on resize; selection can reveal an earlier stitch. The source image export uses original pixels, holds only the night's rounds, and excludes the open cell. A stitch's horizontal offset follows its round number, so it looks the same in the cloth and the export. The canvas scroller keeps 32px above the cloth at every width so the night band is not clipped. Browser checks at 320, 390, 720, 900 and 1440px, and the check that both languages show the cloth and play action on the first 390×844 screen, were last run before the night window was added.

## Elevation & Depth

The interface is flat. Thin borders group the instrument and secondary controls; tonal contrast separates the cloth from paper. There are no shadows, floating controls, modal layers, or nested cards. The selection outline is a positioned, pointer-transparent line inside the scrolled art.

## Shapes

The instrument radius is 6px; the nested dark surface follows it with a 5px radius inside its 1px border. Buttons use 4px radii. Art remains square and pixelated. The neutral needle is one source pixel; the red accent knot is exactly 2×2 source pixels.

## Components

- **Brand/header** (`index.html`, `.site-header`, `.brand`, `.language`): home link at the leading edge, language at the trailing edge. Both utilities are unboxed text; the language control keeps its 44px height and shows a hover background. Switching updates copy, names, `lang`, title, and dynamic messages. Storage failure is harmless.
- **Loom** (`.loom`, `#canvas-scroll`, `paintCloth`): named canvas and keyboard-focusable scrolling group. Pointer selection, Left/Right, Home/End, and a native range expose every confirmed stitch. A light outline shows focus and a separate outline shows selection. The open needle gets no colored thread or trail.
- **Night band** (`.night-band`, `draw`): a 13px muted label over a 1px muted line, above the columns of the night that Play and the downloads use. It is hidden from assistive technology because the player summary states the same window, and it is not part of the PNG.
- **Player** (`.player`, `play`, `stopPlay`): one filled primary button, 48px minimum height, native progress, labeled volume range, and two outlined download buttons. The summary states the night's window, stitches and sounding rounds. Ready, playing, stopped, silent, and audio-error states use visible copy. Feed updates wait until playback stops, preserving the relationship between cloth, sound, and downloads. The heading, the button and the band say 昨夜 / last night only while the window shown is the most recently finished one, and 这一夜 / this night otherwise.
- **Data state** (`renderState`, `pull`): archive/synced labels on the loom, dated provenance below it, refresh disabled during the read, and inline retry guidance after failures. A night with no settlements, or one not fully read, says so and disables play and downloads, while later rounds stay readable in the cloth. An empty or unfinished read keeps what is shown and notes the failed refresh. With nothing to show, the summary and the feed line say the same thing. All-rest scores explain that playback will be silent.
- **Stitch inspector** (`.stitch-inspector`, `renderPicked`): native range plus an output with the round, kind, full work value, and note. Selection does not itself play audio.
- **Legend/method** (`.stitch-key`, `.method`): three unboxed sample rows, followed by native disclosure for exact event rules, source links, and the fixed window of “last night”: 20:00 to 08:00, UTC+8.

Controls have hover, active, disabled, and 2px `:focus-visible` states. Button press uses `scale(.96)` with 150ms named-property transitions. Reduced motion removes those transitions, disables smooth scrolling, and prevents automatic following during playback. No ambient animation runs. The only persistent movement is data-driven needle updates or user-started playback.

## Do’s and Don’ts

Reuse `.page-width`, the six size tokens, and the neutral button variant. Keep one filled play action. Put explanations next to the control or inside the method disclosure. Give any new state a textual cue, not just a color.

Keep the per-round cell dimensions, pitch mapping, and confirmation gate in `cloth.js`. Never use work as a bar height, turn unconfirmed work into cloth, or label a bundled archive as live. Do not add wallet, mining, game, referral, or leaderboard surfaces.

For a related page, start with the same header/container/footer, use descending headings, reuse the native controls, and test both languages at the narrow breakpoints before adding another visual token.
