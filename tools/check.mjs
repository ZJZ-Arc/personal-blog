#!/usr/bin/env node
/**
 * 发布前自检 —— 零依赖，只用 Node 自带模块。
 *
 *   node tools/check.mjs
 *
 * 手工维护博客最容易忘的四件事，它都会替你查：
 *   1. 本地链接是否指向存在的文件
 *   2. 首页标签栏 / tags.html 的计数是否和真实文章数一致
 *   3. feed.xml、sitemap.xml 是否漏了新文章
 *   4. 每个页面的必备元素（canonical、og、主题脚本顺序…）是否齐全
 *
 * 全部通过时退出码为 0，有问题时退出码为 1——所以它也能直接用在 CI 里。
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, resolve, relative, basename } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const problems = [];
const notes = [];
let checked = 0;

const fail = (msg) => problems.push(msg);
const ok = () => { checked++; };
const rel = (p) => relative(rootDir, p).replace(/\\/g, "/");
const read = (p) => readFileSync(p, "utf8");
const listHtml = (dir) =>
  existsSync(dir)
    ? readdirSync(dir).filter((f) => f.endsWith(".html")).map((f) => join(dir, f))
    : [];

const pages = [...listHtml(rootDir), ...listHtml(join(rootDir, "posts"))];
const posts = listHtml(join(rootDir, "posts"));

if (!pages.length) {
  console.error("✖ 一个 HTML 文件都没找到，请确认脚本放在 tools/ 目录下");
  process.exit(1);
}

/* ------------------------------------------------------------------ 1. 页面必备元素 */
for (const page of pages) {
  const name = rel(page);
  const html = read(page);

  const has = (re, label) => {
    if (re.test(html)) ok();
    else fail(`${name}: 缺少${label}`);
  };

  has(/<html[^>]+data-theme="(light|dark)"/, "data-theme 属性");
  has(/<link[^>]+rel="canonical"/, "canonical");
  has(/<meta[^>]+property="og:title"/, "og:title");
  has(/<meta[^>]+name="description"/, "description");
  has(/<link[^>]+rel="alternate"[^>]+application\/rss\+xml"/, "RSS 声明");
  has(/class="skip-link"/, "跳到正文的 skip-link");
  has(/class="site-footer"/, "页脚");
  has(/data-theme-toggle/, "主题切换按钮");
  has(/<script[^>]+src="[^"]*main\.js"/, "main.js 引用");

  const h1s = (html.match(/<h1[\s>]/g) || []).length;
  if (h1s === 1) ok();
  else fail(`${name}: <h1> 应该有 1 个，实际 ${h1s} 个`);

  // 主题脚本必须排在样式表之前，否则深色模式会先闪一下白屏
  const scriptAt = html.search(/<script>[\s\S]*?<\/script>/);
  const cssAt = html.search(/<link[^>]+rel="stylesheet"/);
  if (scriptAt !== -1 && cssAt !== -1 && scriptAt < cssAt) ok();
  else fail(`${name}: 非阻塞主题脚本没有排在样式表之前（深色用户会看到白屏闪烁）`);
}

/* ------------------------------------------------------------------ 2. 本地链接 */
for (const page of pages) {
  // 示例代码块里出现的路径不算真链接
  const html = read(page).replace(/<pre>[\s\S]*?<\/pre>/g, "");
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    let target = m[1];
    if (/^(https?:|mailto:|data:|#|javascript:)/.test(target)) continue;
    target = target.split(/[?#]/)[0];
    if (!target) continue;
    if (existsSync(resolve(dirname(page), target))) ok();
    else fail(`${rel(page)}: 链接指向不存在的文件 -> ${target}`);
  }
}

/* ------------------------------------------------------------------ 3. 标签计数一致性 */
const indexHtml = read(join(rootDir, "index.html"));
const actual = {};
const cards = indexHtml.match(/<li[^>]+class="post-item"[^>]*>/g) || [];
for (const li of cards) {
  const tags = /data-tags="([^"]*)"/.exec(li)?.[1] ?? "";
  for (const t of tags.split(/\s+/).filter(Boolean)) actual[t] = (actual[t] || 0) + 1;
}

if (cards.length === posts.length) ok();
else fail(`首页卡片 ${cards.length} 个，但 posts/ 里有 ${posts.length} 个文件，数量对不上`);

const barCounts = {};
for (const m of indexHtml.matchAll(/data-tag="([^"]+)"[^>]*>([\s\S]*?)<\/button>/g)) {
  const n = /class="count">(\d+)</.exec(m[2]);
  barCounts[m[1]] = n ? Number(n[1]) : 0;
}
for (const [tag, n] of Object.entries(barCounts)) {
  if (actual[tag] === n) ok();
  else fail(`首页标签「${tag}」写着 ${n} 篇，实际 ${actual[tag] ?? 0} 篇`);
}
for (const tag of Object.keys(actual)) {
  if (tag in barCounts) ok();
  else fail(`首页标签栏缺少「${tag}」（有文章在用这个标签，但按钮没了）`);
}

const tagsHtml = read(join(rootDir, "tags.html"));
const overview = {};
for (const m of tagsHtml.matchAll(/index\.html\?tag=([^"]+)"[\s\S]*?(\d+)\s*篇/g)) {
  overview[decodeURIComponent(m[1])] = Number(m[2]);
}
for (const [tag, n] of Object.entries(actual)) {
  if (overview[tag] === n) ok();
  else if (!(tag in overview)) fail(`tags.html 缺少标签「${tag}」`);
  else fail(`tags.html 里「${tag}」写着 ${overview[tag]} 篇，实际 ${n} 篇`);
}
for (const tag of Object.keys(overview)) {
  if (tag in actual) ok();
  else fail(`tags.html 里的标签「${tag}」没有任何文章在用`);
}

/* ------------------------------------------------------------------ 4. RSS */
const feedPath = join(rootDir, "feed.xml");
if (existsSync(feedPath)) {
  const feed = read(feedPath);
  const items = feed.match(/<item>[\s\S]*?<\/item>/g) || [];
  if (items.length === posts.length) ok();
  else fail(`feed.xml 有 ${items.length} 个 <item>，但文章有 ${posts.length} 篇`);

  for (const item of items) {
    const link = /<link>([^<]+)<\/link>/.exec(item)?.[1] ?? "";
    const file = link.replace(/^https?:\/\/[^/]+\//, "");
    const full = file === "" || file === "index.html" ? join(rootDir, "index.html") : join(rootDir, file);
    if (existsSync(full)) ok();
    else fail(`feed.xml: <link> 指向不存在的文件 -> ${link}`);

    const pub = /<pubDate>([^<]+)<\/pubDate>/.exec(item)?.[1] ?? "";
    if (/^[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} [+-]\d{4}$/.test(pub)) ok();
    else fail(`feed.xml: pubDate 不是合法 RFC822 格式 -> "${pub}"（例：Mon, 12 Oct 2026 00:00:00 +0800）`);
  }

  const lastBuild = /<lastBuildDate>([^<]+)<\/lastBuildDate>/.exec(feed)?.[1] ?? "";
  // 最新的文章日期不应该比 lastBuildDate 还新
  const pubDates = items
    .map((i) => Date.parse(/<pubDate>([^<]+)<\/pubDate>/.exec(i)?.[1] ?? ""))
    .filter((d) => !Number.isNaN(d));
  if (pubDates.length && Date.parse(lastBuild) >= Math.max(...pubDates)) ok();
  else fail(`feed.xml 的 <lastBuildDate> 早于最新一篇文章的 pubDate，忘了更新？`);
}

/* ------------------------------------------------------------------ 5. sitemap / robots */
const smPath = join(rootDir, "sitemap.xml");
if (existsSync(smPath)) {
  const sm = read(smPath);
  const locs = new Set([...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
  for (const page of pages) {
    const file = rel(page);
    const want = file === "index.html" ? "https://example.com/" : `https://example.com/${file}`;
    if (locs.has(want)) ok();
    else fail(`sitemap.xml 缺少 ${file}`);
  }
  for (const loc of locs) {
    if (/^https:\/\//.test(loc)) ok();
    else fail(`sitemap.xml 的 <loc> 必须是完整 https 网址 -> ${loc}`);
  }
}

const robotsPath = join(rootDir, "robots.txt");
if (existsSync(robotsPath)) {
  if (/^Sitemap:/m.test(read(robotsPath))) ok();
  else fail("robots.txt 缺少 Sitemap: 声明");
}

/* ------------------------------------------------------------------ 6. 提醒（不算错误） */
if (posts.length && /https:\/\/example\.com/.test(indexHtml)) {
  notes.push("全站还在用占位域名 https://example.com —— 部署到真实网址后记得全局替换（README 第四节有命令）");
}
if (!existsSync(join(rootDir, ".nojekyll"))) {
  notes.push("缺少 .nojekyll 空文件，GitHub Pages 会用 Jekyll 处理你的文件");
}

/* ------------------------------------------------------------------ 报告 */
const nameOf = (p) => basename(p);
console.log(`\n检查了 ${pages.length} 个页面（${posts.length} 篇文章），共 ${checked} 项断言。\n`);

if (problems.length) {
  console.log(`✖ 发现 ${problems.length} 个问题：\n`);
  for (const p of problems) console.log("  • " + p);
  console.log("\n修完再跑一次：node tools/check.mjs\n");
} else {
  console.log("✔ 全部通过，可以发布了。\n");
}

if (notes.length) {
  console.log("提醒（不影响发布）：");
  for (const n of notes) console.log("  · " + n);
  console.log("");
}

process.exit(problems.length ? 1 : 0);
