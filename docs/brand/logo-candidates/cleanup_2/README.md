# cleanup_2: cleanup_1 with mirrored lower leaves

**Status:** candidate, frozen 25 Nov 2026. It's built on [cleanup_1](../cleanup_1/README.md), which is still the main candidate until the owner picks one. Not live.

## The change

Each lower-leaf opening in cleanup_1 was a boat shape: the bottom curve was about 25% deeper than the top curve, and the two didn't mirror.

In cleanup_2:

- **Bottom curve:** kept exactly. It still runs flat (0°) along the floor at the root end; the largest measured move is 0.0085, which is sampling noise.
- **Top curve:** now the bottom curve turned 180° about the leaf's centre (the midpoint of the outer tip and the inner end). So the top runs flat (0°) at the outer tip, just as the floor does at the root.
- **Result:** the opening matches itself turned 180° to within 0.0005 units. The joins at both ends are smooth (vertical tangents).
- **Why 180° and not a flip:** the leaf's tip-to-root axis tilts about 23°, so a plain flip across that axis would tip the flat floor up to about 46°.

## Tweaks to keep the stroke weight

The new top curve sits up to 3.8 units higher than before, which would have pinched the band above the leaf from about 8.3 to 5.2. To compensate, a few anchors were moved rigidly (each anchor with both its handles, so joins stay smooth):

| What moved | How |
|---|---|
| Side-petal opening, anchor at the foot end of its bottom edge | up 3.71 |
| Side-petal opening, three tip anchors by the stem | 3.59 up along the stem-side edge, so the neck to the body keeps its width |
| Outer notch where the side petal rises out of the leaf | 1.90 up along the petal's outer edge |

The lift factor is `k = 1.15` (the last argument to `c2c.py`).

**Unchanged:**

- the leaf's flat outer top and the flat base
- the body, centre petal and head (byte-identical to cleanup_1)
- symmetry (mirror mismatch 0.000)
- bounds: x 7.763–202.237, y 30–180

## Band above the leaf (`source/band.py`)

| x | 24 | 36 | 42 | 54 | 66 | 72 | 78 | 84 | 90 |
|---|---|---|---|---|---|---|---|---|---|
| cleanup_1 | 7.86 | 8.04 | 8.23 | 10.68 | 8.48 | 8.34 | 8.68 | 9.10 | 10.01 |
| cleanup_2 | 7.72 | 7.32 | 7.13 | 11.2 | 8.84 | 8.31 | 8.10 | 7.78 | 9.33 |

The light stretch at x 36–42 (7.1–7.3) is on purpose. Fixing it would mean moving the anchor where the leaf's flat outer top ends, which would bend that 0° line. 7.1 is also the weight of the side-petal tops.

## Rebuild

Run this from inside `source/`:

```bash
python3 -B c2.py . ../../cleanup_1/cleanup_1.svg /tmp/step1.svg
python3 -B c2c.py . ../../cleanup_1/cleanup_1.svg /tmp/step1.svg /tmp/rebuilt.svg 1.15
cmp /tmp/rebuilt.svg ../cleanup_2.svg
```

At the freeze it rebuilt byte-for-byte. `c2.py` also writes `/tmp/step1.svg.json`, which `c2c.py` reads.
