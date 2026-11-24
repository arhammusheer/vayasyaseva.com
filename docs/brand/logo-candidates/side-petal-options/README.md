# Side-petal options: Original, then A to G

Each option is cleanup_4 (the pointed lower leaves with an even ring) plus a different treatment of the side petals (the middle leaves). Nothing else differs. `original.svg` is the untouched live mark, `public/brand/logos/vspl.svg`. `options-board.png` shows them all side by side: the full mark, then a close-up of the left side petal.

| Option | Outer corner | Tip by the stem | Knuckle |
|---|---|---|---|
| A | 78°, natural | pointed | round |
| B | 90° | pointed | round |
| C | 90° | round | round |
| D | 75°, curved top | pointed | sharp |
| E | 90° | pointed | sharp |
| F | 78°, natural | pointed | sharp |
| G | 90° | round | sharp |

- **Outer corner:** the angle of the petal's outer corner. The opening's top tip has the same angle.
- **Tip by the stem:** the opening's lowest tip, where it meets the stem.
- **Knuckle:** where the opening's top edge turns down into the centre petal.
- **Option E** is the one frozen as cleanup_5.

## Shared properties

All options:

- are perfectly symmetric;
- span y 30–180;
- have an outer edge and top edge on each side petal that are exact 7.8 offsets of its opening.

## Rebuild

Every option is built with `../cleanup_5/source/c5.py` from `../cleanup_4/cleanup_4.svg`:

| Option | Arguments |
|---|---|
| A | `natural point` |
| B | `right point` |
| C | `right round` |
| D | `75 point 7.8 sharp` |
| E | `right point 7.8 sharp` |
| F | `natural point 7.8 sharp` |
| G | `right round 7.8 sharp` |
