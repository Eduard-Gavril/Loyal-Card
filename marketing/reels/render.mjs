import { createRequire } from 'module';
const req = createRequire(import.meta.url);
let pw; try { pw = req('playwright'); } catch { pw = req('/opt/node22/lib/node_modules/playwright'); }
const { chromium } = pw;
import fs from 'fs';
const [,, file, out, mode, fpsArg] = process.argv;
const html = fs.readFileSync(file, 'utf8');
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 720, height: 1280 }, deviceScaleFactor: 1.5 });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
await p.setContent(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${html}</body></html>`, { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
await p.evaluate(() => window.__lc.pause());
await p.addStyleTag({ content: `body{margin:0!important} .page{display:block!important;padding:0!important;max-width:none!important} .head,.side,.controls,#playhint{display:none!important}
  .player{border-radius:0!important;box-shadow:none!important;max-width:none!important;width:720px!important} #wrap{width:720px!important;height:1280px!important;aspect-ratio:auto!important}` });
await p.evaluate(() => Promise.all(['400 16px "IBM Plex Mono"','500 16px "IBM Plex Mono"','400 16px "Inter"','500 16px "Inter"','600 16px "Inter"','700 16px "Inter"','400 16px "Libre Caslon Display"'].map(f => document.fonts.load(f, 'aăîșțâĂÎȘȚÂ€→'))));
await p.waitForTimeout(300);
const fontsOk = await p.evaluate(() => ['Libre Caslon Display','Inter','IBM Plex Mono'].map(f => f + ':' + document.fonts.check(`16px "${f}"`, 'ăîșțâ')));
const clip = { x: 0, y: 0, width: 720, height: 1280 };
fs.mkdirSync(out, { recursive: true });
if (mode === 'sheet') {
  const times = (process.env.TIMES || '4.2,9.8,19.2,28.0').split(',').map(Number);
  let i = 0;
  for (const t of times) { await p.evaluate(t => window.__lc.seek(t), t); await p.screenshot({ path: `${out}/s${String(i++).padStart(2, '0')}.png`, clip }); }
} else {
  const fps = Number(fpsArg || 30), D = await p.evaluate(() => window.__lc.D), n = Math.round(D * fps);
  for (let i = 0; i <= n; i++) {
    await p.evaluate(t => window.__lc.seek(t), i / fps);
    await p.screenshot({ path: `${out}/f${String(i).padStart(5, '0')}.png`, clip });
  }
}
console.log('errors:', JSON.stringify(errs), 'fonts:', fontsOk.join(' '));
await b.close();
