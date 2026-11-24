# Centre petal: pointed and even, built on option F

`F_centre_natural.svg` is option F (pointed lower leaves and side petals) with the same treatment applied to the centre petal. Nothing else changes: the lower leaves, side petals, body and head are byte-identical to F.

## What changed from F

- **Point:** the centre opening's two edges continue along their own direction to meet on the axis, at (105, 38.45). That makes a sharp 108° point, which is the angle the petal's own curves meet at.
  - Only the top 16 units of each edge were redrawn, within 0.05 of the old curve.
  - Below that the edge is exactly F's.
- **Even stroke:** the petal's outline is the opening's edge offset by exactly 7.8, from the point down to where it meets the side petals. That stretch used to vary from 7.0 to 8.5; it's now 7.76–7.81.
- **Outline point:** the outline's point is where those offsets meet, at (105, 28.83). It's 1.17 above F's rounded top at 30, so the mark is now y 28.83–180.
- **Joins with the side petals:** crisp, at (67.15, 76.89).
- **Corners where the opening meets the body:** the small hooks are now crisp corners at (86.17, 114.01), extended along their own curves, like the side petals' knuckles.

## Checks

- **Symmetry:** mirror mismatch 0.000.
- **Sharp corners, all intended:** the two points, the two body corners and the two side-petal joins.
- **Smoothness:** every other join is smooth to within 0.5°.

## Why there's no sharper point

A sharper point (100°, 90° or 70°) can't meet the petal's existing curves without a reverse bend. The top turns into an onion dome; see `F_centre_dome_100.svg` and `F_centre_dome_90.svg`, kept for reference only. At 70° the tip bends more tightly than a 7.8 stroke can follow, so the outline folds over itself. A sharp point without the dome would mean redrawing the whole petal taller and narrower.

## Rebuild

Run this from inside `source/`:

```bash
python3 -B c6.py . ../../side-petal-options/option_F.svg /tmp/r.svg natural && cmp /tmp/r.svg ../F_centre_natural.svg
```

At the freeze it rebuilt byte-for-byte. The dome references use `100 7.8 30 40` and `90 7.8 30 40` as the arguments.
