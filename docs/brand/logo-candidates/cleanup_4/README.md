# cleanup_4: pointed lower leaves with an even stroke all round

**Status:** candidate, frozen 25 Nov 2026. It's built on [cleanup_3](../cleanup_3/README.md). cleanup_1 is still the main candidate until the owner picks one. Not live.

## What changed from cleanup_3

### Pointed leaf openings

- **Root end:** the floor curve is cut where it still runs flat, about 1.6° from level (cleanup_1's segment 4 at t = 0.8). That gives a point at (93.63, 172.17).
- **Outer end:** the floor curve is extended along its own 63.5° direction up to y = 136.1, giving a point at (18.57, 136.10).
- **Top:** that chain turned 180° about the midpoint of the two points, as in cleanup_2.
- **Result:** both ends are sharp 65° points. The floor stays flat at the root, and the top stays flat (1.5°) at the outer end.

### An even ring of 7.8 around each leaf

Each edge around the opening is the opening's own edge offset by 7.8:

- **Bowl:** refit in two smooth pieces. It sits within 0.6 of cleanup_3.
- **Leaf's flat outer top:** the top edge offset.
- **Band under the side petal:** the same top edge offset.

### Pointed outer tips

The outer tip is where the two 7.8 offsets meet, so it's a sharp point at (6.12, 128.62). That's about 1.6 further out than the old blunt tip, so the mark now spans x 6.117–203.883.

### Notch

The side petal's outer edge is extended 1.83 along its own direction to meet the band, which gives a crisp notch at (45.27, 128.75).

### Side opening

- **Lower edge:** follows the band, then runs as one smooth curve into the tip. It has no S-bend: there's no change of curvature sign (checked by `curv.py`).
- **Tip:** cleanup_1's tip, slid 2.22 down the stem edge.
- **Neck:** the stroke between the side opening and the body is 6.30 at its narrowest. It was 6.75 in cleanup_1.

## Stroke around the left leaf (`source/ring.py`)

| Where | Width |
|---|---|
| Inner stroke (band above the leaf), from the tip to x = 75 | 7.5 – 8.0 |
| Bottom of the ring, all the way | 7.7 – 7.9 |
| Side-petal junction (three strokes meet) | 9.2 – 9.8 |
| Root joint (leaf, stem and trunk meet), x 80 → 90 | 8.8 → 13.4 |

In cleanup_3 the inner stroke ran from 6.9 to 10.9.

## Corners and checks

- **Sharp corners, all intended:** the two outer tips, the two notches, and the four ends of the leaf openings. Every other join is smooth to within 0.5°.
- **Symmetry:** mirror mismatch 0.000.
- **Unchanged from cleanup_3:** the body, centre petal and head.

## Rebuild

Run this from inside `source/`:

```bash
python3 -B c4.py . ../../cleanup_1/cleanup_1.svg ../../cleanup_3/cleanup_3.svg /tmp/rebuilt.svg 7.8 136.1 0.8 80 40 -2 62 0.3 && cmp /tmp/rebuilt.svg ../cleanup_4.svg
```

At the freeze it rebuilt byte-for-byte.

The arguments, in order:

| Value | What it sets |
|---|---|
| 7.8 | ring width |
| 136.1 | y of the outer point |
| 0.8 | where the floor is cut at the root |
| 80 | legacy, no effect |
| 40 | x of the extra bowl anchor |
| -2 | tip slide (negative moves it down) |
| 62 | hand-off point for the band |
| 0.3 | handle length of the closing curve |
