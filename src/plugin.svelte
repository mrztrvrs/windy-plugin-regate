<script lang="ts">
 import {onMount,onDestroy} from 'svelte';
 import {map} from '@windy/map';
 import store from '@windy/store';
 import bcast from '@windy/broadcast';
 import config from './pluginConfig';
 import race from '../config/race.json';
 import {validateFleet,trackWindow,segments,isStale,escapeHtml,fold} from './model';
 import type {Fleet,Boat} from './model';
 let fleet:Fleet|null=null, query='', error='', loading=false, collapsed=false, automatic=true, hours='24', now=Date.now();
 let favorites:string[]=[], hidden:string[]=[], selected='';
 let layer:L.LayerGroup|null=null, timer:ReturnType<typeof setInterval>|undefined, clock:ReturnType<typeof setInterval>|undefined;
 let controller:AbortController|null=null, active=false, disposed=false;
 const key=`regate:${race.id}:${race.className}:v1`;
 const date=(t:number|null|undefined)=>t?new Date(t).toLocaleString('it-IT',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',timeZoneName:'short'}):'—';
 const value=(n:number|null|undefined,unit:string)=>n==null?'—':`${n.toFixed(1)} ${unit}`;
 $: boats=(fleet?.boats||[]).filter(b=>fold(b.name+' '+b.skipper).includes(fold(query))).sort((a,b)=>Number(favorites.includes(b.id))-Number(favorites.includes(a.id))||(a.rank??9999)-(b.rank??9999)||a.name.localeCompare(b.name));
 $: chosen=fleet?.boats.find(b=>b.id===selected);
 let meteoAt=Number(store.get('timestamp'));
 const updateWeatherTime=()=>{meteoAt=Number(store.get('timestamp'));};
 function save(){try{localStorage.setItem(key,JSON.stringify({favorites,hidden,hours,automatic}));}catch{}}
 function redraw(){
  if(!active||!layer)return;layer.clearLayers();
  for(const b of fleet?.boats||[]){if(hidden.includes(b.id))continue;const fix=b.track.at(-1);if(!fix)continue;
   const stale=isStale(fix,race.staleMinutes,now),color=stale?'#949da6':b.color;
   if(hours!=='off')for(const part of segments(trackWindow(b.track,Number(hours))))if(part.length>1)L.polyline(part.map(p=>[p.lat,p.lon] as [number,number]),{color,weight:favorites.includes(b.id)?4:2,opacity:0.8}).addTo(layer);
   const icon=L.divIcon({className:'regate-marker',iconSize:[26,30],iconAnchor:[13,15],html:`<svg width="26" height="30" viewBox="0 0 26 30" aria-hidden="true"><path d="M13 2L24 27L13 22L2 27Z" fill="${color}" stroke="white" stroke-width="2" transform="rotate(${b.heading??0} 13 15)"/></svg>`});
   L.marker([fix.lat,fix.lon],{icon}).addTo(layer).bindTooltip(escapeHtml(b.name),{direction:'top'}).on('click',()=>focus(b));
  }
 }
 function focus(b:Boat){selected=b.id;const p=b.track.at(-1);if(p)map.panTo([p.lat,p.lon]);}
 function fit(){const fixes=(fleet?.boats||[]).filter(b=>!hidden.includes(b.id)).flatMap(b=>b.track.length?[b.track[b.track.length-1]]:[]);if(fixes.length)map.fitBounds(L.latLngBounds(fixes.map(p=>[p.lat,p.lon] as [number,number])),{padding:[35,35],maxZoom:9});}
 function toggle(id:string,kind:'favorite'|'hidden'){if(kind==='favorite')favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];else hidden=hidden.includes(id)?hidden.filter(x=>x!==id):[...hidden,id];save();redraw();}
 function visibility(all:boolean){hidden=all?[]:(fleet?.boats||[]).map(b=>b.id);save();redraw();}
 function dataUrl(){
  const configured=race.dataUrl;
  if(/^https:\/\//.test(configured))return configured;
  const repo=(config.repository||'').replace(/\.git$/,'').match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/?$/);
  if(repo)return `https://raw.githubusercontent.com/${repo[1]}/${repo[2]}/main/data/fleet.json`;
  return new URL(configured, 'https://localhost:9999/').href;
 }
 async function refresh(){if(loading||!active)return;loading=true;error='';controller=new AbortController();const timeout=setTimeout(()=>controller?.abort(),25000);
  try{const response=await fetch(dataUrl(),{signal:controller.signal,credentials:'omit',cache:'no-cache'});if(!response.ok)throw Error(`HTTP ${response.status}`);const next=validateFleet(await response.json(),race.id,race.className);if(!active||disposed)return;
   if(fleet&&next.fetchedAt<fleet.fetchedAt)throw Error('La fonte ha restituito un aggiornamento precedente.');fleet=next;try{localStorage.setItem(key+':fleet',JSON.stringify(fleet));}catch{}redraw();
  }catch(e){if(active&&!disposed)error=`Aggiornamento non riuscito. ${fleet?'Conservo gli ultimi dati validi.':'Nessun dato ufficiale disponibile.'} ${e instanceof Error?e.message:''}`;}
  finally{clearTimeout(timeout);loading=false;controller=null;}
 }
 function forecast(){const p=chosen?.track.at(-1);if(p)bcast.emit('rqstOpen','detail',{lat:p.lat,lon:p.lon});}
 function close(){active=false;controller?.abort();layer?.clearLayers();if(timer)clearInterval(timer);if(clock)clearInterval(clock);}
 export const onopen=()=>{active=true;layer??=L.layerGroup().addTo(map);redraw();if(timer)clearInterval(timer);timer=setInterval(()=>{if(automatic)void refresh();},Math.max(5,race.refreshMinutes)*60000);if(clock)clearInterval(clock);clock=setInterval(()=>{now=Date.now();redraw();},60000);void refresh();};
 export const onclose=()=>close();
 onMount(()=>{store.on('timestamp',updateWeatherTime);try{const p=JSON.parse(localStorage.getItem(key)||'{}');favorites=Array.isArray(p.favorites)?p.favorites:[];hidden=Array.isArray(p.hidden)?p.hidden:[];hours=['off','0','24','168'].includes(p.hours)?p.hours:'24';automatic=p.automatic!==false;const cached=localStorage.getItem(key+':fleet');if(cached)fleet=validateFleet(JSON.parse(cached),race.id,race.className);}catch{}onopen();});
 onDestroy(()=>{store.off('timestamp',updateWeatherTime);disposed=true;close();layer?.remove();});
</script>
<div class="plugin__mobile-header">Regate · {race.className}</div>
<section class="plugin__content regate">
 <header><div><small>TRACKING DELLA FLOTTA</small><h2>{race.name}</h2><span class="badge">{race.className}</span> <span>{fleet?.boats.length??0} concorrenti</span></div><button aria-label={collapsed?'Espandi elenco':'Riduci elenco'} on:click={()=>collapsed=!collapsed}>{collapsed?'+':'−'}</button></header>
 <div class="times"><div>Posizioni GPS: ultimo rilevamento di ogni barca</div><div>Meteo Windy: {date(meteoAt)}</div><small>Le posizioni non avanzano con la previsione meteo.</small></div>
 {#if error}<p role="alert" class="warning">{error}</p>{/if}
 <div class="toolbar"><button on:click={refresh} disabled={loading}>{loading?'Caricamento…':'Aggiorna'}</button><button on:click={fit} disabled={!fleet}>Inquadra flotta</button></div>
 {#if !collapsed}
 <label class="search">Cerca barca o skipper<input bind:value={query} placeholder="Nome della barca o dello skipper" /></label>
 <div class="toolbar"><button on:click={()=>visibility(true)}>Tutte</button><button on:click={()=>visibility(false)}>Nessuna</button><label>Tracce <select bind:value={hours} on:change={()=>{save();redraw();}}><option value="24">24 ore</option><option value="168">7 giorni</option><option value="0">Complete</option><option value="off">Nascoste</option></select></label></div>
 <label class="auto"><input type="checkbox" bind:checked={automatic} on:change={save}/> Aggiorna ogni {race.refreshMinutes} minuti</label>
 <div class="boats">
 {#each boats as b (b.id)}
 {@const fix=b.track.at(-1)}
 <article class:chosen={selected===b.id} style:border-left-color={b.color}>
 <div class="boatrow"><button class="star" aria-label={`Preferito: ${b.name}`} aria-pressed={favorites.includes(b.id)} on:click={()=>toggle(b.id,'favorite')}>{favorites.includes(b.id)?'★':'☆'}</button><button class="boatname" on:click={()=>focus(b)}><strong>{b.rank?`${b.rank}. `:''}{b.name}</strong><small>{b.skipper}</small></button><input type="checkbox" aria-label={`Mostra ${b.name}`} checked={!hidden.includes(b.id)} on:change={()=>toggle(b.id,'hidden')}/></div>
 <div class="boatstats"><span>{value(b.speedKn,'kn')}</span><span>{b.status||'Stato non disponibile'}</span><span class:old={isStale(fix,race.staleMinutes,now)}>{fix?date(fix.t):'Posizione assente'}{isStale(fix,race.staleMinutes,now)?' · dato vecchio':''}</span></div>
 </article>
 {:else}<p>{fleet?'Nessun concorrente corrisponde alla ricerca.':'In attesa del primo caricamento ufficiale.'}</p>{/each}
 </div>
 {#if chosen}
 {@const p=chosen.track.at(-1)}
 <aside><strong>{chosen.name}</strong><p>{chosen.skipper}</p><div>GPS: {date(p?.t)}</div>{#if p}<div>{p.lat.toFixed(5)}°, {p.lon.toFixed(5)}°</div>{/if}<div>Velocità: {value(chosen.speedKn,'kn')} · Rotta: {value(chosen.heading,'°')}</div><div>All’arrivo: {value(chosen.dtfNm,'NM')} · Dal primo: {value(chosen.dtlNm,'NM')}</div><small>Classifica e numeri del report: {date(chosen.reportAt)}</small><button on:click={forecast} disabled={!p}>Meteo in questa posizione</button></aside>
 {/if}
 <footer>Ultima raccolta: {date(fleet?.fetchedAt)}<br/><a href={race.trackerUrl} target="_blank" rel="noopener noreferrer">Apri tracker ufficiale</a><p>Posizioni pubblicate dall’organizzatore, senza estrapolazioni. Distanze e velocità nautiche in NM e nodi.</p></footer>
 {/if}
</section>
<style>
 .regate{--accent:#ffac59;background:#172733;color:#f0f5f8;padding:18px;font-family:Arial,sans-serif;box-sizing:border-box;min-width:0}.regate header{display:flex;justify-content:space-between;gap:10px}.regate h2{font-size:23px;margin:5px 0 10px;line-height:1.2}.regate small{color:#b6c9d5;font-size:12px}.badge{background:#334a5b;border-radius:20px;padding:4px 10px;color:#ffd2a4}.times{font-size:12px;line-height:1.7;margin:17px 0;padding:10px;background:#203746;border-radius:8px}.toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:12px 0}.regate button,.regate select{border:1px solid #577181;border-radius:7px;color:#edf5fa;background:#2c4556;padding:9px;min-height:44px;font-size:13px;cursor:pointer}.regate button:disabled{opacity:.5;cursor:default}.regate button:focus-visible,.regate input:focus-visible,.regate select:focus-visible{outline:2px solid var(--accent);outline-offset:2px}.search{display:block;font-size:12px}.search input{display:block;width:100%;box-sizing:border-box;margin-top:7px;background:#10212d;border:1px solid #526b7d;border-radius:7px;padding:12px;color:white;font-size:15px;min-height:44px}.auto{font-size:12px;display:flex;align-items:center;gap:7px}.regate input[type=checkbox]{width:22px;height:22px;accent-color:#ffac59}.boats{margin-top:14px}.boats article{border-left:3px solid;border-radius:7px;background:#223847;padding:8px;margin:8px 0}.boats article.chosen{outline:1px solid #ffac59}.boatrow{display:flex;gap:6px;align-items:center}.regate .star{border:0;background:none;color:#ffcd81;font-size:25px;width:44px;flex-shrink:0}.regate .boatname{border:0;background:none;text-align:left;flex:1;min-width:0;padding:4px;font-size:14px;overflow-wrap:anywhere}.boatname small{display:block;margin-top:5px}.boatstats{display:flex;flex-wrap:wrap;gap:8px;font-size:11px;margin:7px 5px}.old,.warning{color:#ffd28e}.warning{border:1px solid #a98243;border-radius:7px;padding:10px;overflow-wrap:anywhere;font-size:12px}.regate aside{background:#304b5c;padding:14px;border-radius:8px;line-height:1.8;font-size:13px}.regate aside button{display:block;margin-top:12px}.regate footer{font-size:11px;color:#b6c9d5;margin-top:16px;line-height:1.6}.regate a{color:#ffd2a4} @media(max-width:600px){.regate{padding:12px}.regate h2{font-size:20px}.regate .boatname{font-size:13px}}
</style>
