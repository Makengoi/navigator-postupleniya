// Скачивает RSS напрямую (без CORS-прокси) и пишет news.js рядом с index.html.
// Запуск: node update-news.mjs. Автозапуск каждые 30 минут: setup-autoupdate.ps1
import { writeFile, rename } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const FEEDS = createRequire(import.meta.url)("./feeds.js");

const decode = s => s
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const text = s => decode(decode(s)).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const tag = (xml, t) => (xml.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`)) || [])[1] || "";

function parse(xml, feed) {
  const chan = text(tag(xml.split(/<item[\s>]/)[0], "title")).replace(/:.*$/, "");
  const google = feed.url.includes("news.google.com");
  return xml.split(/<item[\s>]/).slice(1).map(it => {
    let title = text(tag(it, "title")), src = text(tag(it, "source"));
    if (src && title.endsWith(" - " + src)) title = title.slice(0, -(src.length + 3));
    return { cat: feed.cat, title, link: text(tag(it, "link")), at: Date.parse(text(tag(it, "pubDate"))) || 0,
      src: src || chan, desc: google ? "" : text(tag(it, "description")).slice(0, 260) };
  });
}

const res = await Promise.allSettled(FEEDS.map(async f => {
  const r = await fetch(f.url, { signal: AbortSignal.timeout(20000), headers: { "User-Agent": "Mozilla/5.0 (Navigator news updater)" } });
  if (!r.ok) throw new Error(r.status + " " + f.url);
  return parse(await r.text(), f);
}));
res.filter(r => r.status === "rejected").forEach(r => console.error("Лента не загрузилась:", r.reason.message));

const seen = new Set(), per = {}, since = Date.now() - 21 * 864e5;
const items = res.flatMap(r => r.status === "fulfilled" ? r.value : [])
  .filter(i => i.title && /^https?:\/\//.test(i.link) && i.at > since)
  .sort((a, b) => b.at - a.at)
  .filter(i => { const k = i.title.toLowerCase().slice(0, 60); if (seen.has(k)) return false; seen.add(k); return true; })
  .filter(i => (per[i.cat] = (per[i.cat] || 0) + 1) <= 30);

if (!items.length) { console.error("Новостей нет, news.js не тронут"); process.exit(1); }
const out = join(here, "news.js");
await writeFile(out + ".tmp", `// Создано update-news.mjs ${new Date().toISOString()}\nwindow.NEWS_DATA=${JSON.stringify({ at: Date.now(), items })};\n`, "utf8");
await rename(out + ".tmp", out);
console.log(`news.js: ${items.length} новостей (${["adm", "edu", "sci"].map(c => c + "=" + items.filter(i => i.cat === c).length).join(", ")})`);
