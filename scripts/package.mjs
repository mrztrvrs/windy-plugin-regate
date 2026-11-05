import {readFile,mkdtemp,copyFile,writeFile,rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
const d=JSON.parse(await readFile('config/distribution.json','utf8'));
if(!/^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/.test(d.repository)||!d.author)throw Error('Compilare config/distribution.json con repository reale e autore prima della distribuzione.');
const manifest=JSON.parse(await readFile('dist/plugin.json','utf8'));
manifest.repositoryName=process.env.GITHUB_REPOSITORY||d.repository.replace('https://github.com/','');
manifest.repositoryOwner=manifest.repositoryName.split('/')[0];manifest.commitSha=process.env.GITHUB_SHA||execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const dir=await mkdtemp(path.join(tmpdir(),'regate-'));
try{await writeFile(path.join(dir,'plugin.json'),JSON.stringify(manifest));for(const file of ['plugin.min.js','package.json'])await copyFile('dist/'+file,path.join(dir,file));execFileSync('tar',['cf',path.resolve('dist/plugin.tar'),'-C',dir,'plugin.json','plugin.min.js','package.json']);console.log('dist/plugin.tar pronto.');}finally{await rm(dir,{recursive:true,force:true});}
