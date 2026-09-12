# AI Slop Registry -- VSPL

Internal reference for reviewing copy and UI on vayasyaseva.com. Compiled September 2026 from public detection guides (Wikipedia's *Signs of AI writing*, SlopDetector, SlopMonster, Developers Digest, TeneX, 925 Studios, GrowthGuys, Spike AI) plus the patterns found in this repo's own history.

**How to use it.** Run `npm run lint:slop` before publishing. Then read the flagged sentences aloud. The registry is descriptive, not a word ban: one "structured" is fine, six in a paragraph is a pattern. Density and clustering are the signal.

**The one rule that covers most of this:** write what a plant manager would see on a Monday morning, not what a consultant would put on slide 4.

---

## Part A -- Copy

### A1. Vocabulary tiers

Tier 1 rarely appears in human business writing. Tier 2 is fine alone, suspicious in clusters. Tier 3 is ordinary vocabulary that only flags by density. **Tier V is this site's own flavour** (see Part C).

| Tier | Words | Swap |
|---|---|---|
| 1 | delve, tapestry, testament, underscore, elucidate, embark, endeavor, encompass, multifaceted, paradigm, synergy, holistic, catalyze, realm, myriad, plethora, galvanize, epitomize, unravel, supercharge, spearhead, catapult, utilize, leverage, facilitate | plain verb: use, help, start, include, show |
| 2 | robust, comprehensive, seamless, cutting-edge, innovative, streamline, empower, foster, enhance, elevate, optimize, scalable, pivotal, intricate, profound, resonate, harness, navigate, cultivate, bolster, cornerstone, game-changer, groundbreaking, transformative, unprecedented, compelling, ever-evolving, meticulous, versatile, bespoke, unwavering, vibrant, unleash, unlock, unveil, craft(ed), hone, tailor(ed), captivate, revolutionize, amplify, illuminate, world-class, best-in-class, end-to-end, one-stop, hassle-free | name the thing instead |
| 3 | crucial, essential, vital, significant, remarkable, exceptional, furthermore, moreover, additionally, consequently, nevertheless, ultimately, arguably, indeed, notably, paramount, pragmatic, foundational, strategic, key | cut or use "also", "so" |
| V | structured, defined, disciplined/discipline, aligned/alignment, integrated, framework, layer, plane, rhythm, integrity, visibility, accountability, governance, posture, cadence, protocol(s), engine, operating model, control layer | say what the thing physically is |

Collocations that mean nothing: robust framework, multifaceted approach, seamless integration, ever-evolving landscape, holistic approach, paradigm shift, meaningful results, continuous improvement, key driver, operational excellence, operational discipline, documentation discipline, workflow discipline, compliance discipline.

### A2. Sentence constructions

| # | Pattern | Example | Fix |
|---|---|---|---|
| A2.1 | Negative parallelism | "It's not just X, it's Y." / "Not X, but Y." / "Y rather than X." / "X -- not Y." | State Y. |
| A2.2 | Tricolon reflex | "faster, smarter, and better" / "supervision, compliance, and reporting" | Use the real number of items. Two or four are fine. |
| A2.3 | List + dash + participle tail | "X, Y, and Z -- delivered with A, B, and C." | Two sentences, or cut the tail. |
| A2.4 | Present-participle commentary | "...supporting payroll accuracy", "...ensuring accountability", "...providing visibility" | Delete, or make it a sentence with a subject. |
| A2.5 | Copulative avoidance | "serves as", "acts as", "stands as", "functions as", "operates through", "represents" | "is" |
| A2.6 | Nominalisation stack | "attendance verification and reporting discipline" | Verb: "we verify attendance and send a report" |
| A2.7 | Hedge stack | "Where this capability is deployed... designed to... scope and enablement vary by engagement" | One hedge per claim, at the end. |
| A2.8 | Fake-suspense one-liner | "The result?" / "Here's the thing" | Cut. |
| A2.9 | Manufactured opener | "In today's fast-paced world", "When it comes to", "Whether you're X or Y" | Start with the fact. |
| A2.10 | Vague attribution | "industry reports", "experts agree", "studies show" | Name the source or cut. |
| A2.11 | Self-answered rhetorical question | "Why not a generic staffing model?" | Make the answer a statement. |
| A2.12 | Summary conclusion | closing line that restates the section ("This model keeps governance consistent while...") | Delete. |
| A2.13 | Synonym cycling | same idea, three headings ("Workforce-to-Shift Alignment", "Scheduling & Roster Discipline") | One heading. |
| A2.14 | Importance puffery | "one of India's most active industrial corridors", "enduring", "pivotal" | Cut or cite. |
| A2.15 | "Impact:" / "Outcome:" footers on cards | "Impact: consistent governance across all sites." | Cut. Unmeasured outcomes are claims, not proof. |

### A3. Punctuation and formatting

| # | Pattern | Threshold |
|---|---|---|
| A3.1 | Em dash density | > 1 per 220 characters, or any em dash inside a button, heading, or table cell |
| A3.2 | Semicolon chains | > 1 per paragraph in marketing copy |
| A3.3 | Title Case On Every Word Of A Sentence | headings should be sentence case unless they are proper nouns |
| A3.4 | Bold sprinkled on random nouns | bold only for the one thing the reader must not miss |
| A3.5 | Heading with only another heading under it | needs body text between levels |
| A3.6 | Emoji as bullets or dividers | never |
| A3.7 | Horizontal rules between every section | use spacing |
| A3.8 | Curly quotes / apostrophes mixed with straight ones | pick one |

### A4. Proof and specificity failures

| # | Pattern | Fix |
|---|---|---|
| A4.1 | "Measurable outcomes" with no measurement | Either give the number with a period, or drop "measurable". (Claim policy: unevidenced claims are removed, not softened.) |
| A4.2 | Round-number social proof ("10,000+ happy users") | Real number, real period, or nothing. |
| A4.3 | Testimonials with first name + initial and an avatar circle | Full name, role, company, or no testimonial. |
| A4.4 | "Trusted by" / "Enterprise associations" logo strips with no relationship stated | Say what the relationship is, within what the approval allows. |
| A4.5 | Generic value cards ("Integrity", "Excellence", "Innovation") | Replace with a concrete commitment a client can check. |
| A4.6 | Hidden facts (no phone, no address, no registration numbers) | Put GSTIN, UDYAM, address, phone in plain text. |
| A4.7 | "Fast" / "rapid" / "quick" without a number | "7--14 working days". |
| A4.8 | Same claim repeated on N pages | Say it once on the page that owns it; link to it elsewhere. |

### A5. Tone tells

- Reads like a pitch deck, not an operations brief (brand-rules.md §2 "read aloud" test).
- No first person. No "we". Everything happens in the passive: "is maintained", "are delivered", "is evaluated".
- No jaggedness: every sentence 18--26 words, every paragraph three sentences, every card two lines.
- The company name replaces the pronoun ("VSPL maintains", "VSPL deploys") in every sentence.
- Chatbot register: "Great question!", "Absolutely!", "Let's explore".
- Knowledge-cutoff or placeholder residue: "[To be documented]", "as of my last update", "lorem".

---

## Part B -- Design and UI

### B1. Colour and surface

| # | Pattern | Fix |
|---|---|---|
| B1.1 | Purple-to-blue / indigo gradient hero or buttons | Flat brand colour. |
| B1.2 | Gradient backgrounds on multiple sections | Gradients only as a deliberate single accent, if at all. |
| B1.3 | Blurred colour orbs (`blur-3xl` circles) behind content | Remove. |
| B1.4 | Radial "glow" behind headers | Remove. |
| B1.5 | Glassmorphism (`backdrop-blur` + translucent panel + 1px light border) | Solid surfaces. |
| B1.6 | Coloured drop shadows / glows | Neutral, minimal shadows on elevated components only. |
| B1.7 | Permanent dark mode with mid-grey body text | Light-first, AA contrast. |
| B1.8 | Accent colour on more than ~20% of a viewport | Neutrals carry the page. |

### B2. Typography

| # | Pattern | Fix |
|---|---|---|
| B2.1 | Inter / system-ui with no other typographic decision | A chosen typeface with a real fallback stack. |
| B2.2 | Oversized italic serif hero word (Playfair, Instrument Serif) | Consistent display face. |
| B2.3 | Gradient-filled headline text | Solid. |
| B2.4 | ALL-CAPS TRACKED "EYEBROW" labels above every heading | Sentence-case small label, or none. |
| B2.5 | Badge / pill directly above the H1 | Remove. |
| B2.6 | Centered hero sans + centered everything | Left-align long copy; center only short statements. |
| B2.7 | Giant faded wordmark as decoration | Remove. |

### B3. Layout and components

| # | Pattern | Fix |
|---|---|---|
| B3.1 | Three (or six) identical cards: icon in tinted rounded square, title, two lines | Remove the icon box. Vary treatment by content type: list, table, prose, or one strong card. |
| B3.2 | Coloured left border on cards / blockquotes | Neutral border or none. |
| B3.3 | Numbered step sequence in circles (01, 02, 03) with connector line | Plain ordered list with a rule, or a table. |
| B3.4 | Stat banner row (four big numbers) with unsourced figures | Only real, dated numbers; else remove. |
| B3.5 | Every card has `hover:-translate-y` + shadow, including non-clickable ones | Hover states only on things that do something. |
| B3.6 | Identical `rounded-xl p-6 border` on every container | One container primitive, used deliberately. Vary density. |
| B3.7 | Pill-shaped chips for non-interactive facts | Plain text or a small square badge. |
| B3.8 | Alternating zig-zag timelines | Single column. |
| B3.9 | The same section rendered on three pages | Once. |
| B3.10 | "Values" grid with abstract nouns | Concrete commitments as prose. |
| B3.11 | Footer with 4 link columns, orbs, and a tagline nobody reads | Contact, pages, legal, registration numbers. |
| B3.12 | Sidebar / nav with emoji icons | Icon set or none. |
| B3.13 | Default shadcn tokens untouched (radius, ring, shadow) | Tuned tokens. |

### B4. Motion

| # | Pattern | Fix |
|---|---|---|
| B4.1 | Scroll-triggered fade-up on every section and every card | None, or one deliberate reveal on the hero. |
| B4.2 | Staggered card entrance | Remove. |
| B4.3 | Animated gradient text / cycling colours | Remove. |
| B4.4 | Buttons that snap with no transition, or 500 ms transitions on everything | 150--200 ms on interactive elements only. |
| B4.5 | Floating 3D shapes, particles | Remove. |

### B5. Imagery

| # | Pattern | Fix |
|---|---|---|
| B5.1 | Stock: handshakes, diverse team at laptop, abstract cityscape | Photos of the actual sites, crews, and equipment. |
| B5.2 | AI-generated smooth symmetrical illustrations | Real photos or nothing. |
| B5.3 | Coloured squares with initials instead of headshots | Real headshots or no avatars. |
| B5.4 | Icons used as the only visual on a page | Photos, tables, real documents. |
| B5.5 | Client logos with `brightness-0 invert` glass treatment | Grayscale, per brand rules, on a solid surface. |

### B6. UI copy

| # | Pattern | Fix |
|---|---|---|
| B6.1 | Headline that could be any company ("Build the future of work") | Company + service + place. |
| B6.2 | "Learn More" / "Get Started" / "Discover" buttons | Say where it goes. |
| B6.3 | Success message in machine register ("Current status: received. Owner: ...") | Plain sentence. |
| B6.4 | Section titles as abstract nouns ("Compliance Posture", "Operating Philosophy", "Governance Mindset") | "Compliance", "How we work", "Where we operate". |
| B6.5 | Form placeholder that lists every service | Give an example of a good answer. |
| B6.6 | "Ready to X?" CTA headline | Tell them what to send. |

---

## Part C -- This site's flavour: abstraction stacking

Measured on 2026-09-12, before cleanup:

| Signal | Count |
|---|---|
| em dashes in copy | 109 |
| "structured" | 48 |
| "defined" | 39 |
| "discipline(d)" | 34 |
| "layer" + "plane" | 58 |
| "accountability" | 17 |
| "alignment / aligned" | 29 |
| service enumeration ("workforce deployment, civil and fabrication works, housekeeping, equipment provisioning, and machinery maintenance") | ~15 |
| "attendance gaps, shift shortfalls, documentation delays" | 6 |
| "Two Coordinated Layers/Planes" section | 3 pages |
| icon-in-tinted-square card | 40+ instances |
| blur orbs | 5 |

Template sentence found across the site: **"[noun], [noun], and [noun] -- [past participle] with [abstract noun], [abstract noun], and [abstract noun]."** Every service description, every Setu feature, every compliance card followed it.

Rewrite rule for this site: **subject, verb, object, period.** "A VSPL supervisor is on site every shift. Attendance goes to you daily in Excel." Prefer "we" to "VSPL". Prefer nouns you can photograph.

---

## Part D -- Lint

`scripts/slop-lint.mjs` scans `src/content` and `src/app/(marketing)` and `src/components/sections` for Tier 1/2/V words, dash density, and the constructions in A2. It prints counts and the offending lines. It is a smoke test, not a judge: read the lines.

```
npm run lint:slop
```

---

## Sources

- Wikipedia, *Signs of AI writing* (WikiProject AI Cleanup): https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing
- SlopDetector, *The AI Words List*: https://slopdetector.org/blog/ai-words-list
- SlopDetector, *How to Spot AI Slop*: https://slopdetector.org/blog/how-to-spot-ai-slop
- SlopMonster lint rules: https://github.com/ItsssssJack/SlopMonster
- Developers Digest, *AI Design Slop: 16 Patterns*: https://www.developersdigest.tech/blog/ai-design-slop-and-how-to-spot-it
- TeneX Studio, *8 signs a website was generated by AI*: https://tenex.studio/en/blog/ai-slop-ui-8-signes/
- 925 Studios, *AI Slop Web Design Guide*: https://www.925studios.co/blog/ai-slop-web-design-guide
- GrowthGuys, *Genuine website vs AI slop*: https://growthguys.tech/blog/genuine-website-vs-ai-slop.html
- Spike AI, *How to Avoid AI Slop, B2B*: https://getspike.ai/blog/how-to-avoid-ai-slop/
- Olivia Cal, *AI writing tells*: https://www.oliviacal.com/post/ai-writing-tells
- Matthew Vollmer, *Field Guide to AI Tells*: https://matthewvollmer.substack.com/p/i-asked-the-machine-to-tell-on-itself
- prg.sh, *Why Your AI Keeps Building the Same Purple Gradient Website*: https://prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website
