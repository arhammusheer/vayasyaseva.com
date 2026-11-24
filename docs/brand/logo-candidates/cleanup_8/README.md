# cleanup_8: main candidate, with small-size cuts and icons

**Status:** live since 25 Nov 2026. It's the Vayasya Seva mark everywhere: `public/brand/logos/` (master plus `vspl-small.svg` and `vspl-medium.svg`), the site icons in `src/app/`, the downloads and share images, the platform apps, the extension, the CDN and the letterheads. See `docs/brand-rules.md` for the full list.

## Why cleanup_7 was replaced

The owner found cleanup_7's root (where the lower leaves meet the trunk) too thick. The trunk was about 60% wider than the original's, because each lower-leaf opening stopped 9.5 from the centre and its top dived into that point at 63.5°.

**Fix (F1):** each lower-leaf opening's floor now runs dead flat (0°) to x = 99, close to the original's x = 98.9, instead of stopping where it curls up. Its top is still that floor turned 180°, so the leaf's flat top at the outer tip is now exactly 0°.

The alternative (F2), a shallower outer angle, made the trunk wider and pushed the leaf tips off the canvas, so it was dropped.

| Trunk | Original | cleanup_7 | **cleanup_8** |
|---|---|---|---|
| Width at y 165 | 20.6 | 26.3 | **19.5** |
| Width at y 170 | 13.0 | 21.2 | **14.3** |
| Thickest point | 13.1 | 17.5 | **14.6** |

The thickest point is back at the stem-and-band joint, where the original has it. The heaviest stroke around the lower leaf drops from 12.8 to 10.4.

## Everything else is unchanged from cleanup_7

- one 7.8 stroke around every opening;
- stems and the centre petal's lower sides at 7.8;
- the band under the side petals at 7.49 min / 7.81 median;
- sharp points and crisp joins;
- perfect symmetry;
- no visible S-bends.

## Rebuild

Run this from inside `source/`; it rebuilds byte-for-byte:

```bash
python3 -B c4.py . ../../cleanup_1/cleanup_1.svg ../../cleanup_3/cleanup_3.svg /tmp/s1.svg 7.8 136.1 0.9 80 40 -2 72 0.3 99 -
python3 -B c5.py . /tmp/s1.svg /tmp/s2.svg natural point 7.8 sharp
python3 -B c6.py . /tmp/s2.svg /tmp/s3.svg natural
python3 -B c7.py . /tmp/s3.svg /tmp/s4.svg && cmp /tmp/s4.svg ../cleanup_8.svg
```

SHA-256 of `cleanup_8.svg`: `e4b1aee2aaa3d48ba428a9309ca98de3484111e902b9040874fba3d9087ca834`.

## Small-size cuts

The master's 7.8 stroke drops under a pixel below about 32 px. The small-size cuts thicken every stroke by pushing each edge away from the ink (`source/c9.py`). Crisp corners stay crisp, any spot where the thicker outline would cross itself is cut back to a clean point, the head keeps its size, and the result is exactly symmetric.

| File | Edges moved by | Stroke | Use for |
|---|---|---|---|
| `cleanup_8-small.svg` | 3 | 13.8 | 16–24 px |
| `cleanup_8-medium.svg` | 2 | 11.8 | 32–48 px |
| `cleanup_8.svg` | — | 7.8 | 64 px and up |

To rebuild a cut: `python3 -B c9.py . ../cleanup_8.svg out.svg 3` for the small cut, or `2` for the medium.

## Icon set

`icons/` holds icons matching the current files: gold on transparent, with the mark filling about 93% of the square.

- `favicon.ico`: 16 px from the small cut, 32 and 48 px from the medium cut.
- `favicon-16.png`, `favicon-24.png`, `favicon-32.png`, `favicon-48.png`.
- `icon.png` (512 px) and `apple-icon.png` (180 px), from the master.
- `icon-small.svg`, `icon-medium.svg`, `icon-master.svg`: framed SVGs.

`icon-sizes-board.png` compares the shipped favicon with the new set at 1:1 and ×6, on light and dark.

## Other files

- `presentation/`: the original vs cleanup_8 boards. `boards.py` regenerates them.
- `root-original-c7-F1a-F1b.png`: the root close-ups behind the fix.

## Going live (done 25 Nov 2026)

- Website: the six logo files and two Setu lockups, `src/app/` icons from `icons/`, the logo kit (`pnpm brand:assets`, which now renders favicons from the small and medium cuts), and all share images (`pnpm share:build`).
- `vayasyaseva/platform`: ID, Setu and Matra logos, icons, apple icons, ID's email mark and the OG images (PR #309, `staging`); the legacy app's favicon and logo.png (PR #310, `main`).
- `vayasyaseva/harness`: the extension's logo and icons (PR #1).
- CDN: `logo/vspl.svg` (BIMI, Tiny-PS) and `logo/logo.png` (Cloudflare Access). The previous files are kept under `logo/previous/2026-11-25-*`.
- Word letterheads in Documents, Desktop and Downloads. Originals are backed up in `~/Documents/VSPL logo backups 2026-11-25/`.
- The company profile (local repo).
