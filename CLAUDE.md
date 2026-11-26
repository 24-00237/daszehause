# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A set of interactive 3D design studies, published on GitHub Pages at https://24-00237.github.io/daszehause/. Each study is one self-contained HTML page:

- `index.html`: the home page that introduces all five studies (no 3D, just CSS and SVG)
- `zuhause/`: das Zuhause, a residence in tropical brutalism
- `fernweh/`: Fernweh, an explorer yacht (it docks at das Zuhause's jetty)
- `bergruhe/`: Bergruhe, an Alpine cabin
- `heimweg/`: Heimweg, an electric off-roader (it is also parked in Bergruhe's garage and charges in Denkraum's garage)
- `denkraum/`: Denkraum, a small studio high in a Manila tower, built around a vault
- `studies/index.html`: an old URL that now just redirects to the home page

There is no build step, no package manager, no tests and no linter. Everything (HTML, CSS, JS) is written inline in each `index.html`. Pushing to `main` publishes the site.

## Previewing locally

Icon links use absolute `/daszehause/...` paths, so serve from the **parent** of the repo for those to resolve:

```bash
cd .. && python3 -m http.server 8000
```

Then open http://localhost:8000/daszehause/ (or `/daszehause/heimweg/` and so on). Opening a file directly also works, except for the icons.

## How a study page is built

All five 3D studies follow the same pattern, so a change to one is usually a model for the others:

- **Three.js r128** loads from a CDN as classic globals (`three.min.js` from cdnjs, `OrbitControls.js` from jsdelivr), not as ES modules. Use the `THREE.*` globals and r128 APIs.
- **The design is data-driven.** Near the top of the main script are `DEF` (default design options), `STUDIES` (named variants that override `DEF`), a control schema array that builds the side panel, `PRESETS` (scene/time-of-day settings), and `VIEWS` / `WALKS` (camera positions). In the control schema, `t` is the control type (`r` range, `o` options, `b` boolean, `c` colour swatches, `p` presets) and `k` is the key into the state object `S`. Controls marked `v:1` are scene settings (time, weather) rather than part of the design. To add a feature you usually add a key to `DEF`, a control to the schema, and the geometry in the build function that reads `S`.
- **State is saved in `localStorage`** under keys named after the study (`zuhauseS2`/`zuhauseV`, `fernwehS`/`fernwehV`/`fernwehTour`/`fernwehPin`, `bergruheS`/`bergruheV`/`bergruheTour`, `heimwegS`/`heimwegV`, `denkraumS`/`denkraumV`/`denkraumTour`), plus `<study>Fold` for which panel sections are open. Fernweh reads `zuhauseS2` so the yacht scene matches the residence. If you rename keys or change their meaning, existing visitors' saved state goes stale (that is why das Zuhause is on `S2`).
- **Every page has a study switcher** (a ← link to the home page plus a link to each study; the current study's link is hidden so the row fits on one line) and a save-image export (`toDataURL`). A new study needs a link added to every page's switcher and to the home page, and the switcher must still fit the 380px panel on one row.
- **Shared toolbar layout.** Top left: `Camera ▾` and `Show ▾` (things to watch or do: present, save image…). Bottom left: the drawing modes (`Render`, `White model`, then `X-ray` or `Line drawing`), collapsed into a `Style ▾` menu on phones, then `Scene ▾` (labels, units, lights…). Keep new buttons within this pattern.
- **Panel sections fold.** A small script at the end of each page turns every `aside section` heading into a fold button; the first section starts open. On narrow screens, outside camera views step back (`Math.min(2,1.15/aspect)`) so the model fits the width.

## The Heimweg car builder is copied into three files

`function heimweg(o)` is the shared car builder. It is copied **identically** into `heimweg/index.html`, `bergruhe/index.html` (for Bergruhe's garage) and `denkraum/index.html` (for Denkraum's garage). Its header comment documents the interface: `heimweg(o) -> {g, up, lights, doors, head}`, with the nose pointing +x, y up and the wheels on y=0. Any change to the car must be made in all three copies. Only the code that calls it should differ between the pages.

## Design voice

Each page opens its `<style>` with a `VOICE / IDEA / PICTURE / COLOUR and TYPE / LAYOUT` comment that sets that study's look: Archivo type, warm paper tones, one accent colour, a panel beside the 3D view that stacks on narrow screens. Read it before changing the UI and stay within it. The README describes each study's features; update it when you add a notable feature.

## Conventions

- Commit messages start with the study's name, then a plain description: `Heimweg: tyre width option; fuel can off by default`, `Home page: ...`.
- Interface text is plain, calm English; dimensions are metric.
- Check changes on phone widths as well. Every study has a phone layout (das Zuhause puts compact menus at the bottom).
