export interface Fix { t:number; lat:number; lon:number }
export interface Boat { id:string; name:string; skipper:string; className:string; color:string; status:string; rank:number|null; speedKn:number|null; heading:number|null; dtfNm:number|null; dtlNm:number|null; reportAt:number|null; track:Fix[] }
export interface Fleet { schemaVersion:1; raceId:string; className:string; fetchedAt:number; source:string; boats:Boat[] }
export const fold=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export function validFix(p:Fix,now=Date.now()):boolean {return p!=null && Number.isFinite(p.t)&&p.t>0&&p.t<=now&&Number.isFinite(p.lat)&&Math.abs(p.lat)<=90&&Number.isFinite(p.lon)&&Math.abs(p.lon)<=180;}
export function cleanTrack(points:Fix[],now=Date.now()):Fix[]{const unique=new Map<number,Fix>();for(const p of points)if(validFix(p,now))unique.set(p.t,{t:p.t,lat:p.lat,lon:p.lon});return [...unique.values()].sort((a,b)=>a.t-b.t);}
export function validateFleet(value:unknown,raceId:string,className:string,now=Date.now()):Fleet {
 const f=value as Fleet;
 if(!f||f.schemaVersion!==1||f.raceId!==raceId||fold(f.className)!==fold(className)||!Number.isFinite(f.fetchedAt)||f.fetchedAt>now+60000||typeof f.source!=='string'||!Array.isArray(f.boats)||!f.boats.length)throw Error('Dati flotta assenti o non compatibili con la configurazione.');
 const ids=new Set<string>();
 for(const b of f.boats){if(typeof b.id!=='string'||!b.id||ids.has(b.id)||typeof b.name!=='string'||typeof b.skipper!=='string'||typeof b.status!=='string'||fold(b.className)!==fold(className)||!Array.isArray(b.track))throw Error('Elenco concorrenti non valido.');ids.add(b.id);b.track=cleanTrack(b.track,now);if(!/^#[0-9a-f]{6}$/i.test(b.color))b.color='#ff9c43';for(const k of ['speedKn','heading','dtfNm','dtlNm','reportAt','rank'] as const)if(b[k]!==null&&(!Number.isFinite(b[k])||b[k]!<0))throw Error('Valore numerico non valido.');}
 if(!f.boats.some(b=>b.track.length))throw Error('Nessuna posizione valida disponibile.');return f;
}
export function trackWindow(track:Fix[],hours:number):Fix[]{if(!hours||!track.length)return track;return track.filter(p=>p.t>=track[track.length-1].t-hours*3600000);}
export function segments(track:Fix[]):Fix[][] {const result:Fix[][]=[];let current:Fix[]=[];for(const p of track){if(current.length&&Math.abs(p.lon-current[current.length-1].lon)>180){result.push(current);current=[];}current.push(p);}if(current.length)result.push(current);return result;}
export const isStale=(fix:Fix|undefined,minutes:number,now=Date.now())=>!fix||now-fix.t>minutes*60000;
export const escapeHtml=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
