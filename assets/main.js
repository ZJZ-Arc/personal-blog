/* ==========================================================================
   个人博客脚本
   两件事：1) 深浅色主题切换  2) 首页按标签筛选文章
   没有任何依赖，写成普通 <script> 就能跑（不用打包工具）。
   ========================================================================== */

(function () {
  "use strict";

  /* ---------------------------------------------------------------------
     第一部分：主题切换
     原则：<html data-theme="light|dark"> 是唯一真相，CSS 只认这个属性。
     用户手动切过就记在 localStorage；没切过就跟随系统，并且系统变了也跟着变。
     --------------------------------------------------------------------- */
  var THEME_KEY = "blog-theme";
  var root = document.documentElement;
  var media = window.matchMedia("(prefers-color-scheme: dark)");

  function storedTheme() {
    try {
      var v = localStorage.getItem(THEME_KEY);
      return v === "light" || v === "dark" ? v : null;
    } catch (e) {
      // 隐私模式下 localStorage 可能抛异常，忽略即可
      return null;
    }
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    var btn = document.querySelector("[data-theme-toggle]");
    if (btn) {
      var next = theme === "dark" ? "浅色" : "深色";
      btn.setAttribute("aria-label", "切换到" + next + "模式");
      btn.setAttribute("title", "切换到" + next + "模式");
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
          /* 存不了就算了，本次会话内仍然可用 */
        }
      });
    }

    // 用户没有手动选择过时，跟随系统主题的变化实时切换
    var onSystemChange = function (e) {
      if (!storedTheme()) applyTheme(e.matches ? "dark" : "light");
    };
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", onSystemChange);
    } else if (typeof media.addListener === "function") {
      media.addListener(onSystemChange); // 老浏览器兜底
    }
  }

  /* ---------------------------------------------------------------------
     第二部分：按标签筛选
     页面上：每个 <li class="post-item" data-tags="教程 前端">，
     标签按钮：<button class="tag" data-tag="教程">。
     筛选状态放在 URL 的 ?tag= 里，这样标签页可以直接链接过来，也能分享/收藏。
     --------------------------------------------------------------------- */
  function initTagFilter() {
    var list = document.querySelector("[data-post-list]");
    if (!list) return; // 这篇文章页没有列表，直接跳过

    var items = Array.prototype.slice.call(
      list.querySelectorAll("[data-tags]")
    );
    var buttons = Array.prototype.slice.call(
      document.querySelectorAll("[data-tag]")
    );
    var empty = document.querySelector("[data-empty-state]");
    var status = document.querySelector("[data-filter-status]");
    var clear = document.querySelector("[data-clear-filter]");

    function matches(item, tag) {
      if (!tag) return true;
      var tags = (item.getAttribute("data-tags") || "").split(/\s+/);
      return tags.indexOf(tag) !== -1;
    }

    function render(tag, updateUrl) {
      var shown = 0;
      items.forEach(function (item) {
        var ok = matches(item, tag);
        item.hidden = !ok;
        if (ok) shown++;
      });

      buttons.forEach(function (btn) {
        btn.setAttribute("aria-pressed", String(btn.getAttribute("data-tag") === (tag || "")));
      });

      if (empty) empty.hidden = shown !== 0;
      if (status) {
        status.textContent = tag
          ? "已筛选标签“" + tag + "”，共 " + shown + " 篇文章"
          : "共 " + shown + " 篇文章";
      }
      if (clear) clear.hidden = !tag;

      if (updateUrl) {
        var url = new URL(window.location.href);
        if (tag) url.searchParams.set("tag", tag);
        else url.searchParams.delete("tag");
        // 用 replaceState 而不是 pushState：点标签不算“打开新页面”，
        // 不然用户要按好多次返回键才能退出这个站。
        history.replaceState(null, "", url);
      }
    }

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var tag = btn.getAttribute("data-tag");
        // 再点一次同一个标签 = 取消筛选
        var next = btn.getAttribute("aria-pressed") === "true" ? "" : tag;
        render(next, true);
      });
    });

    if (clear) {
      clear.addEventListener("click", function (e) {
        e.preventDefault();
        render("", true);
      });
    }

    var initial = new URL(window.location.href).searchParams.get("tag") || "";
    render(initial, false);
  }

  /* ---------------------------------------------------------------------
     启动
     DOM 还没解析完时先等；脚本放在 </body> 前，通常已经是 readyState=loading 之外
     --------------------------------------------------------------------- */
  function boot() {
    initTheme();
    initTagFilter();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
