# cleanup_3: cleanup_2's mirrored leaves, with a seamless side-petal junction

**Status:** candidate, frozen 25 Nov 2026. It's built on [cleanup_1](../cleanup_1/README.md) and [cleanup_2](../cleanup_2/README.md). cleanup_1 is still the main candidate until the owner picks one. Not live.

## Why

cleanup_2 made each lower-leaf opening its own floor curve turned 180°. But it kept the band above the leaf at weight by moving a few anchors as rigid blocks. Where the side petal meets the leaf, that left two problems:

- **A knuckle:** the crisp outer notch became a blunt knuckle.
- **A wedge:** a heavy solid wedge appeared where the side opening's lower corner was lifted.

## What changed from cleanup_2

- **Outer silhouette:** cleanup_1's, untouched, so the notch where each side petal lands on the leaf is crisp again.
- **Side opening:** its lower sweep (the side petal's inner edge turning into the bottom edge) is cleanup_1's sweep, lifted as one smooth shape and then refitted as two smooth cubics.
  - The lift is a constant D = 3.22 along the band, which is the leaf's rise at the foot.
  - It fades to zero up the petal, between y 105 and 128.
  - It eases linearly into the tip's slide.
  - Refit error is 0.22 on the petal edge and 0.26 on the bottom edge.
- **Side opening's tip by the stem:** cleanup_1's exact shape, slid 3.58 along the stem edge, so the neck to the body keeps its width.
- **Why not hug the new leaf top exactly:** near the root, the new leaf top drops almost vertically, because it's the floor curve turned around. An edge that followed it exactly would bend into an S by the stem. Instead the band thickens slightly into the root, as the joints there do in the original mark.

**Unchanged:**

- the lower-leaf openings (identical to cleanup_2)
- the body, centre petal and head (identical to cleanup_1)
- symmetry (mirror mismatch 0.000)
- bounds: x 7.763–202.237, y 30–180
- smooth joins: no join in any contour bends more than 0.5°, the same as cleanup_1

## Band above the leaf (`source/band.py`)

| x | 24 | 36 | 42 | 48 | 60 | 66 | 72 | 78 | 84 | 90 |
|---|---|---|---|---|---|---|---|---|---|---|
| cleanup_1 | 7.86 | 8.04 | 8.23 | 9.56 | 9.13 | 8.48 | 8.34 | 8.68 | 9.10 | 10.01 |
| cleanup_3 | 7.72 | 7.32 | 6.92 | 7.73 | 9.42 | 8.38 | 7.85 | 7.69 | 7.75 | 9.31 |

The light point at x≈42 (6.9) is just left of the notch. Raising it would mean changing either the crisp notch or the leaf's flat outer top.

## Files

- `cleanup_3.svg`: the candidate (viewBox 0 0 210 210).
- `compare-cleanup_1-2-3.png`: the three candidates side by side.
- `junction-cleanup_1-vs-cleanup_3.png`: the lower-left quarter of each mark.
- `tip-cleanup_1-vs-cleanup_3.png`: a close-up of the side opening's tip.
- `source/`:
  - `c2.py`: builds the mirrored leaf.
  - `c3u.py`: builds the junction.
  - `c2lib.py`: shared helpers.
  - `band.py`: measures the band above the leaf.

## Rebuild

Run this from inside `source/`:

```bash
python3 -B c3u.py . ../../cleanup_1/cleanup_1.svg ../../cleanup_2/cleanup_2.svg /tmp/rebuilt.svg && cmp /tmp/rebuilt.svg ../cleanup_3.svg
```

At the freeze it rebuilt byte-for-byte.
