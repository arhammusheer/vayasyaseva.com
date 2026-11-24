# cleanup_5: side petals get the lower leaves' treatment

**Status:** candidate, frozen 25 Nov 2026. It's built on [cleanup_4](../cleanup_4/README.md). cleanup_1 is still the main candidate until the owner picks one. Not live.

## Brief

Give the middle leaves (the side petals) the same focus and consistency as the lower leaves: symmetry, pointed tips, and perfect curves.

## Why there's no 180° mirror

A full 180° mirror of the side opening, like the lower leaves', was measured and rejected. The opening's outer side turned around would run straight through the centre petal and into the body (see `variants/`). Making room would mean redrawing the figure, which reviewers said to protect.

## What was tried

Each option was built and checked, then ranked blind against cleanup_4 by an independent reviewer:

| Variant | Outer corner | Tip by the stem | Knuckle | Verdict |
|---|---|---|---|---|
| A | natural 78° | pointed | rounded | 2nd: "tugged upward like a flag" |
| B | exact 90° | pointed | rounded | **1st**: calm curved top, clean bottom point, most consistent with the lower leaves |
| C | exact 90° | rounded | rounded | 3rd: rounded tip by the stem breaks "pointy" |
| cleanup_4 | rounded knob | rounded | rounded | 4th: "hand-adjusted" |
| D | 75°, curved top | pointed | sharp | tried after review; reads as upright ears |
| **B + sharp knuckle** | exact 90° | pointed | sharp | **chosen → cleanup_5** |

The knuckle is the opening's top-right turn, where its top edge turns down into the centre petal. The reviewer pointed out it was the last soft tip left in every variant.

## What changed from cleanup_4 (left side; the right side mirrors it)

- **Side opening:**
  - top-left tip: an exact right angle at (39.08, 73.60); the top edge arrives level and the outer edge leaves vertical;
  - knuckle: a crisp 131° corner at (64.90, 84.80);
  - tip by the stem: a 40.7° point at (95.66, 153.30), where the band edge and the stem edge meet;
  - every curve is free of S-bends.
- **Side petal outline:**
  - the outer edge and top edge are the opening's edges offset by exactly 7.8;
  - the outer corner is where those offsets meet, a right angle at (31.28, 65.80), where the current corner is;
  - the outer edge meets the leaf's flat top in a crisp notch at (46.67, 128.93), and the leaf top is refit to it, within 0.14;
  - the top edge meets the centre petal in a crisp join at (66.12, 76.15), replacing the small rounded hook.
- **Stroke around the side opening:** the outer edge and top are now 7.5–7.9 (cleanup_4 had 7.1–7.9). The edge shared with the centre petal is unchanged. Only the three joints swell.
- **Stroke between the side opening and the body:** 6.44 at its narrowest (cleanup_4: 6.30).
- **Unchanged:** the lower-leaf openings, body, centre petal and head (identical to cleanup_4), symmetry (mirror mismatch 0.000), and bounds (x 6.117–203.883, y 30–180).

## Rebuild

Run this from inside `source/`:

```bash
python3 -B c5.py . ../../cleanup_4/cleanup_4.svg /tmp/rebuilt.svg right point 7.8 sharp && cmp /tmp/rebuilt.svg ../cleanup_5.svg
```

At the freeze it rebuilt byte-for-byte. The other variants come from the same script:

| Variant | Arguments |
|---|---|
| A | `natural point` |
| B | `right point` |
| C | `right round` |
| D | `75 point 7.8 sharp` |
