/* ============ DreamJOB — shared profile store + CV↔JD match engine ============ */
/* Loaded before page scripts; exposes window.DJ */
(function () {
  "use strict";

  var PROFILE_KEY = "dreamjob.profile";

  var STOPWORDS = new Set(("a,an,and,are,as,at,be,been,but,by,can,could,did,do,does,for,from,had,has,have,her,hers,him,his,how,if,in,into,is,it,its,job,more,most,not,of,on,or,our,ours,she,should,so,such,than,that,the,their,theirs,them,then,there,these,they,this,those,to,was,we,were,what,when,where,which,while,who,whom,why,will,with,would,you,your,yours,about,across,after,all,also,among,any,before,being,between,both,each,few,he,i,me,my,no,nor,only,other,over,own,same,some,through,under,until,up,very,work,working,years,year,including,required,requirements,preferred,plus,ability,able,strong,experience,skills,team,role,candidate,responsibilities,qualifications,must,etc,e.g,eg,i.e,ie,least,new,well,good,great,knowledge,understanding,related,relevant,using,use,used,within,help,ensure,develop,per,day,daily,company,position,opportunity,looking,join,offer,benefits,equal,employer,you'll,we're,who's,what's").split(","));

  // Chinese stopwords for zh JDs (matched as whole tokens after segmentation below)
  var ZH_STOP = new Set("的,和,與,及,或,你,我,我們,你們,他們,以及,並,等,之,於,在,為,是,有,將,對,能,可,以,不,了,人,工作,職務,相關,具備,熟悉,經驗,能力,以上,以下,負責,需求,條件,福利,公司,團隊,職缺,歡迎,優先,加分".split(","));

  function loadProfile() {
    try { return JSON.parse(localStorage.getItem(PROFILE_KEY)) || {}; }
    catch (e) { return {}; }
  }

  function saveProfile(p) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  }

  /* tokenize mixed zh/en text into keyword candidates */
  function tokens(text) {
    var out = [];
    var lower = text.toLowerCase();
    // latin tokens (keeps c#, ci/cd, next.js style)
    (lower.match(/[a-z][a-z0-9+#./-]{1,}/g) || []).forEach(function (w) {
      w = w.replace(/[./-]+$/, "");
      if (w.length < 2) return;
      if (w.length < 3 && !/^(go|r|ai|ml|ux,ui|ui|qa|bd|pm|hr|bi|db)$/.test(w)) return;
      if (STOPWORDS.has(w)) return;
      out.push(w);
    });
    // CJK: extract 2–4 char n-grams around common tech/business terms is overkill;
    // instead take contiguous CJK runs and emit the run plus its 2-grams
    (text.match(/[一-鿿]{2,}/g) || []).forEach(function (run) {
      if (run.length <= 4 && !ZH_STOP.has(run)) out.push(run);
      for (var i = 0; i + 2 <= run.length && run.length > 4; i++) {
        var bg = run.slice(i, i + 2);
        if (!ZH_STOP.has(bg)) out.push(bg);
      }
    });
    return out;
  }

  /* top keywords of a JD by frequency */
  function topKeywords(text, n) {
    var freq = {};
    tokens(text).forEach(function (w) { freq[w] = (freq[w] || 0) + 1; });
    return Object.keys(freq)
      .sort(function (a, b) { return freq[b] - freq[a]; })
      .slice(0, n || 25)
      .map(function (w) { return { word: w, weight: freq[w] }; });
  }

  /* match a CV against a JD.
     Returns { score 0-100, hits[], misses[], coverage } */
  function matchCvToJd(cv, jd) {
    var kws = topKeywords(jd, 25);
    var cvLower = cv.toLowerCase();
    var hitW = 0, totalW = 0, hits = [], misses = [];
    kws.forEach(function (k) {
      totalW += k.weight;
      if (cvLower.indexOf(k.word.toLowerCase()) !== -1) { hitW += k.weight; hits.push(k.word); }
      else misses.push(k.word);
    });
    var coverage = totalW ? hitW / totalW : 0;
    // weighted coverage dominates; small bonus for absolute hit count
    var score = Math.round(coverage * 85 + Math.min(hits.length, 10) * 1.5);
    return { score: Math.min(99, score), hits: hits, misses: misses, coverage: coverage, keywords: kws };
  }

  /* quantified achievement lines from a CV (for letters, BEAT, XYZ examples).
     Prefers lines with impact metrics (%, $, K, 萬) and skips job-header lines
     whose only number is a year range like "(2022–present)". */
  function achievementLines(cv, n) {
    var strong = /%|NT\$|\$|USD|萬|億|\d+[Kk]\b/;
    var candidates = cv.split(/\r?\n/)
      .map(function (l) { return l.replace(/^[-•●▪*·‣◦]+\s*/, "").trim(); })
      .filter(function (l) {
        if (l.length <= 20 || l.length >= 220) return false;
        if (/@|linkedin\.com|^\+?\d[\d\s-]+$/.test(l)) return false;
        if (!/\d/.test(l) && !strong.test(l)) return false;
        // drop lines whose only digits are years (job headers, education)
        if (!strong.test(l) && !/\d/.test(l.replace(/(19|20)\d{2}/g, ""))) return false;
        return true;
      });
    return candidates
      .map(function (l, i) { return { l: l, i: i, s: strong.test(l) ? 1 : 0 }; })
      .sort(function (a, b) { return b.s - a.s || a.i - b.i; })
      .slice(0, n || 3)
      .sort(function (a, b) { return a.i - b.i; })
      .map(function (x) { return x.l; });
  }

  /* Google XYZ formula suggestion for a missing keyword */
  function xyzLine(keyword) {
    return "Accomplished ◻ [X: 成果 outcome] as measured by ◻ [Y: 數據 metric], by ◻ [Z: 使用/透過 " + keyword + " 完成的具體做法]";
  }

  /* guess candidate name = first non-empty CV line without @ or digits-only */
  function guessName(cv) {
    var lines = cv.split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
    for (var i = 0; i < Math.min(3, lines.length); i++) {
      if (!/@|\d{4}|http/.test(lines[i]) && lines[i].length < 40) return lines[i];
    }
    return "[Your name]";
  }

  window.DJ = {
    PROFILE_KEY: PROFILE_KEY,
    loadProfile: loadProfile,
    saveProfile: saveProfile,
    tokens: tokens,
    topKeywords: topKeywords,
    matchCvToJd: matchCvToJd,
    achievementLines: achievementLines,
    xyzLine: xyzLine,
    guessName: guessName
  };
})();
