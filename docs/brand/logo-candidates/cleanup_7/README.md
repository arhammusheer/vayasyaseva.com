# cleanup_7: main candidate

**Status:** main candidate, frozen 25 Nov 2026. It replaces cleanup_6. Not live: `public/brand/` still uses the original path.

cleanup_7 is cleanup_6 plus two experiments:

- **E1, even strokes:** the stems beside the body and the centre petal's lower sides are exact 7.8 offsets of their neighbours. cleanup_6's own curve is kept through the three-way joint.
- **E2a, lighter root:** the lower-leaf openings' root points are moved closer to the trunk (cut at 0.9 instead of 0.8 along the floor curve).

Moving the root point raised the leaf's top slightly. So the band under each side petal now follows the leaf's offset to x = 72 (it was 62) before turning into the tip, which keeps the band at 7.8.

## Rebuild

The whole chain runs from cleanup_1 and cleanup_3 and rebuilds byte-for-byte. Run it from inside `source/`:

```bash
python3 -B c4.py . ../../cleanup_1/cleanup_1.svg ../../cleanup_3/cleanup_3.svg /tmp/s1.svg 7.8 136.1 0.9 80 40 -2 72 0.3
python3 -B c5.py . /tmp/s1.svg /tmp/s2.svg natural point 7.8 sharp
python3 -B c6.py . /tmp/s2.svg /tmp/s3.svg natural
python3 -B c7.py . /tmp/s3.svg /tmp/s4.svg && cmp /tmp/s4.svg ../cleanup_7.svg
```

SHA-256 of `cleanup_7.svg`: `5bfb8b80ac6169a762a6713ef0555b2c9b206e07e53efc08d715f05009f729a0`.

## Measurements

| Stroke | Original | cleanup_6 | cleanup_7 |
|---|---|---|---|
| Rings around the openings (median) | 7.55–7.95 | 7.8 | 7.8 |
| Band under the side petal (min / median) | 8.20 / 8.75 | 7.40 / 7.80 | **7.51 / 7.84** |
| Stems beside the body (min) | 6.72 | 6.44 | **7.79** |
| Centre petal's lower sides, away from the joint (median) | 8.26 | 8.41 | **7.8** |
| Root joint (max) | 11.3 | 13.7 | **12.8** |
| Figure's body bar (median) | 8.68 | 8.54 | 8.54, unchanged by design |

Other properties:

- **Symmetry:** mirror mismatch 0.000.
- **Sharp corners, all intended:** the leaf tips, the leaf-opening points, the notches, the side-petal corners and knuckles, the side-opening tips, the centre point, and the body corners. Every other join is smooth.
- **No visible S-bends:** every curve stays on one side of its own chord.
- **Bounds:** x 6.21–203.79, y 28.83–180.

## Files

- `cleanup_7.svg`: the mark, on the 210 canvas.
- `closeup-original-cleanup6-cleanup7.png`: the stems, root and side petals compared.
- `presentation/`: original vs cleanup_7 on light and dark, colour and reversal, and sizes and usage. `boards.py` regenerates the boards.
- `source/`: the build chain and checks (`strokes.py`, `band.py`, `neck.py`, `sbend.py`).

## Still to do before going live

1. **Small-size version:** about 3 extra units of stroke weight for 16–32 px. See `../experiments/E3_*`.
2. **Production:** re-frame the mark (it's now y 28.83–180) and regenerate the six logo files, the two Setu lockups and the download kit together.
