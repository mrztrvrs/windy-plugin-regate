import {readFile,writeFile,rename,mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
import {extractOfficial} from './extract.mjs';
import {validateFleet} from '../src/model.ts';
const config=JSON.parse(await readFile('config/race.json','utf8'));
if(config.provider!=='geovoile-page')throw Error('Provider non implementato: '+config.provider);
const url=new URL(config.trackerUrl);if(url.protocol!=='https:')throw Error('Il tracker deve usare HTTPS.');
const browser=await chromium.launch({headless:true,...(process.env.OFFICIAL_CHROME?{executablePath:process.env.OFFICIAL_CHROME}:{})});
try {
 const page=await browser.newPage();
 await page.goto(url.href,{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.tracker?.currentReport?.lines?.length&&window.tracker?._boats?.some(b=>b.track?.locations?.length),{},{timeout:90000});
 const extracted=await page.evaluate(extractOfficial,{className:config.className});
 if(!extracted)throw Error('Il tracker non ha ancora caricato le tracce.');
 const fleet=validateFleet({schemaVersion:1,raceId:config.id,className:config.className,fetchedAt:Date.now(),source:url.href,boats:extracted.boats},config.id,config.className);
 // A temporary source failure must not silently delete known competitors or newer fixes.
 let previous=null;try{previous=JSON.parse(await readFile('data/fleet.json','utf8'));}catch{}
 if(previous?.raceId===fleet.raceId&&previous.className===fleet.className){
  const ids=new Set(fleet.boats.map(b=>b.id));if(previous.boats?.some(b=>!ids.has(b.id)))throw Error('Elenco incompleto: conservati i dati precedenti.');
  for(const boat of fleet.boats){const old=previous.boats.find(b=>b.id===boat.id);if(old?.track?.length){const merged=new Map(old.track.map(p=>[p.t,p]));for(const p of boat.track)merged.set(p.t,p);boat.track=[...merged.values()].sort((a,b)=>a.t-b.t);}}
 }
 await mkdir('data',{recursive:true});await writeFile('data/fleet.json.tmp',JSON.stringify(fleet));await rename('data/fleet.json.tmp','data/fleet.json');
 console.log(`${fleet.boats.length} concorrenti ${config.className}; ${fleet.boats.reduce((n,b)=>n+b.track.length,0)} posizioni ufficiali.`);
}finally{await browser.close();}
