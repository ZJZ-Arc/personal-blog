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

二、发布

```powershell
git add .
git commit -m "post: 文章标题"
git push


---




