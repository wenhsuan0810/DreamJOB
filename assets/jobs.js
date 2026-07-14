/* ============ DreamJOB — unified job search + tracker ============ */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };

  /* ---------- filter → keyword/param mappings ----------
     LinkedIn/Indeed take extra English keywords; 104 takes Chinese keywords.
     104 category/industry URL codes are undocumented and shift, so keyword
     augmentation is the reliable cross-platform approach. */

  var CAT_KW = {
    software:  { en: "software engineer",      zh: "軟體工程師" },
    data:      { en: "data analyst",           zh: "資料分析" },
    product:   { en: "product manager",        zh: "產品經理" },
    design:    { en: "UI UX designer",         zh: "UI UX 設計師" },
    marketing: { en: "marketing",              zh: "行銷" },
    sales:     { en: "sales business development", zh: "業務" },
    operations:{ en: "operations project manager", zh: "營運 專案管理" },
    finance:   { en: "finance accounting",     zh: "財務會計" },
    hr:        { en: "human resources",        zh: "人力資源" },
    cs:        { en: "customer success",       zh: "客戶成功 客服" }
  };

  var IND_KW = {
    tech: { en: "software technology", zh: "軟體 網路" },
    semi: { en: "semiconductor", zh: "半導體" },
    ecommerce: { en: "e-commerce", zh: "電商" },
    finance: { en: "fintech financial services", zh: "金融" },
    gaming: { en: "gaming", zh: "遊戲" },
    healthcare: { en: "healthcare biotech", zh: "醫療 生技" },
    manufacturing: { en: "manufacturing", zh: "製造" },
    retail: { en: "retail FMCG", zh: "零售 消費品" },
    media: { en: "media advertising", zh: "媒體 廣告" },
    consulting: { en: "consulting", zh: "顧問" }
  };

  // LinkedIn f_E experience codes / 104 jobexp (years of experience) codes
  var LEVEL_LINKEDIN = { intern: "1", entry: "2", mid: "3", senior: "4", manager: "5" };
  var LEVEL_104EXP   = { intern: "1", entry: "1", mid: "3",  senior: "10", manager: "99" };
  var LEVEL_KW       = { intern: "intern", entry: "junior", mid: "", senior: "senior", manager: "manager" };

  function augment(base, extras) {
    return extras.filter(Boolean).reduce(function (s, e) {
      return s.toLowerCase().indexOf(e.toLowerCase()) === -1 ? s + " " + e : s;
    }, base).trim();
  }

  /* ---------- URL builders ---------- */

  function buildLinkedIn(o) {
    var p = new URLSearchParams();
    var kw = augment(o.keywords, [o.cat && CAT_KW[o.cat].en, o.industry && IND_KW[o.industry].en]);
    p.set("keywords", kw);
    if (o.location) p.set("location", o.location);
    if (o.remote) p.set("f_WT", "2"); // remote work type
    if (o.date === "day") p.set("f_TPR", "r86400");
    else if (o.date === "week") p.set("f_TPR", "r604800");
    else if (o.date === "month") p.set("f_TPR", "r2592000");
    if (o.level && LEVEL_LINKEDIN[o.level]) p.set("f_E", LEVEL_LINKEDIN[o.level]);
    return "https://www.linkedin.com/jobs/search/?" + p.toString();
  }

  function build104(o) {
    var p = new URLSearchParams();
    var kw = augment(o.keywords, [o.cat && CAT_KW[o.cat].zh, o.industry && IND_KW[o.industry].zh]);
    p.set("keyword", kw);
    if (o.area) p.set("area", o.area);
    if (o.remote) p.set("remoteWork", "2"); // 2 = fully remote on 104
    if (o.level && LEVEL_104EXP[o.level]) p.set("jobexp", LEVEL_104EXP[o.level]);
    // isnew: days since posting (0 = today, 3, 7, 14, 30)
    if (o.date === "day") p.set("isnew", "0");
    else if (o.date === "week") p.set("isnew", "7");
    else if (o.date === "month") p.set("isnew", "30");
    return "https://www.104.com.tw/jobs/search/?" + p.toString();
  }

  function buildIndeed(o) {
    var p = new URLSearchParams();
    // Indeed's remote/level filter tokens are unstable across regions, so fold
    // them into the query text instead — works on every localized domain.
    var kw = augment(o.keywords, [
      o.cat && CAT_KW[o.cat].en,
      o.industry && IND_KW[o.industry].en,
      o.level && LEVEL_KW[o.level],
      o.remote ? "remote" : ""
    ]);
    p.set("q", kw);
    if (o.location) p.set("l", o.location);
    if (o.date === "day") p.set("fromage", "1");
    else if (o.date === "week") p.set("fromage", "7");
    else if (o.date === "month") p.set("fromage", "30");
    return "https://" + o.indeedDomain + "/jobs?" + p.toString();
  }

  function readForm() {
    return {
      keywords: $("keywords").value.trim(),
      location: $("location").value.trim(),
      area: $("area104").value,
      cat: $("jobCat").value,
      industry: $("industry").value,
      level: $("jobLevel").value,
      date: $("datePosted").value,
      indeedDomain: $("indeedDomain").value,
      remote: $("remoteOnly").checked
    };
  }

  function buildAll(o) {
    return {
      linkedin: buildLinkedIn(o),
      b104: build104(o),
      indeed: buildIndeed(o)
    };
  }

  function updatePreviews() {
    var o = readForm();
    if (!o.keywords) {
      $("keywords").focus();
      $("keywords").style.borderColor = "var(--red)";
      setTimeout(function () { $("keywords").style.borderColor = ""; }, 1500);
      return null;
    }
    var urls = buildAll(o);
    $("urlLinkedin").textContent = urls.linkedin;
    $("url104").textContent = urls.b104;
    $("urlIndeed").textContent = urls.indeed;
    $("openLinkedin").href = urls.linkedin;
    $("open104").href = urls.b104;
    $("openIndeed").href = urls.indeed;
    saveRecent(o);
    return urls;
  }

  $("buildBtn").addEventListener("click", updatePreviews);
  $("searchAllBtn").addEventListener("click", function () {
    var urls = updatePreviews();
    if (!urls) return;
    window.open(urls.linkedin, "_blank");
    window.open(urls.b104, "_blank");
    window.open(urls.indeed, "_blank");
  });
  $("keywords").addEventListener("keydown", function (e) {
    if (e.key === "Enter") $("searchAllBtn").click();
  });

  /* ---------- recent searches ---------- */

  var RECENT_KEY = "dreamjob.recentSearches";

  function loadJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch (e) { return fallback; }
  }

  function saveRecent(o) {
    var list = loadJSON(RECENT_KEY, []);
    list = list.filter(function (s) {
      return !(s.keywords === o.keywords && s.location === o.location && s.area === o.area);
    });
    list.unshift({ keywords: o.keywords, location: o.location, area: o.area, cat: o.cat, industry: o.industry, level: o.level, date: o.date, remote: o.remote, ts: Date.now() });
    list = list.slice(0, 8);
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
    renderRecent();
  }

  function renderRecent() {
    var list = loadJSON(RECENT_KEY, []);
    var box = $("recentSearches");
    if (!list.length) {
      box.innerHTML = '<p class="empty-state">No searches yet — your last 8 searches will appear here for one-click reuse.</p>';
      return;
    }
    box.innerHTML = "";
    list.forEach(function (s, i) {
      var chip = document.createElement("button");
      chip.className = "tab-btn";
      chip.style.margin = "0 8px 8px 0";
      chip.textContent = "🔁 " + s.keywords + (s.location ? " · " + s.location : "") + (s.remote ? " · remote" : "");
      chip.title = "Refill the form with this search";
      chip.addEventListener("click", function () {
        $("keywords").value = s.keywords;
        $("location").value = s.location || "";
        $("area104").value = s.area || "";
        $("jobCat").value = s.cat || "";
        $("industry").value = s.industry || "";
        $("jobLevel").value = s.level || "";
        $("datePosted").value = s.date || "";
        $("remoteOnly").checked = !!s.remote;
        updatePreviews();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      box.appendChild(chip);
    });
  }

  /* ---------- application tracker ---------- */

  var TRACK_KEY = "dreamjob.applications";
  var STATUSES = ["Saved", "Applied", "Phone screen", "Interviewing", "Offer", "Rejected", "Withdrawn"];
  var STATUS_CLASS = { "Offer": "green", "Interviewing": "yellow", "Phone screen": "yellow", "Rejected": "red", "Withdrawn": "red" };

  function renderTracker() {
    var apps = loadJSON(TRACK_KEY, []);
    var body = $("trkBody");
    body.innerHTML = "";
    $("trkEmpty").classList.toggle("hidden", apps.length > 0);
    apps.forEach(function (a, idx) {
      var tr = document.createElement("tr");

      var tdJob = document.createElement("td");
      if (a.url) {
        var link = document.createElement("a");
        link.href = a.url; link.target = "_blank"; link.rel = "noopener";
        link.textContent = a.title;
        tdJob.appendChild(link);
      } else {
        tdJob.textContent = a.title;
      }
      tr.appendChild(tdJob);

      var tdCo = document.createElement("td");
      tdCo.textContent = a.company;
      tr.appendChild(tdCo);

      var tdPf = document.createElement("td");
      tdPf.textContent = a.platform;
      tr.appendChild(tdPf);

      var tdDate = document.createElement("td");
      tdDate.textContent = new Date(a.ts).toLocaleDateString();
      tr.appendChild(tdDate);

      var tdStatus = document.createElement("td");
      var sel = document.createElement("select");
      STATUSES.forEach(function (st) {
        var op = document.createElement("option");
        op.value = st; op.textContent = st;
        if (st === a.status) op.selected = true;
        sel.appendChild(op);
      });
      sel.className = STATUS_CLASS[a.status] || "";
      sel.addEventListener("change", function () {
        apps[idx].status = sel.value;
        localStorage.setItem(TRACK_KEY, JSON.stringify(apps));
        renderTracker();
      });
      tdStatus.appendChild(sel);
      tr.appendChild(tdStatus);

      var tdDel = document.createElement("td");
      var del = document.createElement("button");
      del.className = "btn small danger";
      del.textContent = "✕";
      del.title = "Remove";
      del.addEventListener("click", function () {
        apps.splice(idx, 1);
        localStorage.setItem(TRACK_KEY, JSON.stringify(apps));
        renderTracker();
      });
      tdDel.appendChild(del);
      tr.appendChild(tdDel);

      body.appendChild(tr);
    });
  }

  $("trkAddBtn").addEventListener("click", function () {
    var title = $("trkTitle").value.trim();
    var company = $("trkCompany").value.trim();
    if (!title || !company) {
      ($("trkTitle").value.trim() ? $("trkCompany") : $("trkTitle")).focus();
      return;
    }
    var apps = loadJSON(TRACK_KEY, []);
    apps.unshift({
      title: title,
      company: company,
      url: $("trkUrl").value.trim(),
      platform: $("trkPlatform").value,
      status: "Applied",
      ts: Date.now()
    });
    localStorage.setItem(TRACK_KEY, JSON.stringify(apps));
    $("trkTitle").value = ""; $("trkCompany").value = ""; $("trkUrl").value = "";
    renderTracker();
  });

  /* ---------- job match basket (JD vs profile CV) ---------- */

  var MATCH_KEY = "dreamjob.jobBasket";

  function profileCv() {
    return (window.DJ && DJ.loadProfile().cv) || "";
  }

  function scoreClass(s) { return s >= 70 ? "green" : s >= 45 ? "yellow" : "red"; }

  function renderMatches() {
    var cv = profileCv();
    $("matchCvWarning").classList.toggle("hidden", !!cv.trim());
    var jobs = loadJSON(MATCH_KEY, []);
    var box = $("matchList");
    box.innerHTML = "";
    if (!jobs.length) {
      box.innerHTML = '<p class="empty-state">還沒有加入職缺 — 貼上第一個 JD 開始配對。</p>';
      return;
    }
    // score (or re-score if CV changed) then sort by match desc
    jobs.forEach(function (j) {
      j.match = cv.trim() ? DJ.matchCvToJd(cv, j.jd) : null;
    });
    jobs.sort(function (a, b) {
      return (b.match ? b.match.score : -1) - (a.match ? a.match.score : -1);
    });

    jobs.forEach(function (j, idx) {
      var m = j.match;
      var item = document.createElement("div");
      item.className = "question-item";
      var head = document.createElement("div");
      head.style.display = "flex";
      head.style.justifyContent = "space-between";
      head.style.alignItems = "center";
      head.style.gap = "12px";
      var left = document.createElement("div");
      var title = document.createElement("div");
      title.style.fontWeight = "600";
      title.textContent = j.title + (j.company ? " — " + j.company : "");
      left.appendChild(title);
      if (j.url) {
        var a = document.createElement("a");
        a.href = j.url; a.target = "_blank"; a.rel = "noopener";
        a.className = "small"; a.textContent = "開啟職缺 ↗";
        a.addEventListener("click", function (e) { e.stopPropagation(); });
        left.appendChild(a);
      }
      var right = document.createElement("span");
      right.className = "pill " + (m ? scoreClass(m.score) : "");
      right.textContent = m ? "匹配度 " + m.score + "%" : "無 CV";
      head.appendChild(left);
      head.appendChild(right);
      item.appendChild(head);

      var tip = document.createElement("div");
      tip.className = "q-tip";
      if (m) {
        var hitsHtml = m.hits.slice(0, 12).map(function (w) {
          return '<span class="keyword-chip hit">' + escapeHtml(w) + "</span>";
        }).join("") || '<span class="muted small">—</span>';
        var missHtml = m.misses.slice(0, 10).map(function (w) {
          return '<span class="keyword-chip miss">' + escapeHtml(w) + "</span>";
        }).join("") || '<span class="muted small">全部命中 🎉</span>';
        var xyz = m.misses.slice(0, 3).map(function (w) {
          return '<div class="rewrite-pair"><div class="after"><span class="tag">建議加入 (' + escapeHtml(w) + ')</span><span>' + escapeHtml(DJ.xyzLine(w)) + "</span></div></div>";
        }).join("");
        tip.innerHTML =
          '<strong class="small" style="color:var(--green);">✓ CV 已涵蓋</strong><div style="margin:6px 0 12px;">' + hitsHtml + "</div>" +
          '<strong class="small" style="color:var(--red);">✗ ATS 缺少關鍵字(若屬實請補進 CV)</strong><div style="margin:6px 0 12px;">' + missHtml + "</div>" +
          (xyz ? '<strong class="small">✍️ Wording 建議 — Google XYZ formula</strong><div style="margin-top:6px;">' + xyz + "</div>" : "") +
          '<div style="margin-top:10px;"><a href="cv.html" class="small">→ 到 CV Doctor 針對此 JD 完整優化</a></div>';
      } else {
        tip.innerHTML = '<span class="muted small">到 <a href="profile.html">Profile</a> 貼上 CV 後即可計算。</span>';
      }
      item.appendChild(tip);

      var del = document.createElement("button");
      del.className = "btn small danger";
      del.textContent = "移除";
      del.style.marginTop = "10px";
      del.addEventListener("click", function (e) {
        e.stopPropagation();
        var all = loadJSON(MATCH_KEY, []);
        all = all.filter(function (x) { return x.id !== j.id; });
        localStorage.setItem(MATCH_KEY, JSON.stringify(all));
        renderMatches();
      });
      tip.appendChild(del);

      item.addEventListener("click", function () { item.classList.toggle("open"); });
      box.appendChild(item);
    });
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  $("mjAddBtn").addEventListener("click", function () {
    var title = $("mjTitle").value.trim();
    var jd = $("mjJd").value.trim();
    if (!title || jd.length < 30) {
      (title ? $("mjJd") : $("mjTitle")).focus();
      return;
    }
    var jobs = loadJSON(MATCH_KEY, []);
    jobs.push({ id: Date.now(), title: title, company: $("mjCompany").value.trim(), url: $("mjUrl").value.trim(), jd: jd });
    localStorage.setItem(MATCH_KEY, JSON.stringify(jobs));
    $("mjTitle").value = ""; $("mjCompany").value = ""; $("mjUrl").value = ""; $("mjJd").value = "";
    renderMatches();
  });

  /* ---------- daily digest (data/latest.json, committed by GitHub Actions) ---------- */

  function renderDigest() {
    fetch("data/latest.json").then(function (r) {
      if (!r.ok) throw new Error("no digest");
      return r.json();
    }).then(function (d) {
      if (!d.jobs || !d.jobs.length) return;
      $("digestCard").classList.remove("hidden");
      var when = d.generatedAt ? new Date(d.generatedAt).toLocaleString() : "";
      $("digestMeta").textContent = "搜尋「" + d.keyword + "」 · 更新於 " + when +
        (d.failures && d.failures.length ? " · 今日抓取失敗:" + d.failures.join(", ") : "");
      var box = $("digestList");
      box.innerHTML = "";
      d.jobs.forEach(function (j, i) {
        var row = document.createElement("div");
        row.className = "finding";
        var icon = document.createElement("div");
        icon.className = "f-icon";
        icon.textContent = (i + 1) + ".";
        var body = document.createElement("div");
        body.className = "f-body";
        body.style.flex = "1";
        var strong = document.createElement("strong");
        var a = document.createElement("a");
        a.href = j.url; a.target = "_blank"; a.rel = "noopener";
        a.textContent = j.title;
        strong.appendChild(a);
        var meta = document.createElement("span");
        meta.textContent = (j.company || "") + (j.location ? " · " + j.location : "") + " · " + j.source;
        body.appendChild(strong);
        body.appendChild(meta);
        var pill = document.createElement("span");
        pill.className = "pill " + (j.score >= 70 ? "green" : j.score >= 45 ? "yellow" : "red");
        pill.style.alignSelf = "center";
        pill.textContent = j.score + "%";
        row.appendChild(icon);
        row.appendChild(body);
        row.appendChild(pill);
        box.appendChild(row);
      });
    }).catch(function () { /* digest not generated yet — keep section hidden */ });
  }

  renderRecent();
  renderTracker();
  renderMatches();
  renderDigest();
})();
