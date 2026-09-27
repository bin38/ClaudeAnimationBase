import puppeteer from 'puppeteer-core';
import { resolve } from 'node:path'; import { pathToFileURL } from 'node:url';
const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH, headless: true, protocolTimeout: 0, args: ['--no-sandbox','--allow-file-access-from-files','--ignore-gpu-blocklist','--use-angle=swiftshader','--enable-unsafe-swiftshader', ...(process.argv.slice(2))] });
const p = await b.newPage(); p.on('console', m => console.log('[pg]', m.text()));
await p.goto(pathToFileURL(resolve('studio.html')).href + '?render', { waitUntil: 'networkidle0' });
await p.waitForFunction('window.ready === true');
const r = await p.evaluate(async () => { window.LOOP = LOOPS.p0; const out = [];
  for (const t of [0.5,1,1.5,2,2.5]) { const a = performance.now(); T = t; await redraw(); const b1 = performance.now(); composite(t); outX.getImageData(0,0,1,1); const c = performance.now(); outC.toDataURL('image/jpeg', .9); const d = performance.now(); out.push([b1-a, c-b1, d-c].map(Math.round)); }
  return out; });
console.log(JSON.stringify(r)); await b.close();
