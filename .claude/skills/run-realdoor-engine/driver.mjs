// REPL driver for the RealDoor Next.js engine. Run headless (no xvfb needed).
// Designed for agents: wrap in tmux, send-keys commands, capture-pane output.
// stdin commands -> Playwright actions against a real Chromium page.
import { chromium } from 'playwright';
import * as readline from 'node:readline';
import * as fs from 'node:fs';
import * as path from 'node:path';

const SHOT_DIR = process.env.SCREENSHOT_DIR || '/tmp/realdoor-engine-shots';
fs.mkdirSync(SHOT_DIR, { recursive: true });
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

let browser = null;
let page = null;
const consoleEvents = [];

const COMMANDS = {
  async launch() {
    if (browser) return console.log('already launched');
    browser = await chromium.launch({ args: ['--no-sandbox'] });
    page = await (await browser.newContext()).newPage();
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleEvents.push(msg.text());
    });
    page.on('pageerror', (err) => consoleEvents.push('pageerror: ' + err.message));
    console.log('launched.');
  },

  async nav(url) {
    if (!page) return console.log('ERROR: launch first');
    const target = /^https?:\/\//.test(url) ? url : BASE_URL + (url.startsWith('/') ? url : '/' + url);
    await page.goto(target, { waitUntil: 'networkidle', timeout: 30_000 });
    console.log('nav ->', page.url());
  },

  async ss(name) {
    if (!page) return console.log('ERROR: launch first');
    const f = path.join(SHOT_DIR, (name || `ss-${Date.now()}`) + '.png');
    await page.screenshot({ path: f, fullPage: true });
    console.log('screenshot:', f);
  },

  async click(sel) {
    if (!page) return console.log('ERROR: launch first');
    try { await page.locator(sel).first().click({ timeout: 10_000 }); console.log('click', sel, '-> OK'); }
    catch (e) { console.log('click', sel, '-> ERROR:', e.message.split('\n')[0]); }
  },

  async 'click-text'(text) {
    if (!page) return console.log('ERROR: launch first');
    try { await page.getByText(text, { exact: false }).first().click({ timeout: 10_000 }); console.log('click-text', JSON.stringify(text), '-> OK'); }
    catch (e) { console.log('click-text', JSON.stringify(text), '-> ERROR:', e.message.split('\n')[0]); }
  },

  async fill(args) {
    if (!page) return console.log('ERROR: launch first');
    const [sel, ...rest] = args.split(' ');
    try { await page.locator(sel).first().fill(rest.join(' ')); console.log('fill', sel, '-> OK'); }
    catch (e) { console.log('fill', sel, '-> ERROR:', e.message.split('\n')[0]); }
  },

  async type(text) { if (page) await page.keyboard.type(text, { delay: 20 }); },
  async press(key) { if (page) await page.keyboard.press(key); },

  async 'wait-for'(sel) {
    if (!page) return console.log('ERROR: launch first');
    try {
      if (sel.startsWith('text=')) await page.getByText(sel.slice(5)).first().waitFor({ timeout: 10_000 });
      else await page.waitForSelector(sel, { timeout: 10_000 });
      console.log('found:', sel);
    } catch { console.log('TIMEOUT:', sel); }
  },

  async text(sel) {
    if (!page) return console.log('ERROR: launch first');
    console.log(await page.evaluate(
      (s) => (s ? document.querySelector(s) : document.body)?.innerText ?? '(null)',
      sel || null,
    ));
  },

  async eval(expr) {
    if (!page) return console.log('ERROR: launch first');
    try { console.log(JSON.stringify(await page.evaluate(expr))); }
    catch (e) { console.log('ERROR:', e.message); }
  },

  async console(flag) {
    if (flag === '--errors' || !flag) {
      console.log(consoleEvents.length ? consoleEvents.join('\n') : '(no console/page errors observed)');
    }
  },

  async quit() { if (browser) await browser.close().catch(() => {}); browser = null; page = null; },
  help() { console.log('commands:', Object.keys(COMMANDS).join(', ')); },
};

const stdin = fs.createReadStream(null, { fd: fs.openSync('/dev/stdin', 'r') });
const rl = readline.createInterface({ input: stdin, output: process.stdout, prompt: 'driver> ' });

rl.on('line', async (line) => {
  const [cmd, ...rest] = line.trim().split(/\s+/);
  if (!cmd) return rl.prompt();
  const fn = COMMANDS[cmd];
  if (!fn) { console.log('unknown:', cmd, '- try: help'); return rl.prompt(); }
  try { await fn(rest.join(' ')); } catch (e) { console.log('ERROR:', e.message); }
  if (cmd === 'quit') { rl.close(); process.exit(0); }
  rl.prompt();
});
rl.on('close', async () => { await COMMANDS.quit(); process.exit(0); });

console.log('realdoor-engine driver - "help" for commands, "launch" to start');
rl.prompt();
