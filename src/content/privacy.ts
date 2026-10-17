import { noticeRows } from "@/lib/measurement/notice";

/**
 * §3 at a glance (/privacy#analytics), rendered as a table where the notice
 * has its [[insert:analytics-table]] line. The consent banner links here in
 * place of its old long paragraph; §2 keeps the full detail. The rows come
 * from the purpose registry (src/lib/measurement/purposes.ts, notice.row);
 * each purpose's notice.lead names its §2 paragraph below, and
 * tests/measurement-policy.spec.mjs checks every lead is still here.
 */
export const analyticsSummary = noticeRows();

export const privacyContent = `
# Privacy Policy

*Last updated: 17 October 2026*

## 1. Who this notice covers

This notice explains how Vayasya Seva Private Limited ("we", "us") handles information on the public website at www.vayasyaseva.com (the "Site") and when you contact us through it. Other Vayasya Seva applications and subdomains may have their own notices, which take precedence for those services.

Our contact details are in Section 11. The Site is intended for businesses and for adults, including adults looking for work; it is not intended for children.

## 2. Information we handle

**Enquiries you send us.** The business enquiry form (www.vayasyaseva.com/contact) asks for your requirement (the work, headcount, site, start and duration and, optionally, shifts and other details) and your contact details (name, company and phone number and, optionally, designation and email address). It also records the page you came from, any area that page is about, the technical information needed to deliver and protect the enquiry, and the version of this notice in force. Please do not put sensitive personal information in the free-text field.

**Job applications.** Details you send through the jobs pages are described in Section 10.

**Submissions sent by AI agents.** An AI agent acting for you may send an enquiry or job application through our agent routes (\`/api/agent/\`). We record what it sends and the name it gives, mark it as sent by an agent and confirm the details with you; if it acted without your agreement, contact us (Section 11) and we will delete them.

**Prefilled links.** A link that fills in our contact or jobs form carries the details after a \`#\`, so your browser does not send them to us and our usage events do not record them; with "Allow All", the recordings described below show the filled-in form.

**Site delivery and security.** When your browser requests a page or submits a form, our hosting and security providers may process the request URL, IP address, browser and device information, referring page, time and related logs, to deliver the Site, prevent abuse and fix failures. The contact and jobs forms use Cloudflare Turnstile, which checks browser and device signals to keep automated abuse off them. These records are separate from the analytics choices below.

**Cookie-free site counts.** On every visit, whatever you choose, two tools count how the Site is used without analytics cookies. Vercel Web Analytics reports aggregate page views, referrals, approximate location and device and browser categories, using a visitor hash that changes each day; the Site strips query strings and groups unknown paths as \`/other\`. Umami, an open-source tool on our own servers, receives the page path, any campaign tags (\`utm_\` parameters), the referring site, browser, device, screen size, language and approximate location from your IP address, and groups a visit by an identifier that is not stored in your browser and resets periodically. Umami also records usage events with fixed labels only: which links, buttons, FAQ answers and form fields are used, how far a page is scrolled, how long fields take and whether a form is sent or left, page speed and errors, never what you type. Our servers also count each enquiry and application in Umami, with fixed labels and, for an enquiry, the answers chosen from its lists (area, number of workers, duration and start) and whether it meets our minimum size, never your name, company, phone number, email address or details. Umami data stays on our infrastructure and is not shared. Neither tool follows you across websites.

**Additional site measurement.** With "Allow All", Google Analytics also loads and may set cookies or similar identifiers. It measures pages viewed, traffic sources, approximate location, device and browser details and the same fixed-label events, and Google may receive your IP address and the page URL. It never receives your name, phone number, email address, company, message or files.

**Usage recordings and heatmaps.** With "Allow All", Umami also records replayable sessions and heatmaps of clicks, taps and scrolling. Recordings are not masked: they show the page as you saw it, including the contact and job forms, what you type into them and the names of files you add, but not file contents. We use them only to see how the Site is used and to fix problems; they stay on our infrastructure and are not shared, and we keep them for one year (Section 6). Microsoft Clarity was used for recordings until 3 October 2026 and no longer loads.

**Unfinished forms.** With "Allow All", if you leave the contact or job form without sending it, Umami records what you had typed so far and whether you added files (never the files). We use these records only to fix the forms: we do not contact you from them, add them to our enquiry or applicant records, or share them. They are deleted after 30 days.

**Advertising measurement.** With "Allow All", the Google tag tells Google Ads when a visit that began with a click on one of our ads ends in a job application or business enquiry. Google Ads may use a cookie or similar identifier and receives technical data such as your IP address and page URL, but no form details. Ad personalisation is off, so your visit is not used to target ads at you or for remarketing.

**Job applications from our ads.** When you click one of our Google ads, Google adds a click identifier to the link (\`gclid\`, \`gbraid\` or \`wbraid\`), which your browser keeps for that visit only, in session storage. If you then send a job application, our server tells Google Ads that the click led to an application, with the identifier, the time and our reference, and nothing else about you. This runs unless you choose "Required Only", in which case the identifier is not kept or sent.

**Language choice.** If you pick a language on a page that asks which language you read (such as www.vayasyaseva.com/jobs), the Site sets a cookie named \`vspl_lang\` that holds only that language, for one year, so that page lists it first next time. It is not used for measurement or advertising and does not change the language of any page by itself. To order the choices, the Site also reads your browser's language setting and the approximate region of your connection on each visit; neither is stored. You can delete the cookie in your browser settings.

## 3. Your analytics choices {#analytics}

[[insert:analytics-table]]

Before you choose, only the rows marked "Every visit" and "Unless you choose Required Only" run. Essential hosting and security processing runs in every case. You can reopen these choices at any time with "Privacy choices" in the footer. Your choice is stored in your browser's local storage; an "Allow All" choice expires after 180 days and must be renewed. Changing to "Required Only" reloads the page to stop scripts already running, and affects future collection only; it does not erase data a provider has already received.

This choice covers only the purposes described here, not ad personalisation, retargeting or other materially different uses. If we add such uses, we will ask for a new, separate choice where required. This notice does not remove any rights you have under local law.

## 4. Why we use information

Job applications are used as described in Section 10. We use enquiries to respond, discuss your requirements, prepare proposals and maintain relevant business records. We use the details of a requirement (the number of workers, the site, how long the work lasts, when it starts and the shifts) to judge whether and how we can staff it and to decide the order in which we follow up. A member of our team reviews every enquiry; no enquiry is refused by an automated decision. We use operational request data to deliver and secure the Site, investigate abuse and meet legal obligations. Aggregate counts help us understand which pages are useful. If you allow additional measurement, further reports help us understand traffic sources and whether visitors reach or complete an enquiry.

Where a legal basis is required, we rely on your request and the applicable lawful basis for responding to it, our legitimate interests in operating, improving and protecting the Site where permitted (including the cookie-free site counts and the job application report to Google Ads, which you can turn off with "Required Only"), or your consent for Google Analytics, Umami recordings, unfinished-form records and Google Ads measurement. We do not treat acceptance of this policy as blanket consent to unrelated processing.

## 5. Who receives information

Our authorised team and service providers access information only as needed for the purposes above. Providers include our website host and security services (including Cloudflare Turnstile on the forms), Vercel Web Analytics, Google Analytics and Google Ads when additional measurement is allowed, and the email delivery provider used to send your enquiry to our team and a copy to you. We do not sell enquiry details or share them with other businesses for their own marketing. We may also disclose information when required by law, to professional advisers under appropriate duties, or as part of a legitimate business transfer.

The providers that handle job applications are listed in Section 10. These providers may process data outside India. Their own privacy documentation describes their infrastructure and practices: [Vercel Web Analytics](https://vercel.com/docs/analytics/privacy-policy), [Google Analytics](https://support.google.com/analytics/answer/6004245), [Google Ads](https://policies.google.com/technologies/ads) and, for recordings made until 3 October 2026, [Microsoft Clarity](https://learn.microsoft.com/en-us/clarity/setup-and-installation/privacy-disclosure). A link to another website is governed by that site's own notice.

## 6. How long we keep it

Job applications are kept as described in Section 10. We keep enquiries and the correspondence about them for up to 24 months after our last contact with you, and then delete them. If an enquiry leads to a contract, the records needed for that contract are kept for as long as the contract, any dispute and our legal duties require. Operational logs are retained according to our hosting and security configurations. Vercel says the visitor hash used by Web Analytics is discarded after 24 hours; aggregate reports remain subject to the project's retention settings. Google Analytics data is retained according to the property's configured retention settings. Google Ads conversion data is kept for the periods Google sets for its advertising products. Microsoft Clarity recordings made until 3 October 2026 are kept for the periods Microsoft sets (about 30 days, and up to 13 months for heatmaps and saved recordings). Umami keeps recordings and heatmaps for one year, unless we save a recording to investigate a problem; a nightly job deletes older ones. Unfinished-form records are deleted after 30 days. We review these settings and delete or anonymise information when it is no longer needed, subject to legal requirements.

Your browser keeps an analytics preference until you change it or clear local storage. An affirmative site-measurement choice stops being valid after 180 days, even if the preference entry remains in storage.

## 7. Your rights

Depending on applicable law, you may ask for access, correction or erasure of personal data we hold, withdraw consent, object to processing, or raise a complaint with the relevant authority. Contact us using Section 11. We may need to verify your identity and may have to retain some records where the law requires it. Our aggregate Site reports may not let us identify an individual visitor in order to retrieve or delete a particular page view.

## 8. Security

We use technical and organisational measures intended to protect information, including access controls and measures against abuse of the contact form. No internet service is completely secure. Please do not submit information through the Site that is unnecessary for your enquiry.

## 9. Children and changes

The Site is intended for adults acting in a business or professional context or looking for work, and the jobs pages are for people aged 18 or older. We do not knowingly seek children's personal data. If you believe a child has sent us information, please contact us.

We may update this notice when our services or practices change. The date at the top shows the latest revision. If a change requires a fresh analytics choice, we will request one.

## 10. Job seekers

This section applies when you send us your details through the jobs pages of the Site (www.vayasyaseva.com/jobs, /jobs/apply and the other pages under /jobs, in English, Hindi and Hinglish) or when an AI agent applies for you. The jobs pages are for people aged 18 or older. The English version of this notice governs.

[[insert:jobs-privacy]]

**In short.** We keep your details for up to 12 months after you last reply to us. We call when a site in or near your area needs people. We do not share your details with another company. To have them removed, email help@vayasyaseva.com with your mobile number. The rest of this section is the full notice.

**What we collect.** Your mobile number and anything you choose to send us: photos, PDF or Word documents and a typed message, together with their file names and types. On the short application form (www.vayasyaseva.com/jobs/apply, and the same form on each market's jobs page) we also collect your name and your answers about the work you want, your experience, education, ITI trade or skills, the shifts you can do, when you can start and the area you live in. We also record:

- the jobs page you used, its address and its language;
- the area of that page, if it is about a particular area;
- the area or city we file your application under (from the area you chose, or else the page);
- that you confirmed you are 18 or older and agreed to us keeping your details and contacting you about work under this notice, with the version of this notice and the date and time.

**If an AI agent applies for you.** An AI agent or assistant can send your application through our agent route instead of the jobs page. It sends the same kind of details, plus the language you chose and, if it gives one, its own name. The agent confirms on your behalf that you are 18 or older and agreed to us keeping your details and contacting you about work under this notice; we record that it did so, and that the application came from an agent. Our team confirms your details and your agreement when we first contact you. The rest of this section applies in the same way.

**What not to send.** We do not ask for identity or bank documents at this stage; please do not send Aadhaar, PAN or bank details. Identity numbers that appear in typed text are masked in our records, but files are stored as you send them.

**Why we use it.** To consider you for work with Vayasya Seva, to contact you about suitable work, and to keep a record of your application. If no suitable work is open when you apply, we keep your details on our list of people looking for work and contact you when a site in or near your area needs people. We may contact you from time to time to check that you are still looking for work and that your details are correct. We rely on the consent you give when you submit your details. Sending details is voluntary, and it does not mean that work will be offered.

**No automated decisions.** No decision about you is made automatically; a member of our team reviews each submission. We no longer accept voice notes or other audio files. Voice notes sent before 16 October 2026 were converted to text by Sarvam AI so that our team could read them.

**Who handles it.** Our authorised team, and service providers acting on our instructions: Vercel (website hosting), Cloudflare (file storage, and Turnstile, which checks browser and device signals to keep automated abuse off the form), Fast2SMS (the SMS that confirms we received your application and gives your reference) and the systems we operate to store submissions and manage conversations with applicants. If you came from one of our Google ads, Google Ads is told only that the ad click led to an application (see "Job applications from our ads" in Section 2). Some providers may process data outside India.

**Who else may receive it.** We do not share your details with another company. If that ever changes for a job you want, we will ask you first, and you can say no and stay on our list. We do not sell your details or share them for anyone's marketing.

**How long we keep it.** Files uploaded through the jobs pages are deleted from our upload storage 90 days after they are received. Your submission, including copies of your files in our applicant and conversation records, is kept for up to 12 months after our last contact with you and then deleted, unless you ask us to delete it sooner. Each time you speak with us, reply to us or confirm that you are still looking for work, the 12 months start again. A call or message from us that you do not answer does not count. If you are placed in work, the records needed for your engagement are kept for as long as employment and statutory obligations require.

**Your choices.** You may withdraw your consent, or ask us to correct or delete your details, at any time. Email help@vayasyaseva.com from any address with the mobile number you applied with and your reference, if you have it (it begins with VS-J- and is in the SMS we sent you). You can also tell the member of our team who calls you. When you withdraw or ask us to delete your details, we remove them from our applicant list, our conversation records and our file storage, except records we must keep by law. We may call or send an SMS to the mobile number you applied with to confirm the request is yours before we act on it. Withdrawal does not affect processing that took place before it.

## 11. Contact

For privacy questions, requests or grievances, contact:

**Vayasya Seva Private Limited**

- Registered office: P-2-230, Deep Ganga Apartments, Sector-5A, SIDCUL, Roshnabad, Haridwar, Uttarakhand 249403, India
- Email: help@vayasyaseva.com
- CIN: \`U01619UT2023PTC015814\`
- GSTIN: \`05AAJCV4562E1ZB\`
- MSME: \`UDYAM-UK-06-0029670\`
`;
