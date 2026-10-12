#!/usr/bin/env node
/**
 * 生成一篇新文章的骨架 —— 零依赖，只用 Node 自带模块。
 *
 * 用法：
 *   node tools/new-post.mjs --title "文章标题" --tags "教程 工具" \
 *                           --summary "一句话摘要，会出现在首页卡片上"
 *
 * 可选参数：
 *   --date  2026-10-12      默认今天
 *   --slug  my-post-name    默认由标题推导；纯中文标题会退化为 post-YYYYMMDD
 *   --body  body.html       把这个文件的 HTML 直接塞进正文位置
 *   --draft                 只生成到 drafts/ 目录，不放进 posts/
 *
 * 它做的事：读 templates/post.html → 替换 {{占位符}} → 写到 posts/<slug>.html
 * 它不做的事：不改 index.html / tags.html / feed.xml / sitemap.xml
 *            （脚本会把这些待办打印出来提醒你）
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/* ---------- 1. 定位项目根目录：脚本在 tools/ 下，往上一层就是根目录 ---------- */
const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, "..");

/* ---------- 2. 解析命令行参数 ---------- */
function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token.startsWith("--")) {
      const eq = token.indexOf("=");
      if (eq !== -1) {
        out[token.slice(2, eq)] = token.slice(eq + 1);
      } else {
        const key = token.slice(2);
        const next = argv[i + 1];
        if (next === undefined || next.startsWith("--")) {
          out[key] = true; // 布尔开关，比如 --draft
        } else {
          out[key] = next;
          i++;
        }
      }
    } else {
      out._.push(token);
    }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));

/* ---------- 3. 小工具函数 ---------- */
const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const pad = (n) => String(n).padStart(2, "0");

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 2026-10-08 → 2026 年 10 月 8 日 */
function toDisplayDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${m[1]} 年 ${Number(m[2])} 月 ${Number(m[3])} 日`;
}

/** 把标题变成文件名：只保留 ASCII 字母数字，其余变连字符 */
function slugify(title) {
  const s = String(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s;
}

function uniquePath(dir, base) {
  let candidate = join(dir, `${base}.html`);
  let n = 2;
  while (existsSync(candidate)) {
    candidate = join(dir, `${base}-${n}.html`);
    n++;
  }
  return candidate;
}

function die(msg) {
  console.error(`\n✖ ${msg}\n`);
  console.error(`用法示例：\n  node tools/new-post.mjs --title "我的第一篇" --tags "随想 博客" --summary "一句话摘要"\n`);
  process.exit(1);
}

/* ---------- 4. 校验必填参数 ---------- */
const title = typeof args.title === "string" ? args.title.trim() : "";
const summary = typeof args.summary === "string" ? args.summary.trim() : "";
if (!title) die("缺少 --title（文章标题）");
if (!summary) die("缺少 --summary（摘要，会显示在首页卡片和搜索结果里）");

const isoDate = typeof args.date === "string" ? args.date : todayIso();
if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) die(`--date 格式应为 YYYY-MM-DD，收到的是 "${isoDate}"`);

const tags = (typeof args.tags === "string" ? args.tags : "")
  .split(/[\s,，、]+/)
  .map((t) => t.trim())
  .filter(Boolean);

/* ---------- 5. 决定输出文件 ---------- */
const slugSource = typeof args.slug === "string" ? args.slug : slugify(title);
const base = slugSource || `post-${isoDate.replace(/-/g, "")}`;
const outDir = args.draft ? join(rootDir, "drafts") : join(rootDir, "posts");
mkdirSync(outDir, { recursive: true });
const outFile = uniquePath(outDir, base);
const finalSlug = outFile.slice(outDir.length + 1).replace(/\.html$/, "");

/* ---------- 6. 读模板并替换占位符 ---------- */
const templatePath = join(rootDir, "templates", "post.html");
if (!existsSync(templatePath)) die(`找不到模板文件：${templatePath}`);

// 标签链接：href 里的中文要转义成 %E6%95%99%E7%A8%8B 这种形式才安全
const tagLinks = tags.length
  ? tags
      .map(
        (t) =>
          `<a class="tag" href="../index.html?tag=${encodeURIComponent(t)}">${escapeHtml(t)}</a>`
      )
      .join("\n          ")
  : `<a class="tag" href="../index.html">未分类</a>`;

let html = readFileSync(templatePath, "utf8")
  .replaceAll("{{TITLE}}", escapeHtml(title))
  .replaceAll("{{SUMMARY}}", escapeHtml(summary))
  .replaceAll("{{SLUG}}", escapeHtml(finalSlug))
  .replaceAll("{{DATE}}", isoDate)
  .replaceAll("{{DATE_DISPLAY}}", toDisplayDate(isoDate))
  .replaceAll("{{TAG_LINKS}}", tagLinks);

/* ---------- 7. 可选：把 --body 指定的 HTML 片段塞进正文 ---------- */
if (typeof args.body === "string") {
  const bodyPath = resolve(process.cwd(), args.body);
  if (!existsSync(bodyPath)) die(`--body 指定的文件不存在：${bodyPath}`);
  const bodyHtml = readFileSync(bodyPath, "utf8").trim();
  const marker = /<p>在这里写第一段。<\/p>/;
  if (!marker.test(html)) die("模板里的正文占位段落找不到了，请检查 templates/post.html 是否被改动");
  html = html.replace(marker, bodyHtml);
}

/* ---------- 8. 收尾检查：确认没有漏掉的占位符 ---------- */
const leftovers = html.match(/\{\{[A-Z_]+\}\}/g);
if (leftovers) {
  console.warn(`⚠ 模板里还有未替换的占位符：${[...new Set(leftovers)].join(", ")}`);
}

writeFileSync(outFile, html, "utf8");
const rel = outFile.slice(rootDir.length + 1).replace(/\\/g, "/");

/* ---------- 9. 打印结果和待办清单 ---------- */
console.log(`
✔ 已生成 ${rel}
  标题：${title}
  日期：${isoDate}
  标签：${tags.length ? tags.join("、") : "（无）"}
`);

if (outDir === join(rootDir, "drafts")) {
  console.log(`这是草稿，还在 drafts/ 里，不会被发布。写完后：
  1. 把文件移到 posts/ 目录
  2. 照下面的清单更新其他文件
`);
}

console.log(`接下来还要手动做这几件事（零依赖方案的代价，约两分钟）：

  1. 在 index.html 的文章列表顶部加一个 <li>：
     <li class="post-item" data-tags="${tags.join(" ")}">
       <a class="post-card" href="posts/${finalSlug}.html">
         <h3>${title}</h3>
         <p class="summary">${summary}</p>
         <div class="post-meta">
           <time datetime="${isoDate}">${toDisplayDate(isoDate)}</time>
           <span class="dot">·</span>
           <span class="tags">${tags.map((t) => `<span class="tag">${t}</span>`).join("")}</span>
         </div>
       </a>
     </li>

  2. 如果有新标签，在 index.html 的标签栏和 tags.html 里各加一条，并更新计数
  3. 在 feed.xml 里加一个 <item>，并更新 <lastBuildDate>
  4. 在 sitemap.xml 里加一个 <url>
  5. 双击 index.html 自测：深色/浅色、标签筛选、文章页返回
  6. git add . && git commit -m "post: ${title}" && git push

提示：正文在 ${rel} 里，搜索 "在这里写第一段" 就能找到位置。`);
