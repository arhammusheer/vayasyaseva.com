# Kannada (kn-IN) glossary

Kannada went live on 17 October 2026 for the jobs pages a Bengaluru job seeker uses: `/kn-in/jobs`, `/kn-in/jobs/bengaluru`, `/kn-in/jobs/apply` and `/kn-in/jobs/privacy` (`WITH_KANNADA` / `WITH_REGIONAL` in `src/content/registry/pages.ts`). `/kn-in/jobs/fees-and-fraud` is retired (`RETIRED_REGIONAL`, `retiredTo: "/jobs"`) and has no Kannada copy. Everything is a draft pending native review. Other jobs pages send Kannada readers to English (`nearestLocalePath` in `src/lib/i18n.ts`). No web font (the phone's own draws Kannada); share images embed Anek Kannada (`src/assets/fonts/og/AnekKannada-Variable.ttf`, OFL).

## Register

Write everyday Bengaluru Kannada, not formal or government Kannada. Use simple written Kannada with standard verb endings (ಮಾಡುತ್ತೇವೆ, ಇದೆಯೇ) and short sentences. Avoid spoken contractions (ಮಾಡ್ತೀವಿ, ಅಂತ): they look careless in print. Where Bengaluru workers use the English word, use it (ಫೀಸ್, ನಂಬರ್, ಸರ್ಟಿಫಿಕೇಟ್, ಮೆಷಿನ್, ಲೊಕೇಶನ್).

Keep these words out of reader copy: ಸ್ವೀಕರಿಸು, ಬಯಸು, ವಾಸಿಸು, ಗರಿಷ್ಠ, ಸ್ವಯಂಚಾಲಿತ, ಸಂಕ್ಷಿಪ್ತ, ಐಚ್ಛಿಕ, ತ್ವರಿತ, ನಿಗದಿಪಡಿಸು, ಅನ್ವಯವಾದಲ್ಲಿ, ಖಾಲಿ ಹುದ್ದೆ, ಒದಗಿಸು.

The loanwords ಫ್ಯಾಕ್ಟರಿ, ವೇರ್‌ಹೌಸ್, ಪ್ಯಾಕಿಂಗ್ and ಶಿಫ್ಟ್ read naturally. Keep them.

Changing the consent checkbox (`agree` in `src/content/pages/jobs.ts`) or any `jobs-privacy.ts` text changes what applicants agree to: bump `TALENT_CONSENT_VERSION` in `src/lib/talent-intake/server.ts` in the same change. Until the owner signs off such a change, the privacy page and the checkbox keep their older wording (for example ಅರ್ಜಿ ಸಲ್ಲಿಸಲು, ಸಂಖ್ಯೆ).

## Terms

| English | Kannada | Notes |
|---|---|---|
| Jobs | ಉದ್ಯೋಗಗಳು | ಕೆಲಸ for "work" |
| Apply (button, verb) | ಅರ್ಜಿ ಹಾಕಿ | Not ಅರ್ಜಿ ಸಲ್ಲಿಸಿ (the government-form verb). The noun stays ಅರ್ಜಿ |
| No fee | ಯಾವುದೇ ಫೀಸ್ ಇಲ್ಲ | Not ಶುಲ್ಕ: workers say ಫೀಸ್ |
| Shift | ಶಿಫ್ಟ್ | |
| Full (8-hour shift) | ಪೂರ್ತಿ | "ಪೂರ್ತಿ 8 ಗಂಟೆಯ ಶಿಫ್ಟ್". Not ಪೂರ್ಣ |
| Workers (for a company) | ಕೆಲಸಗಾರರು | Not ಕಾರ್ಮಿಕರು (Labour Department word). Do not use it to address workers |
| Request a crew | ಕೆಲಸಗಾರರು ಬೇಕು | Not ಕಾರ್ಮಿಕರನ್ನು ಕೇಳಿ: with a person object it reads "ask the workers" |
| Site (worker-facing) | ಕಂಪನಿ | In Bengaluru ಸೈಟ್ means a plot or a construction site. ಸೈಟ್ is fine in HR copy. The website is ವೆಬ್‌ಸೈಟ್ |
| 10th pass | SSLC (10ನೇ) ಪಾಸ್ | Karnataka says SSLC |
| 12th pass | PUC (12ನೇ) ಪಾಸ್ | Lead with PUC (Karnataka calls it 2nd PUC) |
| Marksheet | ಮಾರ್ಕ್ಸ್ ಕಾರ್ಡ್ | Not ಅಂಕಪಟ್ಟಿ |
| Graduate | ಡಿಗ್ರಿ | Not ಪದವೀಧರ |
| Mobile number / reference number | ಮೊಬೈಲ್ ನಂಬರ್ / ರೆಫರೆನ್ಸ್ ನಂಬರ್ | Not ಸಂಖ್ಯೆ |
| Certificate / salary slip / resume | ಸರ್ಟಿಫಿಕೇಟ್ / ಸ್ಯಾಲರಿ ಸ್ಲಿಪ್ / ಬಯೋಡೇಟಾ | Not ಪ್ರಮಾಣಪತ್ರ / ಸಂಬಳದ ಚೀಟಿ / ರೆಸ್ಯೂಮೆ |
| Machine | ಮೆಷಿನ್ | Never ಯಂತ್ರ |
| Use my location | ಲೊಕೇಶನ್ | For GPS only. A typed place is ಊರು. Not ಸ್ಥಳ |
| Choose | ಆರಿಸಿ | Not ಆಯ್ಕೆಮಾಡಿ |
| Elsewhere / somewhere else | ಬೇರೆ ಕಡೆ / ಬೇರೆಲ್ಲೋ | Not ಬೇರೆಡೆ |
| Optional | ಕಡ್ಡಾಯವಲ್ಲ | Not ಐಚ್ಛಿಕ |
| Business enquiries | ಬಿಸಿನೆಸ್ ಎನ್‌ಕ್ವೈರಿ | Not ವಿಚಾರಣೆಗಳು (also means a court hearing) |
| "from" after a Latin name | ನಿಂದ | "VAYSPL ನಿಂದ SMS". A detached ಇಂದ can be misread as ಇಂದು ("today") |
| Bengaluru | ಬೆಂಗಳೂರು | |
| Peenya | ಪೀಣ್ಯ | |
| Vayasya Seva | Vayasya Seva | Kept in Latin, as on the other pages |

## Language order

The picker (`src/lib/language-rank.ts`) shows three languages, **English always one of them**; the other two follow the picker cookie, the browser's languages, the area intent the request carries, the visitor's state, and the page's market. With no signal (no cookie, no intent), location weighs more: an Indian visitor's state comes before the browser's languages, since most Indian phones list Hindi or English whatever the person reads. Karnataka ranks ಕನ್ನಡ first, Punjab ਪੰਜਾਬੀ. The rest are under "More languages". The header's switch uses the same ranking after load (`src/lib/language-order.ts`), with the area decision's market too, and keeps English visible on every non-English page.
