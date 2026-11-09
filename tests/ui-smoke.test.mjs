// Smoke test for the Command Center UI logic with a minimal fake DOM (no browser needed).
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = String.raw`// Minimal fake DOM: checks app.js runs, renders the Flows tab and the new-flow form without exceptions.
import fs from 'node:fs';
class El { constructor(t){this.tagName=t;this.children=[];this.attrs={};this.listeners={};this.nodeType=1;this.className='';this.textContent='';this.value='';this.style={};this.classList={add(){},remove(){}};}
  setAttribute(k,v){this.attrs[k]=v;} append(...k){for(const x of k)this.children.push(x);} replaceChildren(...k){this.children=k;} addEventListener(e,f){(this.listeners[e]??=[]).push(f);}
  querySelectorAll(){return [];} set innerHTML(v){this._h=v;} }
const byId={};
global.document={createElement:(t)=>new El(t),createTextNode:(t)=>({nodeType:3,text:String(t)}),getElementById:(id)=>byId[id]??=new El('x')};
global.window=global; global.location={hash:'#/app/Demo'}; global.matchMedia=()=>({matches:false});
global.addEventListener=()=>{}; global.confirm=()=>true; global.clearTimeout=()=>{}; global.setTimeout=()=>0;
const idx={apps:[{name:'Demo',path:'Apps/Demo/_App.md',score:12,stack:'',url:'https://x.example',updated:'',counts:{missing:1,partial:1,exists:0,built:0},total:2,coverage:0.25,
 flows:[{path:'Apps/Demo/Flows/Zugang/Login.md',title:'Login',area:'Zugang',status:'missing',prio:'MVP',screens:['/login'],endpoints:[],evidence:''},{path:'Apps/Demo/Flows/Kern/A.md',title:'A',area:'Kern',status:'partial',prio:'V1',screens:[],endpoints:[],evidence:'t'}],
 findings:[{path:'f.md',title:'F',severity:'Blocker',state:'open',where:'x'}],decisions:[{path:'d.md',title:'D',state:'open',question:'q',answer:''}]}],notes:[]};
global.fetch=async()=>({ok:true,json:async()=>idx});
const src=fs.readFileSync(process.argv[2],'utf8');
await (0,eval)(src);
await new Promise(r=>setImmediate(r));
// switch to flows tab by clicking its button
const view=byId.view; const find=(n,f,acc=[])=>{ if(!n||!n.children) return acc; if(f(n)) acc.push(n); n.children.forEach(c=>find(c,f,acc)); return acc;};
const tabs=find(view,n=>n.tagName==='button'&&n.listeners.click);
const flowsBtn=tabs.find(b=>b.children.some(c=>c.text&&c.text.startsWith('Flows')));
if(!flowsBtn) throw new Error('Flows tab missing');
flowsBtn.listeners.click[0]();
const rows=find(byId.view,n=>n.tagName==='tr');
const newBtn=find(byId.view,n=>n.tagName==='button'&&n.children.some(c=>c.text==='+ Neuer Flow'));
if(!newBtn.length) throw new Error('new flow button missing');
newBtn[0].listeners.click[0]();
const form=find(byId.view,n=>n.tagName==='form');
console.log('ok: tabs',tabs.length,'rows',rows.length,'newflow form',form.length);`;
test('UI renders the app view, Flows tab and new-flow form', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ui-'));
  const f = join(dir, 'smoke.mjs');
  writeFileSync(f, SCRIPT);
  const r = spawnSync('node', [f, join(ROOT, 'skills/unslop-brain/templates/command-center/public/app.js')], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(r.stderr || r.stdout);
});
