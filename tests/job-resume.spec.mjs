import { registerHooks } from 'node:module';
import { resolve, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
registerHooks({resolve(specifier,context,next){
  if(specifier==='next/server')return next('next/server.js',context);
  const base=specifier.startsWith('@/')?resolve(root,'src',specifier.slice(2)):specifier.startsWith('.')&&context.parentURL?.endsWith('.ts')?resolve(dirname(fileURLToPath(context.parentURL)),specifier):null;
  return next(base&&existsSync(base+'.ts')?pathToFileURL(base+'.ts').href:specifier,context);
}});
process.env.TALENT_INTAKE_WEBHOOK_SECRET='local-unit-test';
process.env.TALENT_R2_ACCESS_KEY_ID='local-unit-test';
process.env.TALENT_R2_SECRET_ACCESS_KEY='local-unit-test';
const {issueTicket}=await import('../src/lib/talent-intake/server.ts');
const {POST}=await import('../src/app/api/jobs/resume/route.ts');
const data={ref:'VS-J-UNIT99',source:'web_en',files:[{key:'intake/2026/10/VS-J-UNIT99/0.png',mime:'image/png',kind:'image',size:5,name:'test.png'}]};
const request=body=>new Request('http://localhost/api/jobs/resume',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
test('renewal preserves the signed reference, ticket, object keys and MIME',async()=>{
  const ticket=issueTicket(data);
  const response=await POST(request({ticket,ref:'VS-J-FORGED',files:[{key:'forged'}]}));
  assert.equal(response.status,200);
  const body=await response.json();
  assert.equal(body.ref,data.ref);assert.equal(body.ticket,ticket);assert.equal(body.uploads[0].key,data.files[0].key);
  assert.equal(body.uploads[0].headers['Content-Type'],'image/png');
  assert.equal(new URL(body.uploads[0].url).searchParams.get('X-Amz-Expires'),'900');
});
test('forged, expired and agent tickets cannot renew human uploads',async()=>{
  assert.equal((await POST(request({ticket:'forged.signature'}))).status,410);
  assert.equal((await POST(request({ticket:issueTicket({...data,channel:'agent'})}))).status,400);
  const now=Date.now;let expired;
  try{Date.now=()=>now()-7200000;expired=issueTicket(data);}finally{Date.now=now;}
  assert.equal((await POST(request({ticket:expired}))).status,410);
  assert.equal((await POST(request({}))).status,400);
});
