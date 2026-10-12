/* ==========================================================================
   Arc.desktop的小窝 —— 脚本
   四件事：
     1. 深浅色主题切换
     2. 首页按标签筛选
     3. 自动生成文章目录（右侧“目录”小部件，编号 1. / 1.1 …）
     4. 估算阅读时长
   没有依赖，也不用打包工具。
   ========================================================================== */

(function () {
  "use strict";

  /* ---------------------------------------------------------------------
     1. 主题切换
     <html data-theme="light|dark"> 是唯一真相，CSS 只认这个属性。
     手动切过就记进 localStorage；没切过就跟随系统，系统变了也跟着变。
     --------------------------------------------------------------------- */
  var THEME_KEY = "blog-theme";
  var root = document.documentElement;
  var media = window.matchMedia("(prefers-color-scheme: dark)");

  function storedTheme() {
    try {
      var v = localStorage.getItem(THEME_KEY);
      return v === "light" || v === "dark" ? v : null;
    } catch (e) {
      return null; // 隐私模式下 localStorage 可能抛异常
    }
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    var btn = document.querySelector("[data-theme-toggle]");
    if (btn) {
      var next = theme === "dark" ? "浅色" : "深色";
      btn.setAttribute("aria-label", "切换到" + next + "模式");
      btn.setAttribute("title", "切换到" + next + "模式");
      btn.setAttribute("aria-pressed", String(theme === "dark"));
    }
  }

  function initTheme() {
    var saved = storedTheme();
    applyTheme(saved || (media.matches ? "dark" : "light"));

    var btn = document.querySelector("[data-theme-toggle]");
    if (btn) {
      btn.addEventListener("click", function () {
        var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        applyTheme(next);
        try {
          localStorage.setItem(THEME_KEY, next);
        } catch (e) {
          /* 存不了就算了 */
        }
      });
    }

    var onSystemChange = function (e) {
      if (!storedTheme()) applyTheme(e.matches ? "dark" : "light");
    };
    if (typeof media.addEventListener === "function") media.addEventListener("change", onSystemChange);
    else if (typeof media.addListener === "function") media.addListener(onSystemChange);
  }

  /* ---------------------------------------------------------------------
     2. 按标签筛选（首页）
     列表项：<li class="post-item" data-tags="教程 前端">
     标签按钮：<button class="tag" data-tag="教程">
     状态放在 URL 的 ?tag= 里，便于分享与刷新。
     --------------------------------------------------------------------- */
  function initTagFilter() {
    var list = document.querySelector("[data-post-list]");
    if (!list) return;

    var items = Array.prototype.slice.call(list.querySelectorAll("[data-tags]"));
    var buttons = Array.prototype.slice.call(document.querySelectorAll("[data-tag]"));
    var empty = document.querySelector("[data-empty-state]");
    var status = document.querySelector("[data-filter-status]");
    var clear = document.querySelector("[data-clear-filter]");

    function matches(item, tag) {
      if (!tag) return true;
      return (item.getAttribute("data-tags") || "").split(/\s+/).indexOf(tag) !== -1;
    }

    function render(tag, updateUrl) {
      var shown = 0;
      items.forEach(function (item) {
        var ok = matches(item, tag);
        item.hidden = !ok;
        if (ok) shown++;
      });

      buttons.forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.getAttribute("data-tag") === (tag || "")));
      });

      if (empty) empty.hidden = shown !== 0;
      if (status) {
        status.textContent = tag ? "已筛选「" + tag + "」，共 " + shown + " 篇" : "共 " + shown + " 篇文章";
      }
      if (clear) clear.hidden = !tag;

      if (updateUrl) {
        var url = new URL(window.location.href);
        if (tag) url.searchParams.set("tag", tag);
        else url.searchParams.delete("tag");
        // 用 replaceState：点标签不算打开新页面，否则要按很多次返回键
        history.replaceState(null, "", url);
      }
    }

    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        var tag = b.getAttribute("data-tag");
        render(b.getAttribute("aria-pressed") === "true" ? "" : tag, true);
      });
    });

    if (clear) {
      clear.addEventListener("click", function (e) {
        e.preventDefault();
        render("", true);
      });
    }

    render(new URL(window.location.href).searchParams.get("tag") || "", false);
  }

  /* ---------------------------------------------------------------------
     3. 自动生成目录
     取正文里的 h2 / h3：h2 是一级，h3 是二级。
     编号（1. / 1.1 …）由 CSS 计数器完成，这里只负责生成嵌套的 ol/li。
     --------------------------------------------------------------------- */
  function slugify(text, used) {
    var base = text
      .trim()
      .replace(/[\s]+/g, "-")            // 空格 -> 连字符
      .replace(/[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~]/g, "") // 去掉标点
      .replace(/^-+|-+$/g, "")
      .toLowerCase();
    if (!base) base = "section";
    var id = base;
    var n = 2;
    while (used[id]) id = base + "-" + n++;
    used[id] = true;
    return id;
  }

  function initToc() {
    var content = document.querySelector(".article-content");
    var mount = document.querySelector("[data-toc]");
    var widget = document.querySelector("[data-toc-widget]");
    if (!content || !mount) return;

    var headings = Array.prototype.slice.call(content.querySelectorAll("h2, h3"));
    if (!headings.length) {
      if (widget) widget.hidden = true; // 没有小标题就别显示空目录
      return;
    }

    var used = {};
    var rootList = document.createElement("ol");
    var stack = [{ level: 2, list: rootList }];

    headings.forEach(function (h) {
      var level = h.tagName === "H2" ? 2 : 3;
      if (!h.id) h.id = slugify(h.textContent, used);
      else used[h.id] = true;

      // 悬停时标题左侧出现的 # 锚点
      var anchor = document.createElement("a");
      anchor.className = "header-anchor";
      anchor.href = "#" + h.id;
      anchor.setAttribute("aria-hidden", "true");
      h.insertBefore(anchor, h.firstChild);

      while (stack.length > 1 && stack[stack.length - 1].level >= level) stack.pop();
      var parent = stack[stack.length - 1];

      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = "#" + h.id;
      // 目录里的编号由 CSS 计数器生成，所以标题自带的中文序号（"一、"）要去掉，
      // 免得出现「1. 一、目录结构」这种双重编号
      var label = h.textContent.trim().replace(/^[一二三四五六七八九十百]+[、.．]\s*/, "");
      if (!label) label = h.textContent.trim();
      a.textContent = label;
      li.appendChild(a);
      parent.list.appendChild(li);

      if (level > parent.level) {
        var sub = document.createElement("ol");
        li.appendChild(sub);
        stack.push({ level: level, list: sub });
      }
    });

    mount.appendChild(rootList);

    // 滚动时高亮当前小节
    if ("IntersectionObserver" in window) {
      var links = {};
      Array.prototype.forEach.call(mount.querySelectorAll("a[href^='#']"), function (a) {
        links[decodeURIComponent(a.getAttribute("href").slice(1))] = a.parentElement;
      });
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            Object.keys(links).forEach(function (id) {
              links[id].classList.remove("active-class");
            });
            var li = links[entry.target.id];
            if (li) li.classList.add("active-class");
          });
        },
        { rootMargin: "0px 0px -75% 0px", threshold: 0 }
      );
      headings.forEach(function (h) { io.observe(h); });
    }
  }

  /* ---------------------------------------------------------------------
     4. 阅读时长
     中文按 400 字/分钟、英文按 200 词/分钟粗估，最少 1 分钟。
     --------------------------------------------------------------------- */
  function initReadingTime() {
    var slots = document.querySelectorAll("[data-reading-time]");
    if (!slots.length) return;
    var content = document.querySelector(".article-content");
    if (!content) return;

    var text = content.textContent || "";
    var cjk = (text.match(/[\u4e00-\u9fa5\u3040-\u30ff]/g) || []).length;
    var words = (text.replace(/[\u4e00-\u9fa5\u3040-\u30ff]/g, " ").match(/[A-Za-z0-9']+/g) || []).length;
    var minutes = Math.max(1, Math.round(cjk / 400 + words / 200));

    Array.prototype.forEach.call(slots, function (el) { el.textContent = String(minutes); });
  }

  /* ------------------------------------------------------------------ 启动 */
  function boot() {
    initTheme();
    initTagFilter();
    initToc();
    initReadingTime();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
