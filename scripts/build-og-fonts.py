"""Static, subset brand fonts for next/og. Run: uv run --with fonttools python scripts/build-og-fonts.py"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools import subset

root = Path(__file__).resolve().parents[1] / 'src/assets/fonts'
latin = list(range(0x20, 0x250)) + list(range(0x2000, 0x2070)) + [0x20B9]
devanagari = latin + list(range(0x900, 0x980)) + list(range(0x1CD0, 0x1D00)) + [0x25CC]
fonts = [
    ('Anek Latin/AnekLatin-Variable.ttf', 'AnekLatin-SemiBold.ttf', 600, latin),
    ('Anek Devanagari/AnekDevanagari-Variable.ttf', 'AnekDevanagari-SemiBold.ttf', 600, devanagari),
    ('Hind/Hind-Regular.ttf', 'Hind-Regular.ttf', 400, devanagari),
    ('JetBrains Mono/JetBrainsMono-Variable.ttf', 'JetBrainsMono-Regular.ttf', 400, latin),
]
for source, target, weight, unicodes in fonts:
    font = TTFont(root / source)
    if 'fvar' in font:
        axes = {a.axisTag: weight if a.axisTag == 'wght' else a.defaultValue for a in font['fvar'].axes}
        font = instantiateVariableFont(font, axes, inplace=True)
    options = subset.Options()
    options.layout_features = ['*']
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=unicodes)
    subsetter.subset(font)
    font.save(root / 'og' / target)
    print(target)
