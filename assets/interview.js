/* ============ DreamJOB — interview preparation ============ */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };

  /* ---------- question bank (en + zh) ---------- */

  var QUESTIONS = [
    /* classic / HR */
    { cat: "classic", q: "Tell me about yourself.", zh: "請自我介紹。", tip: "Use Present–Past–Future in ~90 seconds: what you do now and are great at → the experience that got you here → why this role is the natural next step. Tailor the whole thing to the job description; this is a pitch, not a biography. (中文版可用下方 BEAT 產生器)" },
    { cat: "classic", q: "Why do you want to work here?", zh: "為什麼想加入我們公司?", tip: "Show you did homework: name something specific (product, engineering blog post, market move) and connect it to what you want to build or learn. 提出具體的觀察(產品、新聞、市場動作),連結到你想貢獻的方向。" },
    { cat: "classic", q: "Why are you leaving your current job?", zh: "為什麼想離開目前的工作?", tip: "Never badmouth. Frame as running toward, not running away: growth, scope, technology, mission. 絕不批評前東家 — 談「奔向什麼」而非「逃離什麼」。" },
    { cat: "classic", q: "What are your greatest strengths?", zh: "你最大的優勢是什麼?", tip: "Pick 2 strengths the JD actually asks for, prove each with a one-line example with a number. 挑 JD 真正要求的 2 個優勢,各配一個有數字的實例。" },
    { cat: "classic", q: "What is your biggest weakness?", zh: "你最大的缺點是什麼?", tip: "Real (non-fatal) weakness + the system you use to manage it + evidence of improvement. 真實但非致命的缺點 + 管理它的具體方法 + 改善證據。避免「我太追求完美」。" },
    { cat: "classic", q: "Where do you see yourself in five years?", zh: "五年後你希望自己在哪裡?", tip: "Show ambition compatible with this company: deeper expertise, larger scope, leading projects or people. 展現與這間公司相容的企圖心。" },
    { cat: "classic", q: "What are your salary expectations?", zh: "你的期望薪資是多少?", tip: "Research the band first (Levels.fyi, Glassdoor, 104 薪資情報). Give a researched range anchored slightly high, or ask for the role's budgeted band first. 先做功課,給一個略高於錨點的區間,或反問職缺預算區間。" },
    { cat: "classic", q: "Why should we hire you?", zh: "我們為什麼要錄取你?", tip: "Summarize your 3 strongest matches to the JD, each with proof — your closing argument, prepare it word-for-word. 總結你與 JD 最強的 3 個匹配點,逐字準備好。" },

    /* behavioral */
    { cat: "behavioral", q: "Tell me about a time you led a project end to end.", zh: "分享一次你從頭到尾主導專案的經驗。", tip: "STAR. Emphasize how you defined scope, aligned stakeholders, and handled the biggest obstacle. End with the shipped result and measurable impact. 強調定義範圍、對齊利害關係人、克服最大障礙,以量化結果收尾。" },
    { cat: "behavioral", q: "Describe a conflict with a coworker and how you resolved it.", zh: "描述一次與同事的衝突以及你如何解決。", tip: "Pick a professional disagreement (approach, priorities), not a personality clash. Show you sought their perspective first and found shared goals. 選「專業歧見」而非個性衝突,先理解對方觀點,找到共同目標。故事裡不能有壞人。" },
    { cat: "behavioral", q: "Tell me about a time you failed.", zh: "分享一次你失敗的經驗。", tip: "Real failure, real stakes, own it without excuses, then spend most of the answer on what you changed afterward. 選有真實代價的失敗,不找藉口,把大部分時間放在事後的改變與後來的成功。" },
    { cat: "behavioral", q: "Describe a time you had to meet a very tight deadline.", zh: "描述一次你在極緊迫期限內完成任務的經驗。", tip: "Show prioritization: what you cut, what you negotiated, how you communicated risk early. 展現取捨:砍了什麼、談判了什麼、如何提早溝通風險。" },
    { cat: "behavioral", q: "Tell me about a time you disagreed with your manager.", zh: "分享一次你與主管意見不合的經驗。", tip: "Respectful pushback backed by data, and commitment to the final decision either way ('disagree and commit'). 用數據支撐的尊重式反對 + 對最終決定的執行承諾。" },
    { cat: "behavioral", q: "Give an example of a time you took initiative beyond your job scope.", zh: "舉例說明你主動承擔份外之事的經驗。", tip: "Something you spotted, proposed and drove without being asked, with a quantified result. 自己發現、自己提案、自己推動,加上量化結果 — 這是最強的 ownership 訊號。" },
    { cat: "behavioral", q: "Tell me about a time you had to learn something quickly.", zh: "分享一次你必須快速學會新事物的經驗。", tip: "Why the deadline was real → your learning plan → how fast you became productive → outcome. 說明學習計畫與多快上手,展現「會學習」這個元能力。" },
    { cat: "behavioral", q: "Describe a time you received difficult feedback.", zh: "描述一次你收到嚴厲回饋的經驗。", tip: "Listened without defensiveness, asked clarifying questions, made a visible change, thanked them. 不防衛地傾聽、追問細節、做出可見的改變、道謝。" },

    /* technical / problem solving */
    { cat: "technical", q: "Walk me through the project you're most proud of.", zh: "介紹你最自豪的專案。", tip: "Pick the project most relevant to this role: the problem and why it was hard → your specific contribution → key decisions and trade-offs → measured results. Be ready to go 3 levels deep. 準備好被追問三層深。" },
    { cat: "technical", q: "How would you design [a system relevant to the role]?", zh: "你會如何設計(與該職務相關的)系統?", tip: "Clarify requirements and scale first, propose a simple design, then evolve it while narrating trade-offs. 先釐清需求與規模,從簡單設計開始,邊演進邊說取捨 — 評分的是推理過程。" },
    { cat: "technical", q: "How do you approach debugging a hard problem?", zh: "你如何處理棘手的除錯問題?", tip: "Reproduce → isolate by bisecting → hypothesize and test → fix root cause → add regression test/alert. 描述方法論,配一個 30 秒的實戰小故事。" },
    { cat: "technical", q: "How do you decide between competing technical approaches?", zh: "面對多個技術方案時你如何決策?", tip: "Requirements, constraints, reversibility, cost of being wrong, prototyping the risky part first. Name a real decision and the option you rejected. 講一個真實決策和你「否決掉的選項」— 那才是判斷力的證明。" },
    { cat: "technical", q: "How do you keep your skills up to date?", zh: "你如何保持專業能力與時俱進?", tip: "The last new thing you learned and applied at work beats any list of newsletters. 最有力的答案是「上季我用新學的 X 做了 Y」。" },
    { cat: "technical", q: "Estimate something unusual (e.g. how many coffees are sold in Taipei per day).", zh: "估算題(例:台北一天賣出幾杯咖啡?)", tip: "Fermi estimation: state assumptions out loud, decompose, compute round numbers, sanity-check. 大聲說出假設、拆解、用整數計算、最後檢查合理性 — 數字不重要,結構才重要。" }
  ];

  /* reverse questions (ask them) — bilingual with checkbox selection */
  var REVERSE_QS = [
    { en: "What does success look like in this role after 6 and 12 months?", zh: "這個職位在 6 個月和 12 個月後,怎樣算是成功?" },
    { en: "What's the biggest challenge the team is facing right now?", zh: "團隊目前面臨的最大挑戰是什麼?" },
    { en: "How does the team handle code review / quality / technical debt?", zh: "團隊如何處理 code review、品質與技術債?" },
    { en: "Can you tell me about the growth path of someone who joined in this role?", zh: "可以分享曾在這個職位加入的人後來的成長路徑嗎?" },
    { en: "What made you join, and what makes you stay?", zh: "當初是什麼吸引您加入?現在又是什麼讓您留下?" },
    { en: "How is performance evaluated, and how often is feedback given?", zh: "績效如何評估?回饋的頻率是?" },
    { en: "What are the next steps in the interview process?", zh: "接下來的面試流程和時程是什麼?" }
  ];

  /* ---------- JD → predicted questions rules ---------- */

  var PRED_RULES = [
    { rx: /lead|mentor|manage|team of|帶領|管理|團隊|指導/i,
      en: { q: "Tell me about a time you led or mentored others through a difficult delivery.", s: "S: a delivery at risk. T: you owned the team outcome. A: how you set direction, unblocked and coached. R: shipped result + what the team learned." },
      zh: { q: "分享一次你帶領或指導他人完成困難任務的經驗。", s: "S:一個瀕臨風險的交付。T:你為團隊結果負責。A:如何定方向、排除障礙、指導成員。R:交付成果 + 團隊的成長。" } },
    { rx: /cross[- ]?functional|stakeholder|collaborat|align|跨部門|協作|溝通|利害關係/i,
      en: { q: "Describe a time you had to align multiple stakeholders with conflicting priorities.", s: "S: two teams pulling opposite ways. T: you needed one plan. A: mapped interests, found shared goal, made trade-offs explicit. R: agreed plan + outcome metric." },
      zh: { q: "描述一次你協調多個立場衝突的利害關係人的經驗。", s: "S:兩個部門目標相反。T:你必須產出單一方案。A:盤點各方利益、找共同目標、把取捨攤開。R:達成共識 + 成果數據。" } },
    { rx: /fast[- ]?paced|startup|ambigu|dynamic|快速|模糊|新創|變動/i,
      en: { q: "Tell me about a time you delivered results with unclear requirements or shifting priorities.", s: "S: goal kept moving. T: deliver anyway. A: timeboxed discovery, shipped smallest useful thing, iterated. R: outcome + how you kept stakeholders informed." },
      zh: { q: "分享一次在需求不明或優先順序不斷變動下,你仍交出成果的經驗。", s: "S:目標一直變。T:仍要交付。A:限時探索、先出最小可用版本、快速迭代。R:成果 + 你如何持續同步資訊。" } },
    { rx: /data|analytic|metric|kpi|sql|數據|分析|指標/i,
      en: { q: "Give an example of a decision you changed because of data.", s: "S: a belief everyone held. T: validate before investing. A: defined metric, ran analysis/AB test, found the surprise. R: decision reversed + impact." },
      zh: { q: "舉例說明你曾因數據而改變決策的經驗。", s: "S:大家都相信的假設。T:投入前先驗證。A:定義指標、跑分析或 AB test、發現反直覺結果。R:改變決策 + 帶來的影響。" } },
    { rx: /customer|client|user|客戶|用戶|使用者/i,
      en: { q: "Tell me about the most difficult customer/user problem you have handled.", s: "S: an angry or blocked customer. T: you owned the relationship. A: listened, diagnosed the real need, set expectations, delivered fix. R: retained/renewed + process change." },
      zh: { q: "分享你處理過最棘手的客戶/用戶問題。", s: "S:一位憤怒或被卡住的客戶。T:你負責這段關係。A:傾聽、找出真正需求、管理期望、給出解法。R:留住客戶 + 流程改善。" } },
    { rx: /deadline|pressure|tight|時程|壓力|截止/i,
      en: { q: "Describe a time you were about to miss a deadline. What did you do?", s: "S: timeline clearly at risk. T: still accountable. A: re-scoped, escalated early, negotiated trade-offs. R: what shipped on time + trust preserved." },
      zh: { q: "描述一次眼看要開天窗的經驗,你怎麼處理?", s: "S:時程明顯來不及。T:你仍要負責。A:重新界定範圍、提早升級、談判取捨。R:準時交付的部分 + 保住的信任。" } },
    { rx: /improve|optimi|process|efficien|優化|改善|流程|效率/i,
      en: { q: "Tell me about a process you improved. How did you measure the improvement?", s: "S: a slow/painful process. T: nobody asked you to fix it. A: measured baseline, redesigned, drove adoption. R: before/after numbers." },
      zh: { q: "分享一個你改善過的流程,你如何衡量改善成效?", s: "S:一個緩慢痛苦的流程。T:沒人要求你修它。A:先量測基準、重新設計、推動採用。R:改善前後的數據對比。" } },
    { rx: /launch|ship|product|go[- ]?to[- ]?market|上市|上線|產品/i,
      en: { q: "Walk me through a launch you drove. What went wrong and how did you react?", s: "S: the launch and its stakes. T: your role. A: plan, the thing that broke, your recovery. R: launch metrics + the playbook you kept." },
      zh: { q: "帶我走過一次你主導的上線/上市,過程中什麼出了錯?你如何反應?", s: "S:上線案與其重要性。T:你的角色。A:計畫、出錯的環節、你的補救。R:上線成果 + 留下的 playbook。" } },
    { rx: /quality|test|bug|reliab|品質|測試|穩定/i,
      en: { q: "Describe a time you had to trade off speed against quality.", s: "S: ship now vs ship right. T: the call was yours. A: quantified both risks, chose, mitigated the downside. R: outcome + what the mitigation caught." },
      zh: { q: "描述一次你必須在速度與品質間取捨的經驗。", s: "S:先上線 vs 做到好。T:由你決定。A:量化兩邊風險、做選擇、為缺點準備緩衝。R:結果 + 緩衝措施接住了什麼。" } },
    { rx: /new technolog|learn|adopt|新技術|學習|導入/i,
      en: { q: "Tell me about a technology or skill you picked up quickly for a project.", s: "S: project needed a skill you lacked. T: deadline real. A: learning plan, built something small first, asked experts. R: how fast you shipped + skill still in use." },
      zh: { q: "分享一次你為了專案快速學會新技術/新技能的經驗。", s: "S:專案需要你沒有的技能。T:期限是真的。A:學習計畫、先做小東西、請教專家。R:多快交付 + 這技能後續的使用。" } }
  ];

  var GENERIC_PRED = [
    { en: { q: "Tell me about a time you failed. What did you change afterward?", s: "S: real stakes. T: your responsibility. A: what went wrong and why. R: the concrete change + a later win it enabled." },
      zh: { q: "分享一次失敗經驗,事後你改變了什麼?", s: "S:有真實代價。T:你的責任。A:哪裡錯了、為什麼。R:具體的改變 + 後來因此成功的例子。" } },
    { en: { q: "Describe a time you disagreed with your manager's decision.", s: "S: the decision. T: you saw a risk. A: data-backed pushback in private, then commit. R: outcome + relationship intact." },
      zh: { q: "描述一次你不認同主管決策的經驗。", s: "S:那個決策。T:你看到風險。A:私下用數據反映,最後仍全力執行。R:結果 + 關係未受損。" } },
    { en: { q: "What achievement are you most proud of, and why?", s: "S: pick the one closest to this JD. T: your specific role. A: 3 concrete steps. R: the number that made it matter." },
      zh: { q: "你最自豪的成就是什麼?為什麼?", s: "S:挑最貼近這個 JD 的成就。T:你的具體角色。A:三個關鍵行動。R:讓它有份量的那個數字。" } },
    { en: { q: "Tell me about a time you took initiative without being asked.", s: "S: the gap you spotted. T: no one owned it. A: proposal, buy-in, execution. R: quantified impact." },
      zh: { q: "分享一次沒人要求、你主動出擊的經驗。", s: "S:你發現的缺口。T:沒有人負責。A:提案、取得支持、執行。R:量化影響。" } }
  ];

  /* ---------- question bank rendering ---------- */

  var CAT_LABELS = { classic: "Classic / HR", behavioral: "Behavioral", technical: "Technical" };

  function renderBank(cat) {
    var list = $("bankList");
    list.innerHTML = "";
    QUESTIONS.forEach(function (item) {
      if (cat !== "all" && item.cat !== cat) return;
      var div = document.createElement("div");
      div.className = "question-item";
      div.innerHTML = '<span class="q-cat"></span><div class="q-text" style="font-weight:600;"></div><div class="q-zh muted small"></div><div class="q-tip"></div>';
      div.querySelector(".q-cat").textContent = CAT_LABELS[item.cat];
      div.querySelector(".q-text").textContent = item.q;
      div.querySelector(".q-zh").textContent = item.zh || "";
      div.querySelector(".q-tip").textContent = "💡 " + item.tip;
      div.addEventListener("click", function () { div.classList.toggle("open"); });
      list.appendChild(div);
    });
  }

  document.querySelectorAll("#bankTabs .tab-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll("#bankTabs .tab-btn").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      renderBank(btn.dataset.cat);
    });
  });

  renderBank("all");

  /* ---------- JD analysis → predicted questions + weakness prep ---------- */

  var PRED_KEY = "dreamjob.predicted";

  function loadPredicted() {
    try { return JSON.parse(localStorage.getItem(PRED_KEY)) || null; }
    catch (e) { return null; }
  }

  $("ivAnalyzeBtn").addEventListener("click", function () {
    var jd = $("ivJd").value.trim();
    if (jd.length < 40) { $("ivJd").focus(); return; }
    var lang = $("ivLang").value;
    var matched = [];
    PRED_RULES.forEach(function (r) {
      if (r.rx.test(jd)) matched.push({ en: r.en, zh: r.zh });
    });
    for (var i = 0; matched.length < 8 && i < GENERIC_PRED.length; i++) matched.push(GENERIC_PRED[i]);
    matched = matched.slice(0, 10);

    var data = { questions: matched, lang: lang, company: $("ivCompany").value.trim(), role: $("ivRole").value.trim(), ts: Date.now() };
    localStorage.setItem(PRED_KEY, JSON.stringify(data));
    renderPredicted(data);
    renderWeakness(jd, lang);
    $("predictedCard").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  function renderPredicted(data) {
    if (!data) return;
    $("predictedCard").classList.remove("hidden");
    var box = $("predictedList");
    box.innerHTML = "";
    data.questions.forEach(function (item, i) {
      var t = item[data.lang] || item.en;
      var alt = data.lang === "zh" ? item.en : item.zh;
      var div = document.createElement("div");
      div.className = "question-item";
      div.innerHTML = '<span class="q-cat">Q' + (i + 1) + "</span><div style=\"font-weight:600;\" class=\"q-main\"></div><div class=\"q-alt muted small\"></div><div class=\"q-tip\"></div>";
      div.querySelector(".q-main").textContent = t.q;
      div.querySelector(".q-alt").textContent = alt ? alt.q : "";
      div.querySelector(".q-tip").textContent = "⭐ STAR 要點:" + t.s;
      div.addEventListener("click", function () { div.classList.toggle("open"); });
      box.appendChild(div);
    });
  }

  function renderWeakness(jd, lang) {
    var cv = (window.DJ && DJ.loadProfile().cv) || "";
    var box = $("weaknessList");
    $("weaknessCard").classList.remove("hidden");
    box.innerHTML = "";
    if (!cv.trim()) {
      box.innerHTML = '<p class="empty-state">到 <a href="profile.html">Profile</a> 貼上 CV,才能對照出 JD 要求但你缺少的關鍵字。</p>';
      return;
    }
    var m = DJ.matchCvToJd(cv, jd);
    if (!m.misses.length) {
      box.innerHTML = '<p class="empty-state">JD 的主要關鍵字你的 CV 全部涵蓋 — 沒有明顯弱點題。🎉</p>';
      return;
    }
    var strengths = m.hits.slice(0, 6).join(lang === "zh" ? "、" : ", ") || (lang === "zh" ? "你的核心技能" : "your core skills");
    m.misses.slice(0, 5).forEach(function (w) {
      var div = document.createElement("div");
      div.className = "finding";
      var body = lang === "zh"
        ? "<strong>可能被問:「你似乎沒有 " + esc(w) + " 的經驗?」</strong>" +
          "答法:①承認差距,不硬拗。②指出最相近的可轉移經驗 — 從你的強項(" + esc(strengths) + ")中挑與 " + esc(w) + " 原理相通的實例。③說明你已開始補強(課程/side project),並用過去快速上手的紀錄佐證。"
        : "<strong>Likely probe: “You don't seem to have " + esc(w) + " experience?”</strong>" +
          "Answer: ① Acknowledge the gap honestly. ② Bridge with your most transferable experience — pick something from your strengths (" + esc(strengths) + ") that shares the same principles as " + esc(w) + ". ③ Show you're already closing it (course/side project) and cite a past record of learning fast.";
      div.innerHTML = '<div class="f-icon">🛡️</div><div class="f-body">' + body + "</div>";
      box.appendChild(div);
    });
  }

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  // restore last analysis
  (function () {
    var prev = loadPredicted();
    if (prev) renderPredicted(prev);
    if ($("ivJd").value.trim().length > 40) renderWeakness($("ivJd").value, prev ? prev.lang : "zh");
  })();

  /* ---------- BEAT self-intro builder ---------- */

  var BEAT_KEY = "dreamjob.beat";

  function loadBeat() {
    try { return JSON.parse(localStorage.getItem(BEAT_KEY)) || {}; }
    catch (e) { return {}; }
  }

  (function fillBeat() {
    var b = loadBeat();
    ["beatCompany", "beatPain", "beatB", "beatE", "beatA", "beatT"].forEach(function (id) {
      if (b[id]) $(id).value = b[id];
    });
    if (b.output) { $("beatOutput").value = b.output; $("beatCopyBtn").disabled = false; }
  })();

  function saveBeat() {
    var b = {};
    ["beatCompany", "beatPain", "beatB", "beatE", "beatA", "beatT"].forEach(function (id) { b[id] = $(id).value; });
    b.output = $("beatOutput").value;
    localStorage.setItem(BEAT_KEY, JSON.stringify(b));
  }

  ["beatCompany", "beatPain", "beatB", "beatE", "beatA", "beatT", "beatOutput"].forEach(function (id) {
    $(id).addEventListener("input", saveBeat);
  });

  $("beatFromCvBtn").addEventListener("click", function (e) {
    e.preventDefault();
    var cv = (window.DJ && DJ.loadProfile().cv) || "";
    if (!cv.trim()) { window.location.href = "profile.html"; return; }
    var lines = DJ.achievementLines(cv, 2);
    if (lines.length) $("beatA").value = lines.join("\n");
    saveBeat();
  });

  $("beatGenBtn").addEventListener("click", function () {
    var company = $("beatCompany").value.trim() || "貴公司 / your company";
    var pain = $("beatPain").value.trim();
    var B = $("beatB").value.trim(), E = $("beatE").value.trim(), A = $("beatA").value.trim(), T = $("beatT").value.trim();
    if (!B || !E || !A) {
      (!B ? $("beatB") : !E ? $("beatE") : $("beatA")).focus();
      return;
    }
    var zh = "【中文版 ~90 秒】\n" +
      B + "\n\n" + E + "\n\n" +
      "其中我最想分享的成果是:" + A +
      (pain ? "\n\n我知道 " + company + " 目前正需要" + pain + " — 這正是我做過、也做出成績的事。" : "") +
      (T ? "\n\n" + T : "") +
      "\n\n這也是我認為自己能立即為 " + company + " 帶來價值的原因。";
    var en = "【English version ~90s】\n" +
      B + "\n\n" + E + "\n\n" +
      "The result I'm most proud of: " + A +
      (pain ? "\n\nFrom the JD, I understand " + company + " needs someone to tackle: " + pain + " — which is exactly the kind of problem I've solved before." : "") +
      (T ? "\n\n" + T : "") +
      "\n\nThat's why I believe I can add value at " + company + " from day one.";
    $("beatOutput").value = zh + "\n\n" + "─".repeat(30) + "\n\n" + en +
      "\n\n(提示:英文版請將中文素材翻成英文後重貼;兩版本需與你的 CV 和 Cover Letter 敘事一致。)";
    $("beatCopyBtn").disabled = false;
    saveBeat();
    $("beatOutput").scrollIntoView({ behavior: "smooth", block: "center" });
  });

  $("beatCopyBtn").addEventListener("click", function () {
    navigator.clipboard.writeText($("beatOutput").value).then(function () {
      $("beatCopyBtn").textContent = "✓ 已複製";
      setTimeout(function () { $("beatCopyBtn").textContent = "📋 複製"; }, 1600);
    });
  });

  /* ---------- reverse questions (select 3–5, copy) ---------- */

  var REV_KEY = "dreamjob.reverseSel";

  function loadRev() {
    try { return JSON.parse(localStorage.getItem(REV_KEY)) || {}; }
    catch (e) { return {}; }
  }

  function renderReverse() {
    var sel = loadRev();
    var box = $("reverseList");
    box.innerHTML = "";
    REVERSE_QS.forEach(function (q, i) {
      var row = document.createElement("div");
      row.className = "checklist-item";
      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.id = "rev" + i;
      cb.checked = !!sel[i];
      var lb = document.createElement("label");
      lb.htmlFor = cb.id;
      lb.innerHTML = "<span style='text-decoration:none;'>" + esc(q.zh) + "</span><br><span class='muted small'>" + esc(q.en) + "</span>";
      cb.addEventListener("change", function () {
        var s = loadRev();
        s[i] = cb.checked;
        localStorage.setItem(REV_KEY, JSON.stringify(s));
        updateRevCount();
      });
      row.appendChild(cb);
      row.appendChild(lb);
      box.appendChild(row);
    });
    updateRevCount();
  }

  function updateRevCount() {
    var sel = loadRev();
    $("reverseCount").textContent = REVERSE_QS.filter(function (_, i) { return sel[i]; }).length;
  }

  $("reverseCopyBtn").addEventListener("click", function () {
    var sel = loadRev();
    var picked = REVERSE_QS.filter(function (_, i) { return sel[i]; });
    if (!picked.length) return;
    var text = picked.map(function (q, i) { return (i + 1) + ". " + q.zh + "\n   " + q.en; }).join("\n");
    navigator.clipboard.writeText(text).then(function () {
      $("reverseCopyBtn").innerHTML = "✓ 已複製 <span id='reverseCount'>" + picked.length + "</span> 題";
    });
  });

  renderReverse();

  /* ---------- practice mode ---------- */

  var currentQ = null;
  var timerId = null;
  var remaining = 0;
  var NOTES_KEY = "dreamjob.practiceNotes";

  function fmt(sec) {
    var m = Math.floor(sec / 60), s = sec % 60;
    return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  }

  function loadNotes() {
    try { return JSON.parse(localStorage.getItem(NOTES_KEY)) || {}; }
    catch (e) { return {}; }
  }

  function practicePool() {
    var cat = $("practiceCat").value;
    var lang = $("practiceLang").value;
    if (cat === "predicted") {
      var pred = loadPredicted();
      if (!pred || !pred.questions.length) return [];
      return pred.questions.map(function (item) {
        var t = item[lang] || item.en;
        return { key: item.en.q, text: t.q };
      });
    }
    return QUESTIONS
      .filter(function (q) { return cat === "all" || q.cat === cat; })
      .map(function (q) { return { key: q.q, text: lang === "zh" && q.zh ? q.zh : q.q }; });
  }

  function pickQuestion() {
    var pool = practicePool();
    if (!pool.length) {
      $("practiceQ").textContent = "先在上方「針對目標職缺準備」貼上 JD 並分析,才會有預測題。";
      return;
    }
    var next;
    do { next = pool[Math.floor(Math.random() * pool.length)]; }
    while (pool.length > 1 && currentQ && next.key === currentQ.key);
    currentQ = next;
    $("practiceQ").textContent = currentQ.text;
    stopTimer();
    remaining = parseInt($("practiceTime").value, 10);
    $("practiceTimer").textContent = fmt(remaining);
    $("practiceTimer").style.color = "";
    $("startTimerBtn").disabled = false;
    $("stopTimerBtn").disabled = true;
    $("practiceNotes").value = loadNotes()[currentQ.key] || "";
  }

  function startTimer() {
    if (!currentQ || timerId) return;
    $("startTimerBtn").disabled = true;
    $("stopTimerBtn").disabled = false;
    timerId = setInterval(function () {
      remaining--;
      $("practiceTimer").textContent = fmt(Math.max(0, remaining));
      if (remaining <= 10) $("practiceTimer").style.color = "var(--red)";
      if (remaining <= 0) {
        stopTimer();
        $("practiceTimer").textContent = "Time's up!";
      }
    }, 1000);
  }

  function stopTimer() {
    if (timerId) { clearInterval(timerId); timerId = null; }
    $("startTimerBtn").disabled = !currentQ;
    $("stopTimerBtn").disabled = true;
  }

  $("newQBtn").addEventListener("click", pickQuestion);
  $("startTimerBtn").addEventListener("click", startTimer);
  $("stopTimerBtn").addEventListener("click", stopTimer);
  $("practiceNotes").addEventListener("input", function () {
    if (!currentQ) return;
    var notes = loadNotes();
    notes[currentQ.key] = $("practiceNotes").value;
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  });

  /* ---------- checklist ---------- */

  var CHECKLIST = [
    "重讀 JD 與自己的 CV — 每一行都可能被追問 Re-read the JD and your CV",
    "研究公司:產品、近期新聞、競爭者、文化 Research the company",
    "準備 4–6 個 STAR 故事(領導/衝突/失敗/主動)Prepare 4–6 STAR stories",
    "用 BEAT 產生器準備 90 秒自我介紹,大聲唸兩次 Prepare your 90-second BEAT intro",
    "檢視「弱點題預備」,每個缺口準備好可轉移能力說法 Review weakness prep",
    "勾選 3–5 個反問面試官的問題 Pick 3–5 reverse questions",
    "查薪資行情,決定目標數字與底線 Research the salary band",
    "確認時間、形式、面試官姓名(LinkedIn 查一下)Confirm logistics & interviewers",
    "測試鏡頭/麥克風/網路,或規劃路線提早 10 分鐘到 Test setup / plan the route",
    "準備紙本 CV、作品集連結、紙筆 Bring CV copies & portfolio links",
    "睡飽 — 熬夜臨時抱佛腳得不償失 Get a full night's sleep",
    "面試後 24 小時內寄感謝信 Send a thank-you note within 24h"
  ];

  var CHECK_KEY = "dreamjob.checklist";

  function loadChecks() {
    try { return JSON.parse(localStorage.getItem(CHECK_KEY)) || {}; }
    catch (e) { return {}; }
  }

  function renderChecklist() {
    var box = $("checklist");
    var state = loadChecks();
    box.innerHTML = "";
    CHECKLIST.forEach(function (item, i) {
      var row = document.createElement("div");
      row.className = "checklist-item";
      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.id = "chk" + i;
      cb.checked = !!state[i];
      var lb = document.createElement("label");
      lb.htmlFor = cb.id;
      lb.textContent = item;
      cb.addEventListener("change", function () {
        var s = loadChecks();
        s[i] = cb.checked;
        localStorage.setItem(CHECK_KEY, JSON.stringify(s));
      });
      row.appendChild(cb);
      row.appendChild(lb);
      box.appendChild(row);
    });
  }

  $("resetChecklist").addEventListener("click", function () {
    localStorage.removeItem(CHECK_KEY);
    renderChecklist();
  });

  renderChecklist();
})();
