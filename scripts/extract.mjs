// Executed inside the official public tracker; no personal tracker, predictions or private feeds.
export function extractOfficial({className}) {
 const t=window.tracker;
 if(!t?._boats?.length||!t.currentReport?.lines?.length)return null;
 const fold=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 const lines=new Map(t.currentReport.lines.map(l=>[String(l.boat),l]));
 const number=v=>v===null||v===undefined||v===''?null:(Number.isFinite(Number(v))?Number(v):null);
 const classes=[...new Set(t._boats.map(b=>t._boatClassesByBoatIds?.[b.id]?.name).filter(Boolean))];
 if(!classes.some(c=>fold(c)===fold(className)))throw Error('Classe non trovata: '+className+'. Disponibili: '+classes.join(', '));
 const boats=t._boats.filter(b=>fold(t._boatClassesByBoatIds?.[b.id]?.name)===fold(className)).map((b,i)=>{
  const l=lines.get(String(b.id));
  return {id:String(b.id),name:String(b.name||b.id),skipper:(b.sailors||[]).map(s=>[s.fname,s.lname].filter(Boolean).join(' ')).join(' / '),className,
   color:/^#?[\da-f]{6}$/i.test(String(b.trackColor))?'#'+String(b.trackColor).replace(/^#/, ''):['#ef8e38','#5ec6d3','#c68bf3','#f1cc61','#8ed199'][i%5],
   status:String(l?.racestatus||''),rank:number(l?.rank),speedKn:number(l?.speed),heading:number(l?.heading),dtfNm:number(l?.dtf),dtlNm:number(l?.dtl),reportAt:number(t.currentReport.timecode)===null?null:Number(t.currentReport.timecode)*1000,
   track:(b.track?.locations||[]).map(p=>({t:Number(p.timecode)*1000,lat:Number(p.lat),lon:Number(p.lng)}))};
 });
 // Empty tracks may mean the official page is still loading.
 if(!boats.some(b=>b.track.length))return null;
 return {boats,classes};
}
