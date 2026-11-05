import https from 'node:https';
import {readFile} from 'node:fs/promises';
import {keyPEM,certificatePEM} from '@windycom/plugin-devtools';
const paths={'/plugin.js':'dist/plugin.js','/plugin.min.js':'dist/plugin.min.js','/data/fleet.json':'data/fleet.json'};
https.createServer({key:keyPEM,cert:certificatePEM},async(req,res)=>{
 res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Cache-Control','no-store');
 const path=paths[new URL(req.url,'https://localhost').pathname];
 if(!path){res.writeHead(404).end();return;}
 try{const data=await readFile(path);res.setHeader('Content-Type',path.endsWith('.json')?'application/json':'text/javascript');res.end(data);}catch{res.writeHead(404).end();}
}).listen(9999,'127.0.0.1',()=>console.log('https://localhost:9999/plugin.js — aprire prima per accettare il certificato locale.'));
