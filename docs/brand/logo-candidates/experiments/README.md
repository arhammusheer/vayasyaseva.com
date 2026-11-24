# Experiments on cleanup_6 (25 Nov 2026)

`experiments-board.png` shows the original, cleanup_6 and each experiment. Every panel has the whole mark, then a close-up of the stems, the figure's lower body and the root. All the options are perfectly symmetric (mirror mismatch 0.000).

| Option | What it does | Result |
|---|---|---|
| **E1** `E1_even_strokes.svg` | The right side of each side opening becomes an exact 7.8 offset of its neighbours: the centre opening along the centre petal's lower side, and the body opening along the stems. cleanup_6's own curve is kept through the three-way joint. | The stems beside the body go from 6.44 at their thinnest to **7.75**, median 7.81 away from the joint. The centre petal's lower side goes from a median of 8.41 to **7.78** away from the joint. No pinches. |
| **E2a** `E2a_root_0.9.svg` | E1, with the lower-leaf openings' root points moved closer to the trunk (cut at 0.9 instead of 0.8 along the floor curve). The whole chain is rebuilt. | The heaviest part of the root joint drops from 13.8 to **12.8** (original 11.3). The side opening's tip sits 7.4 from the leaf, down from 8.4. The leaf's flat outer top tilts 2.4° instead of 1.5°. |
| **E2b** `E2b_root_0.95.svg` | The same, cut at 0.95. | Root joint **12.2**. The side tip sits 7.0 from the leaf; the top tilts 3.3°. |
| **E3** `E3_small_size_preview.png`, `E3_heavier_cuts_large.png` | The mark uniformly thickened by 1.5, 3 and 4.5 units, previewed at 64, 32, 24 and 16 px. Rows: original, refined, +1.5, +3, +4.5. | **+3** reads solid at 16–24 px and keeps every opening. At +4.5 the head starts to fuse with the body. This was a raster test; a real small-size version would be built with crisp offsets. |
| **E4** `E4_crisp_figure.svg` | E1, with the figure's rounded shoulders and the body opening's top corners made crisp. | The figure's stroke becomes an even 8.04, but the shoulders read as a square Π: the "letter i" look reviewers rejected earlier. It also loses the rounded shoulders' echo of the round head. |

## Rebuild

The scripts are in `source/`. Run each line from inside `source/`:

| Option | Command |
|---|---|
| E1 | `python3 -B c7.py . ../cleanup_6.svg E1.svg` |
| E2a, E2b | `python3 -B c4.py . <cleanup_1> <cleanup_3> c4.svg 7.8 136.1 <0.9 or 0.95> 80 40 -2 62 0.3`, then `c5.py … natural point 7.8 sharp`, then `c6.py … natural`, then `c7.py` |
| E4 | `python3 -B c8.py . E1.svg E4.svg` |

`<cleanup_1>` and `<cleanup_3>` are the paths to `../../cleanup_1/cleanup_1.svg` and `../../cleanup_3/cleanup_3.svg`.
