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



## 四、部署与站点地址

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

### 4.5 站点地址（绝对网址）

链接（`<a href>`、`<link rel="stylesheet">`）全是相对路径，所以换域名、换仓库名都不影响页面能不能打开。
但有一类地址**必须是完整网址**，写错了搜索引擎和 RSS 阅读器就会认错：

- 所有 HTML 的 `<link rel="canonical">`、`og:url`
- `feed.xml` 的 `<link>`、`<guid>`、`<atom:link>`
- `sitemap.xml` 的所有 `<loc>`
- `robots.txt` 的 `Sitemap:`

**关键规则：项目站点要带仓库名。** 本站仓库是 `ZJZ-Arc/personal-blog`，
所以站点根地址是（注意结尾的 `/`）：

```
https://zjz-arc.github.io/personal-blog/
```

不是 `https://zjz-arc.github.io/`（那是账号主页的地址）。
只有仓库名取成 `用户名.github.io` 时，地址才是域名根路径。

换成新地址用项目自带的脚本，它一次性改完上面四个地方，并且用的是首页 canonical 里记录的旧地址：

```powershell
# 改仓库名之前先想清楚新地址；脚本会把旧的绝对网址全部替换掉
node tools/set-domain.mjs https://你的用户名.github.io/你的仓库名

# 然后让自检脚本确认全站地址一致、没有漏改
node tools/check.mjs
```

> **别用 PowerShell 的 `Get-Content` / `Set-Content` 批量替换。**
> 在 Windows PowerShell 5.1 + 中文区域设置下，它默认按 GBK 读写文本文件，
> 会把文件里的中文变成乱码（还会加 BOM）——这个坑在这个项目上真的踩过一次，
> 十个文件全变乱码。`tools/set-domain.mjs` 用 Node 显式读写 UTF-8，不会有这个问题。
> 如果你习惯用编辑器，VS Code 的「在文件中替换」也是安全的。

---

## 五、改成你自己的样子

页面版式是「左侧导航 + 中间卡片 + 右侧目录」三栏（样式参照 Hugo 的 Stack 主题）。
下面是最常改的几处：

| 想改什么 | 改哪里 |
| --- | --- |
| 站名 | 每个页面左侧栏的 `<div class="site-name">…</div>`、`<title>`、`og:site_name` |
| 站点副标题 | 每个页面左侧栏的 `<div class="site-description">记录与折腾</div>` |
| 头像 | 替换 `assets/avatar.jpg`（方形图最好，CSS 会自动裁成圆形；建议 ≥320×320） |
| 背景色（蓝） | `assets/style.css` 的 `--body-background`：浅色 `#d8e9fb`、深色 `#24405e` |
| 左侧选项卡配色（粉） | `assets/style.css` 的 `--sidebar-menu-color`（悬停/当前页用 `--sidebar-menu-color-hover`）：浅色 `#c2255c`、深色 `#ff9ecb` |
| 头像右下角的小表情 | 每个页面里的 `<span class="emoji">💻</span>`，不想要就整行删掉 |
| 首页自我介绍 | `index.html` 里第一张卡片（`<h1 class="article-title">` 和它的 `article-subtitle`） |
| 关于页 | `about.html` 的 `.article-content` 一段 |
| 社交图标 | 左侧栏的 `<ol class="menu-social">` |
| 导航菜单 | 每个页面的 `<nav id="main-menu">`（图标是内联 SVG，文字在 `<span>` 里） |
| 主色 / 卡片圆角 / 卡片内边距 | `assets/style.css` 的 `--accent-color`、`--card-border-radius`、`--card-padding` |
| 正文宽度 | `assets/style.css` 的 `--right-sidebar-max-width`（右栏占比，正文随剩余宽度伸缩） |
| 深色配色 | `assets/style.css` 的 `:root[data-theme="dark"]` 一段 |
| 标签颜色 | 各页面里 chip 的内联 `style="background-color:#…"`（另见 `tools/new-post.mjs` 里的 `TAG_COLORS`） |
| 页脚版权 | 各页面里的 `<footer class="site-footer">` |

改主色只需要动一行：`--accent-color: #34495e;` 换成你喜欢的颜色即可，深浅色会自动对应。

三样东西是**自动**的，不用手写：

- **右侧目录**：`assets/main.js` 扫描正文的 `h2` / `h3` 生成，编号（1. / 1.1 …）由 CSS 计数器完成；文章没有小标题时目录会自己隐藏。
- **阅读时长**：按中文 400 字/分钟、英文 200 词/分钟估算，填进 `[data-reading-time]`。
- **深色模式**：跟随系统，手动切过就记住选择（存在 `localStorage` 的 `blog-theme`）。

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
