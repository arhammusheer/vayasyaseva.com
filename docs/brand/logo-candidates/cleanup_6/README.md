# cleanup_6: main candidate (refined mark)

**Status:** main candidate, frozen 25 Nov 2026. It replaces cleanup_1 as the main candidate. Not live: `public/brand/` still uses the original path.

This is option F (pointed lower leaves and side petals) plus the centre petal treatment, so the same rules now apply across the whole lotus:

- sharp points;
- crisp joins;
- one even 7.8 stroke around every leaf and petal opening;
- perfect mirror symmetry;
- a flat base at y = 180.

## How it was built

| Step | Folder | What it does |
|---|---|---|
| cleanup_1 | `../cleanup_1` | the original averaged with its mirror, then snapped: axis 105, base 180, head a true circle |
| cleanup_2–4 | `../cleanup_2` … `../cleanup_4` | lower leaves: the top curve is the floor curve turned 180°, the junctions are rebuilt, the points are sharp, and the ring is an even 7.8 |
| option F | `../side-petal-options` | side petals: a 78° point, sharp tips at the stem and knuckle, an even 7.8 ring, and crisp joins |
| cleanup_6 | here | centre petal: a sharp 108° point inside and out, an even 7.8 ring, and crisp corners where it meets the body |

## Rebuild

Run this from inside `source/`; both steps reproduce byte-for-byte:

```bash
python3 -B c5.py . ../../cleanup_4/cleanup_4.svg /tmp/F.svg natural point 7.8 sharp
python3 -B c6.py . /tmp/F.svg /tmp/c6.svg natural && cmp /tmp/c6.svg ../cleanup_6.svg
```

SHA-256 of `cleanup_6.svg`: `16196d15285fd656705aa8d2d84528ed38d8d964798735a9680ebbc537a8e4fc`.

## Measurements against the original

| Stroke | Original (median) | cleanup_6 (median) |
|---|---|---|
| Lower leaf ring | 7.95 | 7.83 |
| Side petal ring | 7.77 | 7.78 |
| Centre petal ring | 7.55 | 7.80 |
| Band above the lower leaf | 8.75 | 7.80 |
| Centre petal's lower sides (side opening ↔ centre opening) | 8.26 | 8.41 |
| Stems beside the body (minimum) | 6.72 | 6.44 |
| Body bar | 8.68 | 8.54 |
| Root joint (maximum) | 11.3 | 13.7 |

Other measurements:

- **Bounds:** x 6.12–203.88, y 28.83–180. The original was x 7.77–202.23, y 30.06–179.94.
- **Head:** a true circle at (105, 72), r 11.125, with a 7.76 gap to the body bar.
- **Small sizes:** the stroke is 0.63 px at 16 px and 1.26 px at 32 px.

## Files

- `cleanup_6.svg`: the mark, on the same 210 canvas as the logo files.
- `presentation/`: the original vs refined boards. `boards.py` regenerates them from any two marks.
- `source/`: the build scripts and a copy of the original.
