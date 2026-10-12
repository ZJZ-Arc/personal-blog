# 我的博客 —— 纯 HTML / CSS / JavaScript


## 一、目录结构

```
personal-blog/
├── index.html          # 首页：自我介绍 + 标签栏 + 文章列表
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
│   └── check.mjs       # 发布前自检：断链、标签计数、RSS、sitemap（可选但强烈建议）
├── assets/
│   ├── style.css       # 所有样式；颜色是 CSS 变量，深色模式只是换一组变量
│   └── main.js         # 主题切换 + 标签筛选
├── drafts/             # 你的草稿（已在 .gitignore 里，不会被发布）
├── feed.xml            # RSS 订阅源
├── sitemap.xml         # 页面清单，给搜索引擎
├── robots.txt
├── .nojekyll           # 空文件：告诉 GitHub Pages 别用 Jekyll 处理我的文件
└── README.md
```

---

## 二、发文章（AI生成）

### 第 1 步：生成页面

**自动方式**（推荐，会自动推导文件名、生成标签链接）：

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

零依赖方案的代价就是这一步，熟练后两分钟搞定：

- [ ] `index.html` —— 在文章列表**最上面**加一个 `<li class="post-item" data-tags="教程 工具">`
      （`data-tags` 决定标签筛选能不能筛到它）
- [ ] `index.html` 的标签栏 + `tags.html` —— 出现新标签时各加一条，并更新计数
- [ ] `feed.xml` —— 加一个 `<item>`，更新 `<lastBuildDate>`
- [ ] `sitemap.xml` —— 加一个 `<url>`
- [ ] 跑一遍 `node tools/check.mjs`，让机器替你确认上面四条都没漏（下面第 4 步详述）

> 运行 `new-post.mjs` 时，终端会直接打印好第 1 项要粘贴的 `<li>` 代码，复制即可。

### 第 4 步：本地自测

先让机器查一遍——这条命令就是为零依赖方案的「手工容易漏」而写的：

```powershell
node tools/check.mjs
```

它会检查断链、首页与 tags.html 的标签计数是否和真实文章数一致、feed.xml 与 sitemap.xml 是否漏了文章、
每个页面的 canonical / og / 主题脚本顺序是否齐全。全通过时退出码为 0，有问题时逐条列出并返回 1。

然后再用眼睛确认一遍：双击 `index.html`，依次看深色/浅色切换、标签筛选、点进文章、返回首页、导航高亮。

### 第 5 步：发布

```powershell
git add .
git commit -m "post: 文章标题"
git push
```

推上去后 GitHub Pages 会自动重新构建，通常 1 分钟内生效。

---



### 4.3 开启 Pages

1. 打开仓库页面 → **Settings**（设置）
2. 左侧找到 **Pages**
3. **Source** 选 `Deploy from a branch`
4. **Branch** 选 `main`，目录选 `/ (root)`，点 **Save**
5. 等 1–2 分钟，刷新这个页面，顶部会出现你的网址

打不开时先看仓库的 **Actions** 标签页，构建失败的日志都在那里。

### 4.4 换成自己的域名（可选）

1. 在域名服务商处添加 DNS 记录：
   - 根域名（`example.com`）：4 条 A 记录指向 `185.199.108.153`、`185.199.109.153`、`185.199.110.153`、`185.199.111.153`
   - `www` 子域：一条 CNAME 指向 `你的用户名.github.io`
2. 在仓库 **Settings → Pages → Custom domain** 填入你的域名并 Save
3. 勾选 **Enforce HTTPS**（证书签发可能要等十几分钟）
4. 在项目根目录新建一个名为 `CNAME` 的文件（没有扩展名），内容只有一行你的域名

### 4.5 把占位域名换掉

部署到真实网址后，把下面这些文件里的 `https://example.com` 全部替换成你的网址，
搜索引擎和 RSS 阅读器才能正确识别：

- 所有 HTML 的 `<link rel="canonical">`、`og:url`
- `feed.xml` 的 `<link>`、`<guid>`、`<atom:link>`
- `sitemap.xml` 的所有 `<loc>`
- `robots.txt` 的 `Sitemap:`

一次性替换（把域名换成你自己的）：

```powershell
Get-ChildItem -Recurse -Include *.html,*.xml,*.txt |
  ForEach-Object {
    (Get-Content $_.FullName -Raw).Replace('https://example.com', 'https://你的域名') |
      Set-Content $_.FullName -NoNewline
  }
```

---

## 五、改成你自己的样子

| 想改什么 | 改哪里 |
| --- | --- |
| 站名 | 每个页面里的 `<span class="brand">我的博客</span>`、`<title>`、`og:site_name` |
| 首页自我介绍 | `index.html` 的 `<section class="hero">` |
| 关于页 | `about.html` |
| 主色、圆角、宽度 | `assets/style.css` 顶部的 CSS 变量（`--accent`、`--radius`、`--maxw`） |
| 深色配色 | `assets/style.css` 的 `:root[data-theme="dark"]` |
| 页脚版权 | 各页面的 `<footer class="site-footer">` |

改主色只需要动一行：`--accent: #2563eb;` 换成你喜欢的颜色即可，深浅色会自动对应。

---

## 六、常见问题

**样式没生效 / 页面变成纯文本**
检查 `assets/style.css` 的路径。注意 **GitHub Pages 区分文件名大小写，Windows 不区分**——
本地写 `Style.css` 能跑，推上去就 404。统一用小写文件名。

**新文章推上去了但网页没变**
先等 1–2 分钟（构建需要时间），再强制刷新（`Ctrl+F5`）绕开浏览器缓存。
还不行就看仓库 Actions 标签页的构建日志。

**点标签没有筛选效果**
说明 `assets/main.js` 没加载成功，或者列表项的 `data-tags` 没写。
在浏览器控制台（`F12`）看有没有红色报错。

**RSS 阅读器报格式错误**
`feed.xml` 是 XML，标签必须成对闭合，`&` 要写成 `&amp;`。
改完可以拖进浏览器直接打开验证——能正常显示树状结构就是合法的。

**文章里的中文标题/标签会有问题吗**
没有。标签链接里的中文由 JS 自动做了 URL 编码；但**文件名建议只用英文小写和连字符**，
可以避免各种平台间的编码差异。

---

## 七、什么时候该换框架

出现下面任一情况，说明这套手写方案到瓶颈了：

- 每次发文要改 4 个以上文件，而且你开始因此拖延写作
- 需要复用组件、代码高亮、图片自动压缩、草稿与定时发布、多语言

那时推荐迁移到 [Astro](https://astro.build/)：把每个 `posts/*.html` 的正文搬进 `.md` 文件，
把 `index.html` 的列表改成遍历，其余（CSS 变量、RSS、部署方式）都能原样保留。
你现在写的内容一个字都不会浪费，因为它们本来就是 HTML。

在那之前，`node tools/check.mjs` 已经足够撑起「质量门」：它退出码非 0 就说明有问题，
所以也可以直接接到 GitHub Actions 里，每次 push 自动跑一遍。
