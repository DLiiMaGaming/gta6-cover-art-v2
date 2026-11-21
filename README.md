# Vice Coast Cover Lab — GTA-style cover art maker

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

[![rank](https://make.fun/badge/gta6-cover-art-01/DLiiMaGaming/gta6-cover-art-v2/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

[![reward](https://make.fun/badge/gta6-cover-art-01/DLiiMaGaming/gta6-cover-art-v2/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Turn your own photos into a bold multi-panel poster cover — the Vice City
sunset look, thick caption lettering, no Rockstar artwork, fonts or logos
anywhere. Everything runs offline from static files; your photos never leave
your machine.

## What it does

- **Six layouts** — Nine Panel (3&times;3 grid + title band), Hero Split,
  Duo, Triptych, Film Strip and Poster.
- **Seven colour grades** — Vice Pink, Teal Dusk, Sunset Gold, Palm Noir,
  Neon Vice, Coral Heat and Midnight Palm.
- **Face-safe focus** — nine crop presets keep the focus high in the frame
  (fy 0.20–0.30) so faces survive the crop; wide panels default to fy 0.22.
- **A whole sun** — the sunset disc sits full and uncut in the top-right
  corner, drawn after the scanlines so nothing slices it.
- **Title band** — a solid ink band with a gold rule; title, subtitle and
  badge live only inside it, sized from the band height.
- **Real editor** — upload several photos, spread them across panels or fill
  panels with one photo, drag any panel to reposition its photo, scroll to
  zoom, edit the caption live.
- **Three post sizes** — 1080 &times; 1080, 1080 &times; 1350 and
  1920 &times; 1080, exported as PNG, one at a time or all three at once.

## Try it

```sh
node main.ts            # writes the entry to /output (or $MAKEFUN_OUTPUT_DIR)
node app/shots.mjs      # re-takes the four screenshots
```

Or serve `app/` with any static server and open `index.html`:

```sh
python3 -m http.server 8080 --directory app
```

Screenshot modes (used by `app/shots.mjs`):

- `?shot=cover&layout=nine&grade=vice-pink&size=wide` — a full-bleed cover
- `?shot=editor` — the editor with the sample photos loaded
- `?shot=cover&selftest=1` — renders all three export sizes and reports
  `SELFTEST OK` (or `SELFTEST FAIL`) in the page

## Files

- `app/index.html` — the editor page
- `app/style.css` — dark neon styling
- `app/render.js` — the cover renderer (layouts, grades, sun, title band)
- `app/editor.js` — editor logic, export, screenshot and selftest modes
- `app/shots.mjs` — screenshot driver (headless shell + PIL downscale)
- `app/fonts/` — Anton and Pacifico, SIL Open Font License (`OFL.txt`)
- `app/samples/` — two AI-made sample photos supplied free to use by the kit
- `main.ts` — entrypoint: copies `app/` + `screenshots/`, writes `dossier.json`
- `vendor/makefun-app.ts` — the kit's dossier library, unchanged

## License

MIT — see [LICENSE](LICENSE). Fonts under `app/fonts/` are under the SIL
Open Font License 1.1 (see `app/fonts/OFL.txt`).
