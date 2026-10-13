# Arc.desktop的小窝 —— 纯 HTML / CSS / JavaScript

**线上地址：** https://zjz-arc.github.io/personal-blog/
（仓库 `ZJZ-Arc/personal-blog`，GitHub Pages 从 `main` 分支根目录发布。
改仓库名或绑自定义域名后要同步站点地址，做法见下方 4.5。）

## 一、目录结构

```
personal-blog/
├── index.html          # 首页：自我介绍 + 标签筛选 + 文章列表
├── tags.html           # 所有标签的总览页
├── about.html          # 关于我
├── posts/              # 每篇文章一个 HTML 文件
│   ├── hello-world.html
│   ├── how-this-blog-works.html
│   └── writing-workflow.html
├── templates/
│   └── post.html       # 新文章模板（含 {{占位符}}）
├── tools/
│   ├── new-post.mjs    # 一条命令生成新文章骨架（可选）
│   ├── check.mjs       # 发布前自检：断链、标签计数、RSS、sitemap（可选但强烈建议）
│   └── set-domain.mjs  # 换站点地址时一次性改完全部绝对网址（可选）
├── assets/
│   ├── style.css       # 所有样式；颜色是 CSS 变量，深色模式只是换一组变量
│   ├── main.js         # 主题切换 + 标签筛选 + 自动目录 + 阅读时长
│   └── avatar.jpg      # 左侧栏头像（320×320 方形；换头像直接替换这个文件）
├── drafts/             # 你的草稿（已在 .gitignore 里，不会被发布）
├── feed.xml            # RSS 订阅源
├── sitemap.xml         # 页面清单，给搜索引擎
├── robots.txt
├── .nojekyll           # 空文件：告诉 GitHub Pages 别用 Jekyll 处理我的文件
└── README.md
```

---

## 二、发文章

```powershell
node tools/new-post.mjs --title "文章标题" --tags "教程 工具" --summary "一句话摘要，会出现在首页卡片上"
```

可选参数：

| 参数 | 说明 |
| --- | --- |
| `--date 2026-10-12` | 发布日期，默认今天 |
| `--slug my-post` | 文件名，默认由标题推导；纯中文标题会退化为 `post-YYYYMMDD` |
| `--body body.html` | 把转换好的 HTML 片段直接塞进正文位置 |
| `--draft` | 只生成到 `drafts/` 目录，不放进 `posts/` |

**手动方式**：把 `templates/post.html` 复制到 `posts/` 下并改名，然后替换所有 `{{...}}`。
改完搜索一下 `{{`，确认没有漏掉的占位符。

### 第 2 步：写正文

打开生成的 `posts/你的文件名.html`，找到注释 `✍️ 正文贴在这里`，把内容换成你的。
正文可用的样式（都写在 `assets/style.css` 里）：

```html
<h2>二级标题</h2>
<h3>三级标题</h3>
<p>段落。</p>
<ul><li>无序列表</li></ul>
<ol><li>有序列表</li></ol>
<blockquote>引用。</blockquote>
<pre><code>代码块</code></pre>
<p>行内代码：<code>var(--bg)</code></p>
<hr>
<table><tr><th>表头</th></tr><tr><td>单元格</td></tr></table>
```

### 第 3 步：更新这四个文件

- [ ] `index.html` —— 在文章列表**最上面**加一个 `<li class="post-item" data-tags="教程 工具">`
- [ ] `index.html` 的标签栏 + `tags.html` —— 出现新标签时各加一条，并更新计数
- [ ] `feed.xml` —— 加一个 `<item>`，更新 `<lastBuildDate>`
- [ ] `sitemap.xml` —— 加一个 `<url>`
- [ ] 跑一遍 `node tools/check.mjs`，二次确认上面四条都没漏

> 运行 `new-post.mjs` 时，终端会直接打印好第 1 项要粘贴的 `<li>` 代码。

### 第 4 步：本地自测

先检查

```powershell
node tools/check.mjs
```

用以检查断链、首页与 tags.html 的标签计数是否和真实文章数一致、feed.xml 与 sitemap.xml 是否漏了文章、
每个页面的 canonical / og / 主题脚本顺序是否齐全。全通过时退出码为 0，有问题返回1
双击 `index.html`，依次看深色/浅色切换、标签筛选、点进文章、返回首页、导航高亮。

### 第 5 步：发布

```powershell
git add .
git commit -m "post: 文章标题"
git push


---




