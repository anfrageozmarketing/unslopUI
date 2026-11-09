// Runs the Command Center UI against a minimal fake DOM (used by ui-smoke.test.mjs).
// Minimal fake DOM: checks app.js runs, renders the Flows tab and the new-flow form without exceptions.
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
const note={meta:{type:'flow',app:'Demo',area:'Zugang',title:'Login',status:'missing',prio:'MVP',screens:['/login'],endpoints:['POST /api/auth/login'],evidence:''},body:'# Login\n\n```mermaid\nflowchart TD\n A-->B\n```\n\n## Soll\n\n- a\n\n## Lücken\n\n- b\n'};
global.fetch=async(u)=>({ok:true,json:async()=>String(u).includes('/api/note')?note:idx});
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
for (const label of ['Befunde','Entscheidungen']) {
  const tb=find(byId.view,n=>n.tagName==='button'&&n.listeners.click&&n.children.some(c=>c.text&&c.text.startsWith(label)));
  if(!tb.length) throw new Error(label+' tab missing');
  tb[0].listeners.click[0]();
  const nb=find(byId.view,n=>n.tagName==='button'&&n.children.some(c=>c.text&&/^\+ Neu/.test(c.text)));
  if(!nb.length) throw new Error('new button missing in '+label);
  nb[0].listeners.click[0]();
  if(!find(byId.view,n=>n.tagName==='form').length) throw new Error('create form missing in '+label);
}
location.hash='#/note/'+encodeURIComponent('Apps/Demo/Flows/Zugang/Login.md');
await route();
const cls=(n,c)=>find(byId.view,x=>(x.className||'').split(' ').includes(c));
if(!cls(0,'fp-head').length) throw new Error('flow page header missing');
if(!cls(0,'miniroute').length) throw new Error('mini route missing');
if(!cls(0,'fstage').length) throw new Error('flow canvas missing');
if(cls(0,'fnode').length!==2) throw new Error('expected 2 canvas nodes, got '+cls(0,'fnode').length);
const svgHolder=cls(0,'fsvg')[0]; if(!svgHolder||!String(svgHolder._h).includes('<path')) throw new Error('canvas edges missing');
if(cls(0,'cols').length!==1 || cls(0,'col').length!==2) throw new Error('Soll/Lücken columns missing');
if(!cls(0,'node').some(n=>(n.className||'').includes('cur'))) throw new Error('current node not marked');
// parser and layout
const sample=`flowchart TD
  A[Seite öffnen] --> B{Session gültig?}
  B -- ja --> W[Workspace]
  B -- nein --> L[Login]
  L --> C{Daten korrekt?}
  C -- ja --> W
  C -- nein --> E[Fehler + Zähler]
  E -- 5 Fehlversuche --> K[Sperre 15 Min]`;
const g=parseFlow(sample);
if(g.nodes.length!==7||g.edges.length!==7) throw new Error('parse: '+g.nodes.length+' nodes '+g.edges.length+' edges');
if(!g.edges.some(e=>e.from==='B'&&e.to==='W'&&e.label==='ja')) throw new Error('edge label lost');
if(!g.edges.some(e=>e.from==='E'&&e.to==='K'&&e.label==='5 Fehlversuche')) throw new Error('multi-word label lost');
if(g.nodes.find(n=>n.id==='B').shape!=='decision') throw new Error('decision shape lost');
const lay=layoutFlow(g);
const xs=(id)=>lay.pos.get(id).x;
if(!(xs('A')<xs('B')&&xs('B')<xs('L')&&xs('L')<xs('C')&&xs('C')<xs('E')&&xs('E')<xs('K'))) throw new Error('layers not left to right');
for(const p of lay.pos.values()) if(![p.x,p.y,p.w,p.h].every(Number.isFinite)) throw new Error('bad coordinates');
const kinds=Object.fromEntries(g.nodes.map(n=>[n.id,n.kind]));
if(kinds.A!=='start'||kinds.B!=='router'||kinds.K!=='end') throw new Error('kinds '+JSON.stringify(kinds));
const cyc=parseFlow('flowchart LR\n A-->B\n B-->C\n C-->A'); const cl=layoutFlow(cyc);
if(cl.back.size!==1) throw new Error('cycle should yield one back edge');
if(parseFlow('').nodes.length!==0) throw new Error('empty source');
// an edge that skips a layer is lifted over the node in between; a neighbouring edge stays a plain curve
const sk=parseFlow('flowchart LR\n A-->B\n B-->C\n A-->C'); const sl=layoutFlow(sk); const all=[...sl.pos.values()];
const skip=edgePath(sl.pos.get('A'),sl.pos.get('C'),false,all); const near=edgePath(sl.pos.get('A'),sl.pos.get('B'),false,all);
if(!skip.d.includes(' L')) throw new Error('skipping edge not routed around the middle node');
if(near.d.includes(' L')) throw new Error('neighbouring edge must stay a plain curve');
// every mermaid block of the demo vault must parse into a drawable graph
const walk=(d)=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(d+'/'+e.name):e.name.endsWith('.md')?[d+'/'+e.name]:[]);
const vault=process.argv[3];
if(vault){ let n=0; for(const f of walk(vault)){ const m=fs.readFileSync(f,'utf8').match(/```mermaid\s*\n([\s\S]*?)```/); if(!m) continue; const gg=parseFlow(m[1]); n++; if(gg.nodes.length<2||gg.edges.length<1) throw new Error('unparsable diagram in '+f); const ll=layoutFlow(gg); for(const p of ll.pos.values()) if(![p.x,p.y].every(Number.isFinite)) throw new Error('layout in '+f); } console.log('diagrams parsed:',n); }
const sc=sollChain('Login',[{title:'Soll',md:'E-Mail + Passwort, generische Fehlermeldung, Rate-Limit pro IP und Konto.'},{title:'Lücken',md:'x'}]);
if(!sc||sc.nodes.length!==4||sc.edges.length!==3) throw new Error('soll chain: '+JSON.stringify(sc&&sc.nodes.map(n=>n.label)));
if(sollChain('X',[{title:'Lücken',md:'a'}])!==null) throw new Error('soll chain without Soll must be null');
const bl=sollChain('Y',[{title:'Soll',md:'- Eins\n- Zwei'}]); if(bl.nodes.length!==3) throw new Error('bullet chain');
console.log('ok: tabs',tabs.length,'rows',rows.length,'newflow form',form.length);
