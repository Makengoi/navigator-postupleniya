// Раз в день проверяет официальные страницы программ из data.js и отмечает, если на них изменились строки с датами и сроками.
// Результат пишет в pages.js — index.html показывает «Страница приёма изменилась, проверьте даты».
// Запуск: node check-pages.mjs
import { readFile, writeFile, rename } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const ctx = vm.createContext({});
for (const f of ["i18n.js", "data.js"]) vm.runInContext(await readFile(join(here, f), "utf8"), ctx);
const PROGRAMS = ctx.PROGRAMS;

const out = join(here, "pages.js");
let prev = { pages: {} };
try { prev = JSON.parse((await readFile(out, "utf8")).match(/window\.PAGE_WATCH=(.*);\s*$/s)[1]); } catch {}

const DATEISH = /(20\d\d|январ|феврал|март|апрел|\bма[йя]\b|июн|июл|август|сентябр|октябр|ноябр|декабр|january|february|march|april|\bmay\b|june|july|august|september|october|november|december|deadline|дедлайн|срок|приём|прием|application)/i;
const decode = s => s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n));
function dateLines(html) {
  const text = decode(html.replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, "\n"));
  return [...new Set(text.split(/\n+/).map(l => l.replace(/\s+/g, " ").trim()).filter(l => l.length > 6 && l.length < 300 && DATEISH.test(l)))].sort();
}

const pages = {};
await Promise.all(PROGRAMS.map(async p => {
  const old = prev.pages?.[p.id] || {};
  try {
    const r = await fetch(p.url, { signal: AbortSignal.timeout(25000), redirect: "follow", headers: { "User-Agent": "Mozilla/5.0 (Navigator page watcher)", "Accept-Language": "ru,en" } });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const lines = dateLines(await r.text());
    const hash = createHash("sha256").update(lines.join("\n")).digest("hex").slice(0, 16);
    const changed = old.hash && old.hash !== hash ? Date.now() : (old.changed || 0);
    pages[p.id] = { hash, changed, ok: true, lines: lines.length };
    console.log(`${p.id}: ${lines.length} строк с датами${old.hash && old.hash !== hash ? " — ИЗМЕНИЛАСЬ" : ""}`);
  } catch (e) {
    pages[p.id] = { ...old, ok: false, error: String(e.message || e).slice(0, 80) };
    console.error(`${p.id}: не удалось проверить (${e.message})`);
  }
}));

await writeFile(out + ".tmp", `// Создано check-pages.mjs ${new Date().toISOString()}\nwindow.PAGE_WATCH=${JSON.stringify({ at: Date.now(), pages })};\n`, "utf8");
await rename(out + ".tmp", out);
