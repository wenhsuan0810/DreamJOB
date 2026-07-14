/* ============ DreamJOB — CV diagnosis & rewrite engine ============ */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };

  /* ---------- dictionaries ---------- */

  var ACTION_VERBS = [
    "achieved", "accelerated", "architected", "automated", "built", "boosted",
    "championed", "coached", "consolidated", "created", "cut", "decreased",
    "delivered", "designed", "developed", "directed", "drove", "eliminated",
    "engineered", "established", "exceeded", "expanded", "founded", "generated",
    "grew", "implemented", "improved", "increased", "initiated", "launched",
    "led", "managed", "mentored", "negotiated", "optimized", "orchestrated",
    "overhauled", "owned", "pioneered", "produced", "redesigned", "reduced",
    "refactored", "revamped", "saved", "scaled", "shipped", "slashed",
    "spearheaded", "streamlined", "transformed", "won"
  ];

  var WEAK_PHRASES = [
    { rx: /responsible for/gi, label: "responsible for", fix: "Start with what you did: “Managed…”, “Owned…”, “Led…”" },
    { rx: /duties includ(e|ed)/gi, label: "duties included", fix: "Describe outcomes, not duties." },
    { rx: /worked on/gi, label: "worked on", fix: "Say what you actually did: “Built…”, “Designed…”, “Shipped…”" },
    { rx: /helped (with|to|in)?/gi, label: "helped with", fix: "Claim your contribution: “Co-led…”, “Contributed X to Y…”" },
    { rx: /assisted (with|in)?/gi, label: "assisted with", fix: "Name the concrete part you delivered." },
    { rx: /participated in/gi, label: "participated in", fix: "What was your role? “Led…”, “Delivered…”, “Presented…”" },
    { rx: /was involved in/gi, label: "was involved in", fix: "Replace with a direct action verb." },
    { rx: /in charge of/gi, label: "in charge of", fix: "Use “Led” or “Managed” + a measurable result." },
    { rx: /familiar with/gi, label: "familiar with", fix: "Show usage instead: “Built X using Y”." },
    { rx: /various tasks/gi, label: "various tasks", fix: "Vague. Pick the 1–2 highest-impact tasks and name them." }
  ];

  var BUZZWORDS = [
    "team player", "hard-working", "hardworking", "go-getter", "self-starter",
    "detail-oriented", "detail oriented", "results-driven", "results driven",
    "think outside the box", "synergy", "go above and beyond", "dynamic",
    "proactive", "passionate", "motivated individual", "fast learner",
    "excellent communication skills", "works well under pressure"
  ];

  var PRONOUNS = /\b(I|me|my|mine|myself)\b/g;

  var STOPWORDS = new Set(("a,an,and,are,as,at,be,been,but,by,can,could,did,do,does,for,from,had,has,have,her,hers,him,his,how,if,in,into,is,it,its,job,more,most,not,of,on,or,our,ours,she,should,so,such,than,that,the,their,theirs,them,then,there,these,they,this,those,to,was,we,were,what,when,where,which,while,who,whom,why,will,with,would,you,your,yours,about,across,after,all,also,among,any,before,being,between,both,each,few,he,i,me,my,no,nor,only,other,over,own,same,some,through,under,until,up,very,work,working,years,year,including,required,requirements,preferred,plus,ability,able,strong,experience,skills,team,role,candidate,responsibilities,qualifications,must,etc,e.g,eg,i.e,ie,least,new,well,good,great,knowledge,understanding,related,relevant,using,use,used,within,help,ensure,develop,per,day,daily,company,position,opportunity,looking,join,offer,benefits,equal,employer").split(","));

  /* ---------- helpers ---------- */

  function getLines(text) {
    return text.split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
  }

  function isBullet(line) {
    return /^[-•●▪*·‣◦]/.test(line) || /^\d+[.)]\s/.test(line);
  }

  function stripBullet(line) {
    return line.replace(/^[-•●▪*·‣◦]+\s*/, "").replace(/^\d+[.)]\s*/, "");
  }

  function firstWord(line) {
    var m = stripBullet(line).match(/[A-Za-z']+/);
    return m ? m[0].toLowerCase() : "";
  }

  function normalizeVerb(w) {
    // match "manage" against "managed" etc. — compare against dictionary loosely
    return ACTION_VERBS.some(function (v) {
      return w === v || w + "d" === v || w + "ed" === v || v.indexOf(w) === 0 && v.length - w.length <= 2;
    });
  }

  /* ---------- analysis ---------- */

  function analyze(cv, jd) {
    var lines = getLines(cv);
    var words = cv.match(/\S+/g) || [];
    var wordCount = words.length;
    var bullets = lines.filter(isBullet);
    var findings = [];
    var rewrites = [];
    var metrics = [];

    /* -- 1. contact info (10 pts) -- */
    var hasEmail = /[\w.+-]+@[\w-]+\.[\w.]+/.test(cv);
    var hasPhone = /(\+?\d[\d\s\-().]{7,}\d)/.test(cv);
    var hasLinkedIn = /linkedin\.com\/in\//i.test(cv);
    var contactScore = (hasEmail ? 5 : 0) + (hasPhone ? 3 : 0) + (hasLinkedIn ? 2 : 0);
    metrics.push({ name: "Contact info", score: contactScore, max: 10 });
    if (!hasEmail) findings.push({ icon: "🚨", title: "No email address found", body: "Recruiters need a way to reach you. Put your email at the top of the CV." });
    if (!hasPhone) findings.push({ icon: "⚠️", title: "No phone number found", body: "Add a phone number with country code (e.g. +886 for Taiwan)." });
    if (!hasLinkedIn) findings.push({ icon: "💡", title: "No LinkedIn URL", body: "A linkedin.com/in/you URL adds credibility and is expected in most industries." });

    /* -- 2. length (15 pts) -- */
    var lengthScore, lengthNote = null;
    if (wordCount < 120) { lengthScore = 4; lengthNote = { icon: "🚨", title: "CV looks too short (" + wordCount + " words)", body: "A full CV is usually 300–700 words. Add achievements, skills and education." }; }
    else if (wordCount < 250) { lengthScore = 10; lengthNote = { icon: "💡", title: "CV is on the short side (" + wordCount + " words)", body: "You likely have room to add 1–2 quantified achievements per role." }; }
    else if (wordCount <= 750) { lengthScore = 15; }
    else if (wordCount <= 1100) { lengthScore = 10; lengthNote = { icon: "💡", title: "CV is getting long (" + wordCount + " words)", body: "Aim for one page (<10 yrs experience). Cut older roles down to 1–2 bullets." }; }
    else { lengthScore = 5; lengthNote = { icon: "⚠️", title: "CV is very long (" + wordCount + " words)", body: "Recruiters skim. Ruthlessly cut anything that doesn't sell you for the target role." }; }
    if (lengthNote) findings.push(lengthNote);
    metrics.push({ name: "Length", score: lengthScore, max: 15 });

    /* -- 3. action verbs (20 pts) -- */
    var checkLines = bullets.length >= 3 ? bullets : lines.filter(function (l) { return stripBullet(l).split(/\s+/).length >= 4; });
    var strongCount = 0;
    checkLines.forEach(function (l) { if (normalizeVerb(firstWord(l))) strongCount++; });
    var verbRatio = checkLines.length ? strongCount / checkLines.length : 0;
    var verbScore = Math.round(verbRatio * 20);
    metrics.push({ name: "Action verbs", score: verbScore, max: 20 });
    if (checkLines.length && verbRatio < 0.5) {
      findings.push({ icon: "⚠️", title: "Only " + strongCount + " of " + checkLines.length + " bullet lines start with a strong action verb", body: "Start every bullet with a verb like <code>Led</code>, <code>Built</code>, <code>Reduced</code>, <code>Launched</code>, <code>Negotiated</code>." });
    }
    if (bullets.length === 0 && lines.length > 5) {
      findings.push({ icon: "💡", title: "No bullet points detected", body: "Dense paragraphs are hard to skim. Convert experience into bullets starting with • or -." });
    }

    /* -- 4. quantified impact (20 pts) -- */
    var quantified = checkLines.filter(function (l) { return /\d/.test(l) || /%|NT\$|\$|USD|k\b|K\b|million|billion|萬|億/.test(l); });
    var quantRatio = checkLines.length ? quantified.length / checkLines.length : 0;
    var quantScore = Math.round(Math.min(1, quantRatio / 0.6) * 20); // 60%+ quantified = full marks
    metrics.push({ name: "Quantified impact", score: quantScore, max: 20 });
    if (checkLines.length && quantRatio < 0.4) {
      findings.push({ icon: "⚠️", title: "Only " + quantified.length + " of " + checkLines.length + " achievement lines contain numbers", body: "Add metrics: revenue, %, time saved, users, team size, budget. Numbers are what recruiters remember." });
    }

    /* -- 5. weak phrases (20 pts) -- */
    var weakHits = [];
    WEAK_PHRASES.forEach(function (w) {
      var m = cv.match(w.rx);
      if (m) weakHits.push({ phrase: w.label, count: m.length, fix: w.fix });
    });
    var weakTotal = weakHits.reduce(function (s, w) { return s + w.count; }, 0);
    var weakScore = Math.max(0, 20 - weakTotal * 4);
    metrics.push({ name: "Weak phrases", score: weakScore, max: 20 });
    weakHits.forEach(function (w) {
      findings.push({ icon: "🚩", title: "Weak phrase: “" + w.phrase + "” (×" + w.count + ")", body: w.fix });
    });

    /* -- 6. buzzwords & pronouns (15 pts) -- */
    var buzzHits = [];
    var lower = cv.toLowerCase();
    BUZZWORDS.forEach(function (b) {
      if (lower.indexOf(b) !== -1) buzzHits.push(b);
    });
    var pronounHits = (cv.match(PRONOUNS) || []).length;
    var styleScore = Math.max(0, 15 - buzzHits.length * 3 - Math.max(0, pronounHits - 2));
    metrics.push({ name: "Style & clichés", score: styleScore, max: 15 });
    if (buzzHits.length) {
      findings.push({ icon: "🚩", title: "Clichés detected: " + buzzHits.map(function (b) { return "“" + b + "”"; }).join(", "), body: "These claims are free to make so they carry no weight. Replace them with evidence — a story or a number that proves the trait." });
    }
    if (pronounHits > 2) {
      findings.push({ icon: "💡", title: "First-person pronouns used " + pronounHits + " times", body: "CV convention drops “I/my”. Write “Led team of 5”, not “I led my team of 5”." });
    }

    /* -- rewrites -- */
    lines.forEach(function (l) {
      if (rewrites.length >= 6) return;
      var stripped = stripBullet(l);
      for (var i = 0; i < WEAK_PHRASES.length; i++) {
        WEAK_PHRASES[i].rx.lastIndex = 0;
        if (WEAK_PHRASES[i].rx.test(stripped)) {
          rewrites.push({ before: stripped, after: suggestRewrite(stripped) });
          return;
        }
      }
      // strong-verb line but no numbers → suggest quantifying
      if (isBullet(l) && normalizeVerb(firstWord(l)) && !/\d/.test(stripped) && stripped.split(/\s+/).length >= 5 && rewrites.length < 6) {
        rewrites.push({ before: stripped, after: stripped.replace(/[.。]?\s*$/, "") + ", ◻ [add the result: e.g. “cutting processing time by ◻%” or “serving ◻ users”]" });
      }
    });

    /* -- JD keyword match -- */
    var kw = null;
    if (jd && jd.trim().length > 40) {
      kw = keywordMatch(cv, jd);
    }

    var total = metrics.reduce(function (s, m) { return s + m.score; }, 0);
    return { total: total, metrics: metrics, findings: findings, rewrites: rewrites, keywords: kw, wordCount: wordCount, bulletCount: bullets.length };
  }

  function suggestRewrite(line) {
    var s = line;
    s = s.replace(/^(was\s+)?responsible for (managing|running|maintaining)?\s*/i, "Managed ");
    s = s.replace(/^(was\s+)?in charge of\s*/i, "Led ");
    s = s.replace(/^worked on\s*/i, "Built ");
    s = s.replace(/^helped (with|to|in)?\s*/i, "Contributed to ");
    s = s.replace(/^assisted (with|in)?\s*/i, "Supported ");
    s = s.replace(/^participated in\s*/i, "Delivered ");
    s = s.replace(/^(was\s+)?involved in\s*/i, "Drove ");
    s = s.replace(/duties included\s*/i, "");
    s = s.charAt(0).toUpperCase() + s.slice(1);
    if (!/\d/.test(s)) {
      s = s.replace(/[.。]?\s*$/, "") + " — achieving ◻ [quantified result: %, NT$, time saved, users]";
    }
    return s;
  }

  function keywordMatch(cv, jd) {
    var freq = {};
    (jd.toLowerCase().match(/[a-z][a-z+#./-]{1,}/g) || []).forEach(function (w) {
      w = w.replace(/[./-]+$/, "");
      if (w.length < 3 && !/^(go|r|c#|ai|ml|ux|ui|qa)$/.test(w)) return;
      if (STOPWORDS.has(w)) return;
      freq[w] = (freq[w] || 0) + 1;
    });
    var top = Object.keys(freq)
      .sort(function (a, b) { return freq[b] - freq[a]; })
      .slice(0, 25);
    var cvLower = cv.toLowerCase();
    var hits = [], misses = [];
    top.forEach(function (w) {
      (cvLower.indexOf(w) !== -1 ? hits : misses).push(w);
    });
    return { hits: hits, misses: misses };
  }

  /* ---------- rendering ---------- */

  function verdict(total) {
    if (total >= 85) return ["Excellent — ready to ship 🚀", "Your CV shows strong structure and impact. Do a final proofread and tailor keywords per application."];
    if (total >= 70) return ["Good — a few tweaks needed 👍", "Solid foundation. Fix the findings below to move from good to memorable."];
    if (total >= 50) return ["Fair — needs focused work 🔧", "The bones are there, but recruiters may skim past it. Prioritize action verbs and quantified results."];
    return ["Needs major surgery 🏥", "Right now this CV undersells you. Work through the findings top to bottom — the rewrite suggestions give you a head start."];
  }

  function render(r) {
    $("results").classList.remove("hidden");

    var ring = $("scoreRing");
    var color = r.total >= 70 ? "var(--green)" : r.total >= 50 ? "var(--yellow)" : "var(--red)";
    ring.style.setProperty("--pct", r.total);
    ring.style.setProperty("--ring-color", color);
    $("scoreNum").textContent = r.total;

    var v = verdict(r.total);
    $("scoreVerdict").textContent = v[0];
    $("scoreSummary").textContent = v[1] + " (" + r.wordCount + " words, " + r.bulletCount + " bullet points detected.)";

    var mBox = $("metrics");
    mBox.innerHTML = "";
    r.metrics.forEach(function (m) {
      var pct = Math.round((m.score / m.max) * 100);
      var cls = pct >= 70 ? "good" : pct >= 45 ? "warn" : "bad";
      var div = document.createElement("div");
      div.className = "metric " + cls;
      div.innerHTML =
        '<div class="metric-head"><span>' + m.name + "</span><span>" + m.score + " / " + m.max + "</span></div>" +
        '<div class="bar"><span style="width:' + pct + '%"></span></div>';
      mBox.appendChild(div);
    });

    var fBox = $("findings");
    fBox.innerHTML = "";
    if (!r.findings.length) {
      fBox.innerHTML = '<p class="empty-state">No red flags found — nice work! 🎉</p>';
    }
    r.findings.forEach(function (f) {
      var div = document.createElement("div");
      div.className = "finding";
      div.innerHTML = '<div class="f-icon">' + f.icon + '</div><div class="f-body"><strong></strong><span></span></div>';
      div.querySelector("strong").textContent = f.title;
      div.querySelector("span").innerHTML = f.body; // body strings are app-authored (may contain <code>)
      fBox.appendChild(div);
    });

    var rwBox = $("rewrites");
    rwBox.innerHTML = "";
    $("rewriteCard").classList.toggle("hidden", r.rewrites.length === 0);
    r.rewrites.forEach(function (rw) {
      var div = document.createElement("div");
      div.className = "rewrite-pair";
      div.innerHTML =
        '<div class="before"><span class="tag">Before</span><span class="txt"></span></div>' +
        '<div class="after"><span class="tag">Stronger</span><span class="txt"></span></div>';
      div.querySelectorAll(".txt")[0].textContent = rw.before;
      div.querySelectorAll(".txt")[1].textContent = rw.after;
      rwBox.appendChild(div);
    });

    var kwCard = $("keywordCard");
    if (r.keywords) {
      kwCard.classList.remove("hidden");
      var k = r.keywords;
      var pctMatch = k.hits.length + k.misses.length ? Math.round((k.hits.length / (k.hits.length + k.misses.length)) * 100) : 0;
      $("kwSummary").textContent = "Your CV matches " + k.hits.length + " of the top " + (k.hits.length + k.misses.length) + " keywords in this job description (" + pctMatch + "%).";
      renderChips($("kwHits"), k.hits, "hit", "None yet — see the missing list below.");
      renderChips($("kwMisses"), k.misses, "miss", "Nothing missing — great coverage! 🎯");
    } else {
      kwCard.classList.add("hidden");
    }

    document.getElementById("results").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderChips(box, list, cls, emptyMsg) {
    box.innerHTML = "";
    if (!list.length) {
      box.innerHTML = '<span class="muted small">' + emptyMsg + "</span>";
      return;
    }
    list.forEach(function (w) {
      var chip = document.createElement("span");
      chip.className = "keyword-chip " + cls;
      chip.textContent = w;
      box.appendChild(chip);
    });
  }

  /* ---------- wiring ---------- */

  $("analyzeBtn").addEventListener("click", function () {
    var cv = $("cvText").value;
    if (cv.trim().length < 30) {
      $("cvText").focus();
      $("cvText").style.borderColor = "var(--red)";
      setTimeout(function () { $("cvText").style.borderColor = ""; }, 1500);
      return;
    }
    render(analyze(cv, $("jdText").value));
  });

  var SAMPLE_CV = [
    "Wen-Hsuan Lin",
    "wenhsuan@example.com | +886 912 345 678 | linkedin.com/in/wenhsuan",
    "",
    "SUMMARY",
    "Hard-working and detail-oriented software engineer. Team player passionate about web development.",
    "",
    "EXPERIENCE",
    "Software Engineer — TechCorp Taiwan (2023–present)",
    "• Responsible for managing the company's e-commerce website",
    "• Worked on the checkout flow redesign project",
    "• Helped with migrating the legacy system to the cloud",
    "• Reduced page load time by 45% by implementing code splitting and CDN caching",
    "",
    "Junior Developer — StartupXYZ (2021–2023)",
    "• Participated in building internal dashboard tools",
    "• Duties included writing unit tests and fixing bugs",
    "• Built a Slack bot that automated daily standup reports, saving the team 3 hours per week",
    "",
    "EDUCATION",
    "B.S. Computer Science, National Taiwan University, 2021",
    "",
    "SKILLS",
    "JavaScript, TypeScript, React, Node.js, Python, SQL, Git, Docker, AWS"
  ].join("\n");

  $("sampleBtn").addEventListener("click", function () {
    $("cvText").value = SAMPLE_CV;
    render(analyze(SAMPLE_CV, $("jdText").value));
  });
})();
