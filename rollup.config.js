import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import svelte from 'rollup-plugin-svelte';
import swc from 'rollup-plugin-swc3';
import preprocess from 'svelte-preprocess';
import {transformCodeToESMPlugin} from '@windycom/plugin-devtools';
export default {input:'src/plugin.svelte',external:id=>id.startsWith('@windy/'),output:[{file:'dist/plugin.js',format:'module'},{file:'dist/plugin.min.js',format:'module',plugins:[terser()]}],plugins:[json(),svelte({emitCss:false,preprocess:preprocess()}),swc({include:['**/*.ts','**/*.svelte']}),resolve({browser:true,dedupe:['svelte']}),commonjs(),transformCodeToESMPlugin()]};
