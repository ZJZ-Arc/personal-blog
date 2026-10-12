#!/usr/bin/env node
/**
 * 换站点地址 —— 零依赖，只用 Node 自带模块。
 *
 *   node tools/set-domain.mjs https://你的域名
 *   node tools/set-domain.mjs https://用户名.github.io/仓库名
 *
 * 什么时候用：
 *   · 改了仓库名（项目站点的地址是 用户名.github.io/仓库名/，少了子路径会 404）
 *   · 绑定了自定义域名
 *   · 从 example.com 换成真实网址
 *
 * 它会更新所有 HTML / XML / TXT 里的绝对网址：canonical、og:url、RSS 的 link 与 guid、
 * sitemap 的 loc、robots.txt 的 Sitemap。相对路径不受影响（所以样式和导航本来就是安全的）。
 *
 * 为什么不用 PowerShell 的 Get-Content/Set-Content 批量替换：
 * 在 Windows PowerShell 5.1 + 中文区域设置下，它默认按 GBK 读写文本文件，
 * 会把 UTF-8 的中文内容变成乱码（这个坑真的踩过）。这里所有读写都显式指定 UTF-8，
 * 不带 BOM。
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/* ---------- 1. 取新地址并规范化 ---------- */
const input = process.argv.slice(2).find((a) => !a.startsWith("-"));
if (!input) {
  console.error(`
✖ 缺少网址参数。

用法：
  node tools/set-domain.mjs https://你的域名
  node tools/set-domain.mjs https://用户名.github.io/仓库名

提示：项目站点必须带仓库名，例如 https://zjz-arc.github.io/personal-blog
`);
  process.exit(1);
}
if (!/^https?:\/\//.test(input)) {
  console.error(`✖ 网址要以 https:// 开头，收到的是 "${input}"`);
  process.exit(1);
}
const next = input.replace(/\/+$/, "") + "/"; // 统一成带结尾斜杠的形式

/* ---------- 2. 从首页 canonical 推导当前地址 ---------- */
const indexPath = join(rootDir, "index.html");
const indexHtml = readFileSync(indexPath, "utf8");
const currentCanonical = /<link[^>]+rel="canonical"[^>]+href="([^"]+)"/.exec(indexHtml)?.[1];
if (!currentCanonical) {
  console.error("✖ 在 index.html 里找不到 <link rel=\"canonical\">，无法确定当前地址");
  process.exit(1);
}
const current = currentCanonical.replace(/\/+$/, "") + "/";

if (current === next) {
  console.log(`\n当前地址已经是 ${current}，不需要改动。\n`);
  process.exit(0);
}

/* ---------- 3. 遍历所有文本文件做替换 ---------- */
const TEXT_EXT = new Set([".html", ".xml", ".txt"]);
const SKIP_DIRS = new Set([".git", "node_modules", "drafts"]);

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else yield full;
  }
}

// 先替换带结尾斜杠的长形式，再替换不带斜杠的短形式，顺序不能反
const oldForms = [current, current.replace(/\/$/, "")];
const newForms = [next, next.replace(/\/$/, "")];

let touched = 0;
let totalHits = 0;

for (const file of walk(rootDir)) {
  const ext = file.slice(file.lastIndexOf("."));
  if (!TEXT_EXT.has(ext)) continue;

  const before = readFileSync(file, "utf8");
  let after = before;
  let hits = 0;
  for (let i = 0; i < oldForms.length; i++) {
    if (!after.includes(oldForms[i])) continue;
    hits += after.split(oldForms[i]).length - 1;
    after = after.split(oldForms[i]).join(newForms[i]);
  }
  if (!after.includes(newForms[0]) && hits === 0) continue; // 文件里本来就没有网址
  if (after === before) continue;

  writeFileSync(file, after, "utf8"); // 显式 UTF-8，不带 BOM
  touched++;
  totalHits += hits;
  console.log(`  ${relative(rootDir, file).replace(/\\/g, "/")}  ${hits} 处`);
}

/* ---------- 4. 报告 ---------- */
console.log(`
✔ ${current}  ->  ${next}
  改动了 ${touched} 个文件，共 ${totalHits} 处绝对网址。
`);

if (touched === 0) {
  console.log("⚠ 一个文件都没改到。请确认当前地址是否真的是 " + current + "\n");
}

console.log(`下一步：
  node tools/check.mjs     # 确认全站地址一致、没有漏改
  git add . && git commit -m "chore: set site url to ${next}"
  git push                 # GitHub Pages 一两分钟后生效
`);

if (/github\.io/.test(next)) {
  console.log(`别忘了：改动仓库名之后，GitHub Pages 的分站地址也会变，
要在仓库 Settings -> Pages 重新确认发布分支。\n`);
}
