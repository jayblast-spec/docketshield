// Live end-to-end check: render the synthetic sample warrant, send it to Gemini,
// and print the reviewed extraction plus the deadline cross-check.
// Usage: GOOGLE_AI_STUDIO_API_KEY=... node scripts/live-extract.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
import { chromium } from "playwright";
import { extractWarrant } from "../dist/extract.js";

const here = dirname(fileURLToPath(import.meta.url));
const fixture = resolve(here, "../fixtures/sample-warrant.html");
const out = resolve(here, "../fixtures/sample-warrant.png");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 860, height: 1000 } });
await page.goto(pathToFileURL(fixture).href);
await page.screenshot({ path: out, fullPage: true });
await browser.close();

const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
if (!apiKey) throw new Error("GOOGLE_AI_STUDIO_API_KEY is not set");
const result = await extractWarrant({ base64: readFileSync(out).toString("base64"), mimeType: "image/png" }, { apiKey });

console.log("model:", result.model);
for (const [k, v] of Object.entries(result.fields)) console.log(`${k.padEnd(22)} ${String(v.value).padEnd(48)} conf=${v.confidence}`);
console.log("needsConfirmation:", result.needsConfirmation);
console.log("checks:", result.checks);
