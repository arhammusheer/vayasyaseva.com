# Kannada (kn-IN) glossary

Kannada went live on 17 October 2026 for the jobs pages a Bengaluru job seeker uses: `/kn-in/jobs`, `/kn-in/jobs/bengaluru`, `/kn-in/jobs/apply`, `/kn-in/jobs/privacy` and `/kn-in/jobs/fees-and-fraud` (`WITH_KANNADA` / `WITH_REGIONAL` in `src/content/registry/pages.ts`). Everything is a draft pending native review. Other jobs pages send Kannada readers to English (`nearestLocalePath` in `src/lib/i18n.ts`). No web font (the phone's own draws Kannada); share images embed Anek Kannada (`src/assets/fonts/og/AnekKannada-Variable.ttf`, OFL).

Review questions: is the register right for factory and warehouse workers (short sentences)? Do the loanwords (ಫ್ಯಾಕ್ಟರಿ, ವೇರ್‌ಹೌಸ್, ಪ್ಯಾಕಿಂಗ್, ಶಿಫ್ಟ್) read naturally? Is "12ನೇ ತರಗತಿ / PUC" the right way to name 12th pass in Karnataka?

| English | Kannada | Notes |
|---|---|---|
| Jobs | ಉದ್ಯೋಗಗಳು | ಕೆಲಸ for "work" |
| Apply | ಅರ್ಜಿ ಸಲ್ಲಿಸಿ | |
| No fee | ಯಾವುದೇ ಶುಲ್ಕವಿಲ್ಲ | |
| Shift | ಶಿಫ್ಟ್ | |
| Workers (for a company) | ಕಾರ್ಮಿಕರು | "Request a crew" is ಕಾರ್ಮಿಕರನ್ನು ಕೇಳಿ |
| 12th pass | 12ನೇ ತರಗತಿ / PUC ಪಾಸ್ | Karnataka calls it 2nd PUC |
| Bengaluru | ಬೆಂಗಳೂರು | |
| Peenya | ಪೀಣ್ಯ | |
| Vayasya Seva | Vayasya Seva | Kept in Latin, as on the other pages |

## Language order

The picker (`src/lib/language-rank.ts`) shows three languages, **English always one of them**; the other two follow the picker cookie, the browser's languages, the area intent the request carries, the visitor's state, and the page's market. Karnataka ranks ಕನ್ನಡ first, Punjab ਪੰਜਾਬੀ. The rest are under "More languages". The header's switch uses the same ranking after load (`src/lib/language-order.ts`), with the area decision's market too, and keeps English visible on every non-English page.
