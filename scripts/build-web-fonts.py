#!/usr/bin/env python3
"""
Builds the site's script-specific web fonts (src/assets/fonts/optimized/)
from the original TTFs in src/assets/fonts/<Family>/, so every script on the
site renders in its own cut of the two brand families:

  headings  Anek Latin · Anek Devanagari · Anek Kannada · Anek Gurmukhi
  body      Hind (Latin, Devanagari) · Hind Mysuru (Kannada) · Hind Jalandhar (Gurmukhi)

Each file holds one script only (its RANGES entry, the same range
src/lib/fonts.ts declares as unicode-range), so a page downloads only the
scripts it shows. Anek is variable: width pinned at 100, weight kept at
500-600 (every heading weight the CSS uses). SHAPING_FEATURES keeps the
OpenType features Indic shaping depends on (conjuncts, matras, reph) and
drops stylistic alternates.

  python3 -m pip install fonttools brotli
  python3 scripts/build-web-fonts.py

The Latin and Hind Devanagari files predate this script and are left as they are.
"""
from io import BytesIO
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "src/assets/fonts"
OUT = FONTS / "optimized"

# Keep in step with the unicode-range declarations in src/lib/fonts.ts.
RANGES = {
    "Devanagari": "U+0900-097F, U+1CD0-1CF9, U+200C-200D, U+20A8, U+20B9, U+20F0, U+25CC, U+A830-A839, U+A8E0-A8FF",
    "Kannada": "U+0C80-0CF3, U+1CD0, U+1CD2-1CD3, U+1CDA, U+1CF2, U+1CF4, U+200C-200D, U+20B9, U+25CC, U+A830-A835",
    "Gurmukhi": "U+0951-0952, U+0964-0965, U+0A01-0A76, U+200C-200D, U+20B9, U+25CC, U+262C, U+A830-A839",
}

ANEK = [
    ("Anek Devanagari/AnekDevanagari-Variable.ttf", "AnekDevanagari-Devanagari.woff2", "Devanagari"),
    ("Anek Kannada/AnekKannada-Variable.ttf", "AnekKannada-Kannada.woff2", "Kannada"),
    ("Anek Gurmukhi/AnekGurmukhi-Variable.ttf", "AnekGurmukhi-Gurmukhi.woff2", "Gurmukhi"),
]
HIND = [
    ("Hind Mysuru/HindMysuru-{w}.ttf", "HindMysuru-{w}-Kannada.woff2", "Kannada"),
    ("Hind Jalandhar/HindJalandhar-{w}.ttf", "HindJalandhar-{w}-Gurmukhi.woff2", "Gurmukhi"),
]
HIND_WEIGHTS = ["Regular", "SemiBold", "Bold"]

# The features Indic shaping needs (HarfBuzz's Indic and USE shapers) plus
# kerning and mark positioning. Stylistic alternates (salt, ssNN, aalt) are
# left out: they double Anek Devanagari's size and the site never asks for them.
SHAPING_FEATURES = [
    "ccmp", "locl", "nukt", "akhn", "rphf", "rkrf", "pref", "blwf", "abvf", "half", "pstf", "vatu", "cjct",
    "init", "pres", "abvs", "blws", "psts", "haln", "calt", "rlig", "liga", "clig",
    "kern", "dist", "abvm", "blwm", "mark", "mkmk", "curs", "rvrn",
]


def codepoints(spec: str) -> list[int]:
    out = []
    for part in spec.replace("U+", "").split(","):
        lo, _, hi = part.strip().partition("-")
        out.extend(range(int(lo, 16), int(hi or lo, 16) + 1))
    return out


def write_subset(font: TTFont, script: str, dest: Path) -> None:
    options = subset.Options()
    options.layout_features = SHAPING_FEATURES
    options.flavor = "woff2"
    options.name_IDs = ["*"]
    options.notdef_outline = True
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=codepoints(RANGES[script]))
    subsetter.subset(font)
    font.flavor = "woff2"
    font.save(dest)
    print(f"{dest.name:40} {dest.stat().st_size / 1024:6.1f} KB  {len(font.getBestCmap()):4} code points")


def main() -> None:
    OUT.mkdir(exist_ok=True)
    for src, dest, script in ANEK:
        font = instancer.instantiateVariableFont(TTFont(FONTS / src, lazy=False), {"wdth": 100, "wght": (500, 600)})
        # Round-trip the instance so the subsetter sees consistent glyph tables.
        buffer = BytesIO()
        font.save(buffer)
        buffer.seek(0)
        write_subset(TTFont(buffer), script, OUT / dest)
    for src, dest, script in HIND:
        for weight in HIND_WEIGHTS:
            write_subset(TTFont(FONTS / src.format(w=weight)), script, OUT / dest.format(w=weight))


if __name__ == "__main__":
    main()
