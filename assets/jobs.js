/* ============ DreamJOB — unified job search + tracker ============ */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };

  /* ---------- URL builders ---------- */

  function buildLinkedIn(o) {
    var p = new URLSearchParams();
    p.set("keywords", o.keywords);
    if (o.location) p.set("location", o.location);
    if (o.remote) p.set("f_WT", "2"); // remote work type
    if (o.date === "day") p.set("f_TPR", "r86400");
    else if (o.date === "week") p.set("f_TPR", "r604800");
    else if (o.date === "month") p.set("f_TPR", "r2592000");
    if (o.exp) p.set("f_E", o.exp);
    return "https://www.linkedin.com/jobs/search/?" + p.toString();
  }

  function build104(o) {
    var p = new URLSearchParams();
    p.set("keyword", o.keywords);
    if (o.area) p.set("area", o.area);
    if (o.remote) p.set("remoteWork", "2"); // 2 = fully remote on 104
    // isnew: days since posting (0 = today, 3, 7, 14, 30)
    if (o.date === "day") p.set("isnew", "0");
    else if (o.date === "week") p.set("isnew", "7");
    else if (o.date === "month") p.set("isnew", "30");
    return "https://www.104.com.tw/jobs/search/?" + p.toString();
  }

  function buildIndeed(o) {
    var p = new URLSearchParams();
    // Indeed's remote filter token is unstable across regions, so fold it
    // into the query text instead — works on every localized domain.
    p.set("q", o.remote ? o.keywords + " remote" : o.keywords);
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
      date: $("datePosted").value,
      exp: $("expLevel").value,
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
    list.unshift({ keywords: o.keywords, location: o.location, area: o.area, date: o.date, exp: o.exp, remote: o.remote, ts: Date.now() });
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
        $("datePosted").value = s.date || "";
        $("expLevel").value = s.exp || "";
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

  renderRecent();
  renderTracker();
})();
