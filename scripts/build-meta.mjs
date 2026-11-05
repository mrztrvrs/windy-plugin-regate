import {readFile,writeFile} from 'node:fs/promises';
const pkg=JSON.parse(await readFile('package.json','utf8'));
const race=JSON.parse(await readFile('config/race.json','utf8'));
const d=JSON.parse(await readFile('config/distribution.json','utf8'));
await writeFile('dist/package.json',JSON.stringify(pkg,null,2));
// The build transformer writes plugin.json. Retain the official manifest fields.
const manifest=JSON.parse(await readFile('dist/plugin.json','utf8'));
manifest.title=`Regate · ${race.className}`;manifest.description=`Tracking ${race.name}, classe ${race.className}`;
if(manifest.version!==pkg.version)throw Error('Versioni package e plugin non allineate.');
manifest.repository=d.repository;manifest.author=d.author||'Progetto Windy plugin x regate';manifest.private=d.private;
await writeFile('dist/plugin.json',JSON.stringify(manifest,null,2));
