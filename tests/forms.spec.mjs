import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const origin=process.env.FORM_TEST_ORIGIN ?? 'http://localhost:3000';
const browser=await chromium.launch({...process.env.PLAYWRIGHT_CHROME ? {executablePath:process.env.PLAYWRIGHT_CHROME} : {}});
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
const errors=[];
let starts=0, startedBodies=[], submits=[], failSubmit=false, failUpload=false, resumes=0;
await context.addInitScript(() => {
  const widgets=new Map();
  window.widgetStats={rendered:0,removed:0,resets:0};
  window.turnstile={
    render:(box,options)=>{const id='widget-'+(++window.widgetStats.rendered);widgets.set(id,options);queueMicrotask(()=>options.callback(id));return id;},
    reset:id=>{if(!widgets.has(id))throw new Error('Resetting a removed widget');window.widgetStats.resets++;queueMicrotask(()=>widgets.get(id)?.callback(id+'-reset'));},
    remove:id=>{widgets.delete(id);window.widgetStats.removed++;},
  };
});
await context.route('**/api/**',r=>r.abort());
await context.route('**/challenges.cloudflare.com/**',r=>r.fulfill({body:'',contentType:'application/javascript'}));
await context.route('**/_t/**',r=>r.abort());
await context.route('**/_vercel/insights/**',r=>r.abort());
await context.route('**/api/jobs/start',r=>{
  starts++;
  const body=r.request().postDataJSON();
  startedBodies.push(body);
  const ref='VS-J-'+String(starts).padStart(6,'0');
  r.fulfill({json:{ref,ticket:'ticket-'+starts,uploads:body.files.map((f,i)=>({key:String(i),url:'https://upload.example.test/'+i,headers:{'Content-Type':f.mime}}))}});
});
await context.route('**/api/jobs/resume',r=>{resumes++;r.fulfill({json:{ref:'VS-J-'+String(starts).padStart(6,'0'),ticket:'ticket-'+starts,uploads:[{key:'0',url:'https://upload.example.test/0',headers:{'Content-Type':'image/png'}}]}});});
await context.route('https://upload.example.test/**',r=>r.fulfill({status:failUpload?503:200,body:''}));
await context.route('**/api/jobs/submit',r=>{submits.push(r.request().postDataJSON()); if(failSubmit){failSubmit=false;return r.abort();}return r.fulfill({status:202,json:{ref:'VS-J-'+String(starts).padStart(6,'0')}});});
const contactBodies=[];
await context.route('**/api/contact',r=>{contactBodies.push(r.request().postDataJSON());r.fulfill({json:{success:true,caseId:'REQ-20261016-1A2B3C4D'}});});
const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
const complete='?work=any&experience=fresher&education=12th&shift=day&start=now&area=laksar';
async function open(path){await page.goto(origin+path);await page.waitForTimeout(150);}
async function tick(){await page.waitForTimeout(100);}
async function send(){await page.locator('[data-analytics-form=quick] button[type=submit]').click();}
async function fill(){await page.locator('#quick-name').fill('Form Test');await page.locator('#quick-phone').fill('9999900001');await page.locator('[name=agree]').check();}
async function visible(selector){await page.waitForFunction(s=>{const el=document.querySelector(s);return el&&document.activeElement===el&&el.getBoundingClientRect().top>=64&&el.getBoundingClientRect().top<200;},selector,{timeout:8000});}
try {
  // Search landing pages keep their URLs, self-canonicals and useful content.
  for(const [path, title, text] of [
    ['/en-in/jobs', 'SIDCUL Haridwar', 'Apply now'],
    ['/en-in/jobs/packing', 'Packing Jobs', 'Packing products into cartons'],
    ['/hi-in/jobs/electrician', 'इलेक्ट्रीशियन', 'वायरमैन'],
    ['/hi-latn-in/jobs/freshers', 'Freshers', 'fresher'],
    ['/en-in/jobs/10th-pass', '10th Pass', 'welder, fitter, electrician'],
    ['/en-in/jobs/12th-pass', '12th Pass', 'computer'],
  ]) {
    const response=await context.request.get(origin+path,{maxRedirects:0});
    assert.equal(response.status(),200,path);
    const html=await response.text();
    assert.ok(html.includes(title),path+' unique title');
    assert.ok(html.includes(text),path+' useful content');
    assert.ok(html.includes('rel="canonical" href="https://www.vayasyaseva.com'+path+'"'),path+' self canonical');
    assert.equal(/name="robots" content="[^"]*noindex/.test(html),false);
  }
  const neutral=await context.request.get(origin+'/jobs/packing?utm_source=check',{maxRedirects:0});
  assert.equal(neutral.status(),200);assert.ok((await neutral.text()).includes('Choose your language'));
  await open('/en-in/jobs');
  assert.equal(await page.locator('main a[href="/en-in/jobs/packing"]').count(),1);
  assert.equal(await page.locator('main a[href="/en-in/jobs/freshers"]').count(),1);
  assert.equal(await page.locator('main a[href="/en-in/jobs/haridwar"]').count(),1);
  for (const id of ['helper','machine','iti','office']) assert.equal(await page.locator('main section#'+id).count(),1,'/jobs #'+id);
  await page.locator('.jobs-submit').click();await page.waitForURL('**/en-in/jobs/haridwar');assert.equal(new URL(page.url()).pathname,'/en-in/jobs/haridwar');
  console.log('Job landing pages preserve self-canonicals, unique content, role links and guided application access');
  await open('/en-in/jobs/apply'+complete);
  await page.locator('#quick-name').waitFor();
  await send();await visible('#quick-name');
  assert.ok(await page.locator('#quick-name-error').isVisible());
  await page.locator('#quick-name').fill('Form Test');
  assert.equal(await page.locator('#quick-name-error').count(),0);
  assert.equal(await page.evaluate(()=>document.activeElement.id),'quick-name');
  await page.locator('#quick-phone').fill('9999900001');
  assert.equal(await page.locator('#quick-phone-error').count(),0);
  await page.locator('[name=agree]').check();assert.equal(await page.locator('#quick-agree-error').count(),0);
  await tick();
  const saved=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('vayasya-quick-apply')));
  assert.equal(saved.name,'Form Test');assert.equal(saved.phone,'9999900001');assert.equal('consent' in saved,false);assert.equal('agreed' in saved,false);
  await page.reload();await page.locator('[data-draft-notice]').waitFor();
  assert.equal(await page.locator('#quick-name').inputValue(),'Form Test');assert.equal(await page.locator('#quick-phone').inputValue(),'9999900001');assert.equal(await page.locator('[name=agree]').isChecked(),false);
  await page.locator('[data-draft-notice]').getByRole('button',{name:'Resume',exact:true}).click();await visible('#quick-q-details');
  await page.locator('[data-draft-notice]').getByRole('button',{name:'Clear draft',exact:true}).click();await visible('#quick-q-work');await tick();
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('vayasya-quick-apply')),null);
  console.log('Inline errors clear without stealing focus; drafts restore all text and require fresh consent');
  // A response is lost after the application was accepted: the retry must
  // use the exact frozen payload, even after reloading the browser tab.
  await open('/en-in/jobs/apply'+complete);await fill();failSubmit=true;
  const before=starts;await send();await page.locator('[data-retry-notice]').waitFor();
  assert.equal(starts,before+1);assert.equal(await page.locator('#quick-phone').isDisabled(),true);
  const original=submits.at(-1);await page.reload();await page.locator('[data-retry-notice]').waitFor();
  await send();await visible('.jobs-done h2');assert.equal(starts,before+1);assert.deepEqual(submits.at(-1),original);
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('vayasya-quick-submission')),null);
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('vayasya-quick-apply')),null);
  console.log('Lost-response retry survives reload and confirms the same reference and payload');
  const rendered=await page.evaluate(()=>window.widgetStats.rendered);
  await page.locator('.jobs-done button').click();await visible('#quick-q-work');await tick();
  assert.ok(await page.evaluate(n=>window.widgetStats.rendered>n,rendered));
  await open('/en-in/jobs/apply'+complete);await fill();await send();await visible('.jobs-done h2');assert.equal(starts,before+2);
  console.log('Send another recreates verification and starts a fresh application');
  // An upload failure keeps its ticket and refreshes expired PUT URLs.
  await open('/en-in/jobs/apply'+complete);await fill();await page.locator('input[type=file]').setInputFiles({name:'test.png',mimeType:'image/png',buffer:Buffer.from('UI upload test')});
  failUpload=true;const uploadBefore=starts;await send();await page.locator('[data-retry-notice]').waitFor({timeout:15000});
  failUpload=false;await send();await visible('.jobs-done h2');assert.equal(starts,uploadBefore+1);assert.equal(resumes,1);
  console.log('Upload retries renew URLs while preserving the original application reference');
  // The checkbox line opens /jobs/privacy in a new tab; Back to Apply there closes the tab, leaving the form as it was.
  await page.evaluate(()=>sessionStorage.clear());await open('/en-in/jobs/apply'+complete);
  const details=page.locator('#quick-keep a');
  assert.equal(await details.getAttribute('href'),'/en-in/jobs/privacy');assert.equal(await details.getAttribute('target'),'_blank');
  await page.locator('#quick-name').fill('Draft Test');await page.locator('#quick-phone').fill('9999900001');await tick();
  const [notice]=await Promise.all([page.context().waitForEvent('page'),details.click()]);
  await notice.locator('main a.jobs-submit').waitFor();
  await Promise.all([notice.waitForEvent('close',{timeout:5000}),notice.locator('main a.jobs-submit').click()]);
  assert.equal(await page.locator('#quick-name').inputValue(),'Draft Test');assert.equal(await page.locator('#quick-phone').inputValue(),'9999900001');
  // In the same tab, Back to Apply returns to a restored draft.
  await page.goto(origin+'/en-in/jobs/privacy');await page.locator('h1').waitFor();
  assert.equal(await page.locator('main a[href="/en-in/privacy#job-seekers"]').count(),1);
  await page.locator('main a.jobs-submit').click();await page.waitForURL('**/en-in/jobs/haridwar**');await page.locator('[data-draft-notice]').waitFor();
  assert.equal(await page.locator('#quick-name').inputValue(),'Draft Test');assert.equal(await page.locator('#quick-phone').inputValue(),'9999900001');
  assert.equal(await page.locator('[name=agree]').isChecked(),false);
  // One no-fee line in the page (the form's footer), and the done screen says only what we do if the work fits.
  assert.equal(await page.locator('main .quick-note a[href="/en-in/jobs/fees-and-fraud"]').count(),1);
  await fill();await send();await visible('.jobs-done h2');
  assert.match(await page.locator('.jobs-done').textContent(),/If the work fits, we call you\./);
  assert.doesNotMatch(await page.locator('.jobs-done').textContent(),/no fee/i);
  assert.equal(await page.locator('.jobs-done a[href="/en-in/jobs/fees-and-fraud"]').count(),1);
  console.log('The applicant notice opens beside the form, and the draft survives a round trip through it');
  // A role link should override a conflicting saved work preference.
  await open('/en-in/jobs/apply'+complete);await tick();await open('/hi-in/jobs/electrician');
  assert.equal(await page.locator('[data-step=work] .is-selected').textContent(),'ITI ट्रेड');
  assert.ok(await page.locator('[data-step=trade] .is-selected').count());
  for(const locale of ['hi-in','hi-latn-in']) {
    await page.evaluate(()=>sessionStorage.clear());await open('/'+locale+'/jobs/apply'+complete);await page.locator('#quick-name').fill('Draft Test');await page.locator('#quick-phone').fill('9999900001');await tick();await page.reload();await page.locator('[data-draft-notice]').waitFor();assert.equal(await page.locator('#quick-name').inputValue(),'Draft Test');
  }
  // Route props prefill category answers and preserve intake tagging.
  for (const [slug, step, label] of [['freshers','experience','fresher'],['10th-pass','education','10th'],['12th-pass','education','12th']]) {
    await page.evaluate(()=>sessionStorage.clear());await open('/en-in/jobs/'+slug+complete.replace(slug==='freshers'?'&experience=fresher':'&education=12th',''));
    assert.ok((await page.locator('[data-step='+step+'] .is-selected').textContent()).includes(label));
    await fill();await send();await visible('.jobs-done h2');assert.equal(startedBodies.at(-1).hub,slug);
  }
  await page.evaluate(()=>sessionStorage.clear());
  await open('/en-in/jobs/packing'+complete.replace('work=any',''));
  assert.ok((await page.locator('[data-step=work] .is-selected').textContent()).includes('Packing'));
  await fill();await send();await visible('.jobs-done h2');assert.equal(startedBodies.at(-1).role,'packing');
  await page.locator('.jobs-done button').click();await tick();
  assert.ok((await page.locator('[data-step=work] .is-selected').textContent()).includes('Packing'));
  assert.equal(await page.locator('#quick-name').count(),0);
  await open('/en-in/jobs/warehouse');
  assert.ok((await page.locator('[data-step=work] .is-selected').textContent()).includes('Warehouse'));
  console.log('Category and role pages prefill and tag the shared intake; send another retains the page role');
  // The cluster jobs hub sends "web", its locale, its cluster and its page path.
  for (const [locale, tag] of [['en-in','en-IN'],['hi-latn-in','hi-Latn-IN']]) {
    await page.evaluate(()=>sessionStorage.clear());await open('/'+locale+'/jobs/haridwar'+complete);
    await fill();await send();await visible('.jobs-done h2');
    const body=startedBodies.at(-1);
    assert.equal(body.source,'web');assert.equal(body.locale,tag);assert.equal(body.pageCluster,'haridwar');assert.equal(body.pagePath,'/jobs/haridwar');
  }
  await page.evaluate(()=>sessionStorage.clear());await open('/en-in/jobs/apply'+complete+'&cluster=haridwar');
  await fill();await send();await visible('.jobs-done h2');
  assert.equal(startedBodies.at(-1).pageCluster,'haridwar');assert.equal(startedBodies.at(-1).pagePath,'/jobs/apply');
  await page.evaluate(()=>sessionStorage.clear());await open('/en-in/jobs/apply'+complete+'&cluster=mumbai');
  await fill();await send();await visible('.jobs-done h2');assert.equal(startedBodies.at(-1).pageCluster,null);
  console.log('The Haridwar jobs hub and ?cluster= tag applications with source, locale, cluster and page');
  // Jalandhar–Kapurthala: its own area answers; Punjabi pages default to the region, even on /jobs/apply.
  const punjab=complete.replace('area=laksar','area=jalandhar:kapurthala');
  for (const [path, tag, label] of [['/en-in/jobs/jalandhar','en-IN','Kapurthala'],['/pa-in/jobs/jalandhar','pa-IN','ਕਪੂਰਥਲਾ'],['/pa-in/jobs/apply','pa-IN','ਕਪੂਰਥਲਾ']]) {
    await page.evaluate(()=>sessionStorage.clear());await open(path+punjab);
    assert.ok((await page.locator('[data-step=area] .is-selected').textContent()).includes(label), path);
    assert.equal(await page.locator('[data-step=area]').getByText('SIDCUL', {exact:false}).count(),0, path);
    await fill();await send();await visible('.jobs-done h2');
    const body=startedBodies.at(-1);
    assert.equal(body.source,'web');assert.equal(body.locale,tag);assert.equal(body.pageCluster,'jalandhar');
  }
  console.log('Jalandhar–Kapurthala and Punjabi: region areas, pa-IN locale and the jalandhar cluster on every application');
  console.log('Role prefills override conflicting saved choices; multilingual drafts restore');
  await page.evaluate(()=>sessionStorage.clear());
  // Request a crew: step 1 the requirement, step 2 who to talk to.
  const pill=(group,label)=>page.locator(`[aria-labelledby=${group}-q] button`,{hasText:label});
  async function requirement(){
    await pill('roles','Packing').click();await pill('headcountBand','50 to 99').click();
    await page.locator('#siteState').selectOption('UK');await page.locator('#siteCity').fill('SIDCUL Haridwar');
    await pill('startWindow','In 2 to 4 weeks').click();await pill('durationBand','Ongoing').click();
  }
  for(const query of ['', '?type=assessment']) {
    await open('/en-in/contact'+query);
    assert.equal(await page.locator('main h1').textContent(),query?'Request a site assessment.':'Request a crew.');
    await page.locator('button[type=submit]').click();await visible('#roles');
    assert.ok(await page.locator('#roles-error').isVisible());assert.ok(await page.locator('#siteCity-error').isVisible());
    await pill('roles','Packing').click();assert.equal(await page.locator('#roles-error').count(),0);
    assert.equal(await pill('roles','Packing').getAttribute('aria-pressed'),'true');
    await pill('roles','Packing').click();
    await requirement();await tick();
    await page.reload();await page.locator('[data-draft-notice]').waitFor();
    assert.equal(await page.locator('#siteCity').inputValue(),'SIDCUL Haridwar');assert.equal(await pill('roles','Packing').getAttribute('aria-pressed'),'true');
    await page.locator('[data-draft-notice]').getByRole('button',{name:'Clear draft',exact:true}).click();await tick();
    assert.equal(await page.locator('#siteCity').inputValue(),'');
    assert.equal(await page.evaluate(key=>sessionStorage.getItem(key),query?'vayasya-assessment-draft':'vayasya-contact-draft'),null);
    await requirement();await page.locator('button[type=submit]').click();await page.locator('#name').waitFor();
    assert.ok((await page.locator('.crew-recap').textContent()).includes('Work: Packing'));
    await page.locator('button[type=submit]').click();await visible('#name');
    assert.ok(await page.locator('#company-error').isVisible());
    await page.locator('#name').fill('Contact Test');await page.locator('#company').fill('Test Company');await page.locator('#phone').fill('9999900001');
    // The phone keyboard's Send key on the last field submits (Turnstile's hidden input is not a "next" field).
    await page.locator('#email').fill('buyer@example.test');await page.locator('#email').press('Enter');await visible('[role=status] h2');
    assert.ok((await page.locator('[role=status]').textContent()).includes('REQ-20261016-1A2B3C4D'));
    const body=contactBodies.at(-1);
    assert.deepEqual(body.roles,['packing']);assert.equal(body.headcountBand,'50-99');assert.equal(body.siteState,'UK');assert.equal(body.siteCity,'SIDCUL Haridwar');
    assert.equal(body.startWindow,'2-4-weeks');assert.equal(body.durationBand,'ongoing');assert.equal(body.company,'Test Company');
    assert.equal(body.requestType,query?'site-assessment':undefined);assert.equal(body.details,undefined);
    for(const key of ['qualified','priority','outOfScope']) assert.equal(key in body,false);
    assert.doesNotMatch(await page.locator('main').textContent(),/qualified|out of scope/i);
  }
  // Compliance help: its own step 1 (needs, state, workers, where stuck), its own draft, sent as details.
  await page.evaluate(()=>sessionStorage.clear());
  await open('/en-in/contact?type=compliance');
  assert.equal(await page.locator('main h1').textContent(),'Get compliance help.');
  assert.equal(await page.locator('#roles').count(),0);assert.equal(await page.locator('#siteCity').count(),0);
  await page.locator('button[type=submit]').click();await visible('#needs');
  for(const id of ['needs','siteState','details']) assert.ok(await page.locator(`#${id}-error`).isVisible(),id);
  assert.equal(await page.locator('#headcountBand-error').count(),0);
  await pill('needs','EPF').click();await pill('needs','ESIC').click();assert.equal(await page.locator('#needs-error').count(),0);
  await page.locator('#siteState').selectOption('UP');await pill('headcountBand','20 to 49').click();
  await page.locator('#details').fill('Notice from ESIC, six months missed.');await tick();
  assert.notEqual(await page.evaluate(()=>sessionStorage.getItem('vayasya-compliance-draft')),null);
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('vayasya-contact-draft')),null);
  await page.locator('button[type=submit]').click();await page.locator('#name').waitFor();
  const recap=await page.locator('.crew-recap').textContent();
  assert.ok(recap.includes('Request: Compliance help'));assert.ok(recap.includes('Help with: EPF, ESIC'));
  await page.locator('#name').fill('Compliance Test');await page.locator('#company').fill('Compliance Company');await page.locator('#phone').fill('9999900002');
  await page.locator('button[type=submit]').click();await visible('[role=status] h2');
  {
    const body=contactBodies.at(-1);
    assert.equal(body.requestType,'compliance-help');assert.equal(body.siteState,'UP');assert.equal(body.headcountBand,'20-49');
    assert.match(body.details,/^Help with: EPF, ESIC\n/);assert.ok(body.details.endsWith('six months missed.'));
    assert.equal(body.company,'Compliance Company');
    for(const key of ['roles','siteCity','startWindow','durationBand','shiftPattern']) assert.equal(key in body,false,key);
  }
  console.log('Get compliance help: own questions and draft, sent as compliance-help with a Help with: line');
  // Prefilled links: #location= from /haridwar-sidcul (in-app navigation) and from AI assistants.
  await page.evaluate(()=>sessionStorage.clear());
  await open('/en-in/contact#location=haridwar&roles=packing,warehouse&headcount=60&start=within-1-week&name=Prefill%20Test');
  await page.waitForFunction(()=>document.querySelector('#siteCity')?.value==='Haridwar');assert.equal(await page.locator('#siteState').inputValue(),'UK');
  assert.equal(await pill('roles','Warehouse').getAttribute('aria-pressed'),'true');assert.equal(await pill('headcountBand','50 to 99').getAttribute('aria-pressed'),'true');
  assert.equal(new URL(page.url()).hash,'');
  await page.evaluate(()=>sessionStorage.clear());
  await open('/en-in/haridwar-sidcul');
  await page.locator('main a[href="/en-in/contact#location=haridwar"]').first().click();await page.waitForURL('**/en-in/contact');
  await page.locator('#siteCity').waitFor();await page.waitForFunction(()=>document.querySelector('#siteCity')?.value==='Haridwar');
  await pill('roles','Packing').click();await pill('headcountBand','20 to 49').click();await pill('startWindow','Just planning').click();await pill('durationBand','3 to 12').click();
  await page.locator('button[type=submit]').click();await page.locator('#name').waitFor();
  await page.locator('#name').fill('Hub Test');await page.locator('#company').fill('Hub Company');await page.locator('#phone').fill('9999900001');
  await page.locator('button[type=submit]').click();await visible('[role=status] h2');
  assert.equal(contactBodies.at(-1).pageCluster,'haridwar');assert.equal(contactBodies.at(-1).siteState,'UK');
  // Job seekers who land here get one quiet line to Jobs in Haridwar (neutral: the language picker, then the form).
  await open('/en-in/contact');assert.equal(await page.locator('main a[href="/jobs/haridwar"]').count(),1);
  console.log('Request a crew: two steps, drafts stay separate, prefills from links and the Haridwar hub, no lead flags on the page');
  // Image metadata varies with public page/role data, never personal prefills.
  const image=await page.goto(origin+'/en-in/jobs/apply?role=packing&name=PrivateName&phone=9999900001');await page.locator('meta[property="og:image"]').waitFor({state:'attached'});
  const packing=await page.locator('meta[property="og:image"]').getAttribute('content');
  assert.match(packing,/jobs-apply-role-packing-/);assert.doesNotMatch(packing,/PrivateName|9999900001/);
  assert.equal(image.status(),200);
  await open('/en-in/services/loading-unloading-labour');assert.match(await page.locator('meta[property="og:image"]').getAttribute('content'),/services-loading-unloading-labour-/);
  console.log('Page and role share images are distinct and exclude personal prefills');
  assert.deepEqual(errors,[]);
  console.log('All form checks passed with mocked APIs; no enquiries or SMS sent.');
} catch (error) {
  console.log(await page.evaluate(()=>({url:location.href,active:document.activeElement?.id,questions:[...document.querySelectorAll('.quick-question')].map(el=>({id:el.id,y:el.getBoundingClientRect().top})),alerts:[...document.querySelectorAll('[role=alert]')].map(el=>el.textContent)})));
  await page.screenshot({path:'.playwright-mcp/form-test-failure.png'});
  throw error;
} finally {await browser.close();}
