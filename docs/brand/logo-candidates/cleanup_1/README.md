# cleanup_1: main candidate for the Vayasya Seva mark

**Status:** main candidate, frozen 25 Nov 2026. Not live yet: the logo files under `public/brand/` still use the original path.

## What it is

This is the existing hand-drawn lotus mark, cleaned up without being redrawn.

- **How it was made:** each contour was averaged with its mirror image, then mirrored, so the two halves match exactly.
- **What was snapped:** only the structure.
  - axis: x = 105
  - flat bottom: y = 180
  - top tip: y = 30
  - head: a true circle at (105, 72), r = 11.125
- **What stayed free:** every other anchor, every handle length and every stroke width.
- **Why stroke widths stayed free:** the thicker joints and tapering petal tops are the mark's character. Only width differences between the left and right sides were treated as defects, and the averaging removed those.

Two rebuilds from pure arcs and constant-width strokes were tried first and rejected. Blind reviewers called them mechanical. This candidate keeps the original gesture.

## Measurements (`source/evalp.py`)

| | original `vspl.svg` | cleanup_1 |
|---|---|---|
| mirror mismatch about x = 105 | 165.6 sq units (2.0%) | **0.00** |
| bottom edge | 179.74 left, 179.19 right | **180 both ends, straight** |
| top tip | 30.06 | **30.00** |
| bounding box x | 7.77 – 202.23 | 7.763 – 202.237 (centre 105) |
| filled area | 8311.4 | 8343.5 (+0.39%) |
| anchors | 82 | 76 |

- **Distance from the original outline:** median 0.05, 95% within 0.19, maximum 0.66.
- **Where the maximum is:** the side-petal top corners, which now take the average of the slightly different left and right corners. Check these at large size before promoting.

## Files

- `cleanup_1.svg`: the candidate (viewBox 0 0 210 210, same canvas as the current logo files).
- `compare-current-vs-cleanup_1.png`: the current mark on the left, the candidate on the right.
- `diff-current-vs-cleanup_1.png`: where the candidate differs from the current mark.
- `current-mirror-mismatch.png`: where the current mark differs from its own mirror.
- `source/`: the builder.
  - `orig.svg`: an exact copy of `public/brand/logos/vspl.svg` as of the freeze.
  - `final.py`, `avg.py`, `build.py`, `geom.py`: the build scripts.
  - `evalp.py`: the measurements.

## Rebuild

Run this from inside `source/`; the scripts read `orig.svg` from the current folder:

```bash
python3 -B final.py /tmp/rebuilt.svg && cmp /tmp/rebuilt.svg ../cleanup_1.svg
```

At the freeze it rebuilt byte-for-byte. Plain Python 3 is enough; numpy is not needed.

## Promoting it later

1. Copy the path into all six files that carry the mark:
   - `public/brand/logos/vspl.svg`
   - `public/brand/logos/master-logo-light.svg`
   - `public/brand/logos/master-logo-dark.svg`
   - `public/brand/downloads/vayasya-seva-mark.svg`
   - the two Setu lockups in `public/brand/downloads/` (they wrap the path in `scale(0.209524)`, which is 44/210)
2. Regenerate the downloads with `npm run brand:assets`.
3. Make a separate favicon cut for 16–32 px with a heavier stroke and a wider body counter, because the full mark's stroke drops under 1 px at 24 px.
