# Punjabi (pa-IN) glossary

Punjabi in Gurmukhi went live on 17 October 2026, for the Jalandhar region's jobs funnel only: `/pa-in/jobs/jalandhar`, `/pa-in/jobs/apply`, `/pa-in/jobs/privacy` and `/pa-in/jobs/fees-and-fraud` (`WITH_PUNJABI` in `src/content/registry/pages.ts`). All of it is a draft pending native review, like the Hindi copy. Other jobs pages send Punjabi readers to Hinglish (`nearestLocalePath` in `src/lib/i18n.ts`).

No web font: Anek and Hind have no Gurmukhi, so the phone's own font draws it (Noto Sans Gurmukhi on Android). Share images embed Anek Gurmukhi (`src/assets/fonts/og/AnekGurmukhi-Variable.ttf`, OFL).

Review questions for the native reviewer: is the register right for factory workers (plain, short sentences, class-10 reader)? Should common English loanwords (ਪੈਕਿੰਗ, ਫ਼ੈਕਟਰੀ, ਵੇਅਰਹਾਊਸ, ਸ਼ਿਫ਼ਟ) stay as loanwords? They match how people say them.

| English | Punjabi | Notes |
|---|---|---|
| Jobs | ਨੌਕਰੀਆਂ | ਨੌਕਰੀ in the singular |
| Apply | ਅਪਲਾਈ ਕਰੋ | Loanword, as spoken; ਅਰਜ਼ੀ for "application" |
| No fee | ਕੋਈ ਫ਼ੀਸ ਨਹੀਂ | |
| Shift | ਸ਼ਿਫ਼ਟ | |
| Packing | ਪੈਕਿੰਗ | |
| Factory / Warehouse | ਫ਼ੈਕਟਰੀ / ਵੇਅਰਹਾਊਸ | |
| Workers (for a company) | ਕਾਮੇ | "Request a crew" is ਕਾਮੇ ਮੰਗੋ |
| Your details | ਤੁਹਾਡੀ ਜਾਣਕਾਰੀ | |
| Reference number | ਰੈਫ਼ਰੈਂਸ ਨੰਬਰ | |
| Jalandhar | ਜਲੰਧਰ | Hindi pages write जालंधर |
| Kapurthala | ਕਪੂਰਥਲਾ | |
| Phagwara | ਫਗਵਾੜਾ | |
| Goraya | ਗੁਰਾਇਆ | |
| Haridwar | ਹਰਿਦੁਆਰ | |
| Vayasya Seva | Vayasya Seva | Kept in Latin, as on the Hindi pages |

## Language order

The picker (`src/lib/language-rank.ts`) puts ਪੰਜਾਬੀ first for a visitor in Punjab (IP region), or for a request that names the Jalandhar region (`?cluster=jalandhar`, or Punjab place words or `jobs_punjab` in its UTM tags), then Hinglish · English · हिंदी. A language the browser asks for still comes first. The header's quick switch on the Jalandhar hub is ਪੰਜਾਬੀ · Hinglish · English. The picker's `language_choice` events (choice, position, order key) show whether the order is right.
