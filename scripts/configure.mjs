import {readFile,writeFile} from 'node:fs/promises';
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const [race,d,pkg]=await Promise.all(['config/race.json','config/distribution.json','package.json'].map(read));
const config={name:pkg.name,version:pkg.version,icon:'⛵',title:`Regate · ${race.className}`,description:`Tracking ${race.name}, classe ${race.className}`,author:d.author||'Progetto Windy plugin x regate',repository:d.repository,desktopUI:'rhpane',mobileUI:'fullscreen',routerPath:'/regate',private:d.private};
// Windy's transformer evaluates this file without resolving imports: use a literal.
await writeFile('src/pluginConfig.ts',`// Generato da scripts/configure.mjs; modificare config/*.json.\nimport type { ExternalPluginConfig } from '@windy/interfaces';\nconst config: ExternalPluginConfig = ${JSON.stringify(config,null,2).replace(/"([a-zA-Z]+)":/g,'$1:')};\nexport default config;\n`);
