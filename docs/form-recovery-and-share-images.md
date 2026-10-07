# Form recovery and share images

## Applications

The shared human job form is the guided `QuickApply`, in all three languages.
`/jobs/apply` is the focused application destination for ads and direct links.
`/jobs` remains an indexable overview with links to role and candidate-category
pages. `/jobs/<role>` and `/jobs/freshers`, `/jobs/10th-pass`, `/jobs/12th-pass`
retain their original URLs, unique metadata, self-canonicals, work content and
FAQs. They embed the same guided form near the top, prefilled from typed page
props. The jobs overview, sitemap and llms.txt link to these landing pages.
The old long form is retired; no blanket job redirects consolidate their SEO.

`useJobSubmission` retains the first signed ticket, reference and request body.
An interrupted final request is stored in this tab before it is sent, so a
reload and Retry confirm the same application. While it is pending, inputs
are frozen. Uploaded files are not sent again. If the upload stage fails,
`POST /api/jobs/resume` renews its PUT URLs from the original signed ticket;
the endpoint rejects expired, forged and agent tickets. Tickets expire after
one hour. A final request with an expired ticket tells the person to check
their SMS or contact the team with the reference before applying again.
No uncertain request silently allocates a new reference.

`useTurnstile` owns each widget with its DOM container. Removed forms remove
their widget; “send another” renders and verifies a fresh one. Initial request
failures reset a potentially consumed token, including network failures.

Job answers, name and phone, and contact/assessment text inputs, are saved in
sessionStorage in their tab. Restored forms offer Resume and Clear draft.
Contact and assessment drafts have separate keys. Successful sends clear
their drafts. Drafts do not restore consent or binary attachments; missing
files get a reminder. A pending final request restores its already-confirmed
request body for retry, rather than creating a new application from the draft.

Job validation messages appear beside the field and disappear once it is
valid. Correcting a field does not move focus. Server/verification messages
remain in the form summary. Contact uses React Hook Form's on-change
revalidation with associated field descriptions.

## Share images

`src/lib/share-content.ts` defines public page copy and known role/hub variants.
The image builder uses the brand's Anek Latin, Anek Devanagari, Hind and
JetBrains Mono fonts, plus its logo mark. Chromium handles text shaping and
renders 1200 × 630 PNGs, including Hindi. Assets are committed in `public/share`;
no browser or image rendering service is needed on the production server.

The generated `src/content/share-images.json` maps each page/variant to an
image URL containing a content hash. `pageMetadata` selects that image for
Open Graph and Twitter. Job role/hub links and the contact assessment link
select their specific variants. Names, phones and arbitrary query text are
never used in the image. `/opengraph-image` serves the new home image for
previously shared URLs; it is a regular route, so it does not override images
on other pages.

```bash
# Regenerate static font subsets after changing the source brand fonts.
uv run --with fonttools python scripts/build-og-fonts.py

# Uses Playwright's installed Chromium, or set SHARE_IMAGE_CHROME to a local
# Chrome executable. Image filenames change when copy, styling or fonts change.
pnpm share:build
pnpm share:check

# Offline endpoint tests use dummy signing credentials, never provider APIs.
pnpm forms:unit

# Run against a local preview. All submission APIs are mocked; no SMS/email.
# Set PLAYWRIGHT_CHROME to use a local Chrome executable if needed.
pnpm forms:check
```

CI checks the generated image catalogue and its PNG dimensions. Browser
checks cover lost-response retry after reload, upload renewal, “send another”,
draft restoration/clearing, live validation, landing-page canonicals, prefills and share metadata.
