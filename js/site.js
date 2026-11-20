/* Muhammad Faisal portfolio: theme, language, menu, contact links and form.
   No external libraries. */
(function () {
  "use strict";
  var root = document.documentElement;
  var S = window.SITE || {};
  var RTL = { ar: 1, fa: 1, ur: 1 };
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------- Theme (smooth light/dark switch, remembered) ---------- */
  var themeBtn = $("#theme");
  function setTheme(t) {
    root.classList.add("theme-anim");
    root.setAttribute("data-theme", t);
    store.set("theme", t);
    themeBtn && themeBtn.setAttribute("aria-pressed", t === "dark");
    var m = $('meta[name="theme-color"]'); if (m) m.setAttribute("content", t === "dark" ? "#000025" : "#101B2D");
    setTimeout(function () { root.classList.remove("theme-anim"); }, 500);
  }
  themeBtn && themeBtn.addEventListener("click", function () {
    setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
  });
  themeBtn && themeBtn.setAttribute("aria-pressed", root.getAttribute("data-theme") === "dark");

  /* ---------- Mobile menu ---------- */
  var menu = $("#menu"), nav = $("#nav");
  if (menu && nav) {
    menu.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      menu.setAttribute("aria-expanded", open);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) { nav.classList.remove("open"); menu.setAttribute("aria-expanded", "false"); menu.focus(); }
    });
  }

  /* ---------- Contact links from config ---------- */
  function applyLinks() {
    $$('[data-link="email"]').forEach(function (a) { a.href = "mailto:" + S.email; if (/@/.test(a.textContent)) a.textContent = S.email; });
    $$('[data-link="phone"]').forEach(function (a) { a.href = "tel:" + S.phoneDial; if (/\d/.test(a.textContent)) a.textContent = S.phoneDisplay; });
    $$('[data-link="whatsapp"]').forEach(function (a) {
      a.href = "https://wa.me/" + S.whatsapp + "?text=" + encodeURIComponent(S.whatsappMessage || "");
    });
    $$('[data-link="cv"]').forEach(function (a) { if (S.cvFile) a.href = S.cvFile; });
    $$('[data-link="profile"]').forEach(function (a) { if (S.profileFile) a.href = S.profileFile; });
    var hasIn = !!(S.linkedin && /^https:\/\//.test(S.linkedin));
    $$('[data-link="linkedin"]').forEach(function (a) { if (hasIn) { a.href = S.linkedin; a.hidden = false; } });
    $$('[data-link-wrap="linkedin"]').forEach(function (w) { w.hidden = !hasIn; });
  }
  applyLinks();

  /* ---------- Language ---------- */
  var sel = $("#lang");
  window.I18N = window.I18N || {};
  function t(key, fallback) {
    var d = window.I18N[currentLang];
    return (d && d[key]) || fallback;
  }
  var currentLang = "en";
  function stash() {
    $$("[data-i18n]").forEach(function (el) { if (el.dataset.en === undefined) el.dataset.en = el.textContent; });
    $$("[data-i18n-attr]").forEach(function (el) {
      if (el.dataset.enAttr !== undefined) return;
      var o = {};
      el.getAttribute("data-i18n-attr").split("|").forEach(function (p) { var a = p.split(":")[0]; o[a] = el.getAttribute(a); });
      el.dataset.enAttr = JSON.stringify(o);
    });
  }
  function apply(lang) {
    var d = window.I18N[lang] || {};
    currentLang = lang;
    stash();
    $$("[data-i18n]").forEach(function (el) {
      var k = el.getAttribute("data-i18n");
      el.textContent = (lang !== "en" && d[k]) ? d[k] : el.dataset.en;
    });
    $$("[data-i18n-attr]").forEach(function (el) {
      var en = JSON.parse(el.dataset.enAttr);
      el.getAttribute("data-i18n-attr").split("|").forEach(function (p) {
        var bits = p.split(":"), a = bits[0], k = bits[1];
        el.setAttribute(a, (lang !== "en" && d[k]) ? d[k] : en[a]);
      });
    });
    root.setAttribute("lang", lang);
    root.setAttribute("dir", RTL[lang] ? "rtl" : "ltr");
    if (sel) sel.value = lang;
    store.set("lang", lang);
    if (RTL[lang] && !$("#arfont")) {
      var l = document.createElement("link"); l.id = "arfont"; l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;600&family=Noto+Nastaliq+Urdu:wght@400;600&display=swap";
      document.head.appendChild(l);
    }
  }
  function setLang(lang) {
    if (lang === "en" || window.I18N[lang]) { apply(lang); return; }
    var s = document.createElement("script");
    s.src = "js/lang/" + lang + ".js";
    s.onload = function () { apply(lang); };
    s.onerror = function () { apply("en"); };
    document.head.appendChild(s);
  }
  sel && sel.addEventListener("change", function () { setLang(sel.value); });
  var saved = store.get("lang");
  if (saved && saved !== "en" && sel && sel.querySelector('option[value="' + saved + '"]')) setLang(saved);

  /* ---------- Contact form ---------- */
  var form = $("#contact-form");
  if (form) {
    var status = $("#form-status"), tf = $("#f-time"), started = Date.now();
    if (tf) tf.value = String(started);
    function say(k, fb) { status.textContent = t(k, fb); status.classList.add("show"); }
    function valid() {
      var n = form.name.value.trim(), e = form.email.value.trim(), m = form.message.value.trim();
      return n && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) && m;
    }
    function mailto() {
      var subj = form.subject.value.trim() || "Website enquiry from " + form.name.value.trim();
      var body = form.message.value.trim() + "\n\n" + form.name.value.trim() + "\n" + form.email.value.trim();
      location.href = "mailto:" + S.email + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(body);
    }
    $("#mail-fallback").addEventListener("click", function () {
      if (!valid()) { say("js.fill", "Please enter your name, a valid email address and a message."); return; }
      mailto();
    });
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (!valid()) { say("js.fill", "Please enter your name, a valid email address and a message."); return; }
      if (location.protocol === "file:") { say("js.off", "The message form is not active on this website yet. Please use the email button, which opens your email app with your message ready."); return; }
      var fd = new FormData(form);
      fetch(S.formEndpoint || "contact.php", { method: "POST", body: fd, headers: { "Accept": "application/json" } })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (x) {
          if (x.ok && x.j && x.j.ok) { say("js.ok", "Thank you. Your message has been sent."); form.reset(); }
          else if (x.j && x.j.error === "not_configured") say("js.off", "The message form is not active on this website yet. Please use the email button, which opens your email app with your message ready.");
          else say("js.err", "The message could not be sent. Please try again or use the email button.");
        })
        .catch(function () { say("js.off", "The message form is not active on this website yet. Please use the email button, which opens your email app with your message ready."); });
    });
  }

  /* ---------- Motion: scroll reveal, count-up, header shadow, reading progress ---------- */
  (function () {
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var bar = document.createElement("div"); bar.className = "progress"; bar.setAttribute("aria-hidden", "true"); document.body.appendChild(bar);
    var head = $(".site-header"), ticking = false;
    function onScroll() {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        var h = document.documentElement, max = h.scrollHeight - h.clientHeight;
        bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, h.scrollTop / max) : 0) + ")";
        head && head.classList.toggle("scrolled", h.scrollTop > 12);
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
    if (reduce || !("IntersectionObserver" in window)) return;
    root.classList.add("js");
    var rsel = ".side, .main > *:not(.rows):not(.timeline), .rows > li, .tl-item, .teasers a, .ledger, section > .wrap > h2, .cta .wrap > *";
    var els = $$(rsel).filter(function (e) { return !e.closest(".hero") && !e.closest(".page-head") && !e.closest("header") && !e.closest(".site-footer"); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var e = en.target; io.unobserve(e); e.classList.add("in");
        setTimeout(function () { e.classList.remove("reveal", "in"); e.style.removeProperty("--d"); }, 1100);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    els.forEach(function (e) {
      var sib = e.parentElement ? Array.prototype.indexOf.call(e.parentElement.children, e) : 0;
      e.style.setProperty("--d", Math.min(sib, 6) * 70 + "ms");
      e.classList.add("reveal"); io.observe(e);
    });
    /* count-up for the headline number (the final text stays 20+) */
    var big = $(".big");
    if (big) {
      var m = big.textContent.match(/^(\d+)(\D*)$/);
      if (m) {
        var target = +m[1], suffix = m[2];
        big.textContent = "0" + suffix;
        var cio = new IntersectionObserver(function (en) {
          if (!en[0].isIntersecting) return; cio.disconnect();
          var t0 = performance.now(), dur = 1300;
          (function tick(t) {
            var k = Math.min(1, (t - t0) / dur), v = Math.round(target * (1 - Math.pow(1 - k, 3)));
            big.textContent = v + suffix; if (k < 1) requestAnimationFrame(tick);
          })(t0);
        }, { threshold: 0.4 });
        cio.observe(big);
      }
    }
  })();
})();
