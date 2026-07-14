/* ============ DreamJOB — interview preparation ============ */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };

  /* ---------- question bank ---------- */

  var QUESTIONS = [
    /* classic / HR */
    { cat: "classic", q: "Tell me about yourself.", tip: "Use Present–Past–Future in ~90 seconds: what you do now and are great at → the experience that got you here → why this role is the natural next step. Tailor the whole thing to the job description; this is a pitch, not a biography." },
    { cat: "classic", q: "Why do you want to work here?", tip: "Show you did homework: name something specific (product, engineering blog post, market move) and connect it to what you want to build or learn. Companies hire people who chose them, not people who need any job." },
    { cat: "classic", q: "Why are you leaving your current job?", tip: "Never badmouth. Frame as running toward, not running away: growth, scope, technology, mission. One sentence on the past, three on the future." },
    { cat: "classic", q: "What are your greatest strengths?", tip: "Pick 2 strengths the job description actually asks for, and prove each with a one-line example with a number in it. A strength without evidence is a buzzword." },
    { cat: "classic", q: "What is your biggest weakness?", tip: "Name a real (but non-fatal) weakness + the concrete system you use to manage it + evidence of improvement. Avoid the fake-humble 'I'm a perfectionist'." },
    { cat: "classic", q: "Where do you see yourself in five years?", tip: "Show ambition compatible with this company: deeper expertise, larger scope, leading projects or people. They're checking that the role fits your trajectory, not asking for a psychic reading." },
    { cat: "classic", q: "What are your salary expectations?", tip: "Research the band first (Glassdoor, Levels.fyi, 104 salary reports). Give a researched range anchored slightly high, or politely ask for the role's budgeted band before naming a number." },
    { cat: "classic", q: "Why should we hire you?", tip: "Summarize your 3 strongest matches to the job description, each with proof. This is your closing argument — prepare it word-for-word and deliver it with confidence." },

    /* behavioral */
    { cat: "behavioral", q: "Tell me about a time you led a project end to end.", tip: "STAR. Emphasize how you defined scope, aligned stakeholders, and handled the biggest obstacle. End with the shipped result and its measurable impact." },
    { cat: "behavioral", q: "Describe a conflict with a coworker and how you resolved it.", tip: "Pick a professional disagreement (approach, priorities), not a personality clash. Show you sought their perspective first, found shared goals, and reached a resolution that helped the project. No villains." },
    { cat: "behavioral", q: "Tell me about a time you failed.", tip: "Choose a real failure with real stakes, own it without excuses, then spend most of the answer on what you changed afterward — and ideally a later win that the lesson enabled." },
    { cat: "behavioral", q: "Describe a time you had to meet a very tight deadline.", tip: "Show prioritization: what you cut, what you negotiated, how you communicated risk early. Delivering by burning out alone is a weaker story than delivering by working smart." },
    { cat: "behavioral", q: "Tell me about a time you disagreed with your manager.", tip: "Show respectful pushback backed by data, and commitment to the final decision either way ('disagree and commit'). Interviewers are testing both spine and maturity." },
    { cat: "behavioral", q: "Give an example of a time you took initiative beyond your job scope.", tip: "Pick something you spotted, proposed and drove without being asked, with a quantified result. This is the single most predictive 'ownership' signal for many interviewers." },
    { cat: "behavioral", q: "Tell me about a time you had to learn something quickly.", tip: "Structure: why the deadline was real → your learning plan (docs, experts, building something small) → how fast you became productive → the outcome. Shows meta-skill of learning, not just the one technology." },
    { cat: "behavioral", q: "Describe a time you received difficult feedback.", tip: "Show that you listened without defensiveness, asked clarifying questions, made a visible change, and thanked the person. Bonus points if you later sought more feedback proactively." },

    /* technical / problem solving */
    { cat: "technical", q: "Walk me through the project you're most proud of.", tip: "Pick the project most relevant to this role. Structure: the problem and why it was hard → your specific contribution → key technical decisions and trade-offs → measured results. Be ready to go 3 levels deep on any detail you mention." },
    { cat: "technical", q: "How would you design [a system relevant to the role]?", tip: "Don't jump to solutions. Clarify requirements and scale first, propose a simple design, then evolve it while narrating trade-offs (consistency vs availability, build vs buy, cost). Interviewers grade the reasoning, not the final diagram." },
    { cat: "technical", q: "How do you approach debugging a hard problem?", tip: "Describe a method: reproduce reliably → isolate by bisecting the system → form and test hypotheses → fix the root cause, not the symptom → add a regression test/alert. Illustrate with a 30-second war story." },
    { cat: "technical", q: "How do you decide between competing technical approaches?", tip: "Show a framework: requirements, constraints, reversibility, cost of being wrong, prototyping the risky part first. Name a real decision, the option you rejected, and why — rejected options prove real judgment." },
    { cat: "technical", q: "How do you keep your skills up to date?", tip: "Be specific: what you read/build/follow and — most importantly — the last new thing you learned and applied at work. 'I built X with Y last quarter' beats any list of newsletters." },
    { cat: "technical", q: "Estimate something unusual (e.g. how many coffees are sold in Taipei per day).", tip: "Fermi estimation: state assumptions out loud, decompose (population × habits × price), compute round numbers, sanity-check the result. The number doesn't matter; the structured thinking does." },

    /* questions to ask them */
    { cat: "ask", q: "What does success look like in this role after 6 and 12 months?", tip: "Signals outcome-orientation, and the answer tells you whether expectations are realistic and how clearly the role is defined." },
    { cat: "ask", q: "What's the biggest challenge the team is facing right now?", tip: "Shows you want the real picture, and gives you material for a killer follow-up ('here's how I dealt with something similar…')." },
    { cat: "ask", q: "How does the team handle code review / quality / technical debt?", tip: "Reveals real engineering culture better than any careers-page slogan. Vague answers are a yellow flag." },
    { cat: "ask", q: "Can you tell me about the growth path of someone who joined in this role?", tip: "Concrete promotion stories = real growth. If the interviewer struggles to name one, note it." },
    { cat: "ask", q: "What made you join, and what makes you stay?", tip: "People love this question, it builds rapport, and hesitation before 'what makes you stay' tells you a lot." },
    { cat: "ask", q: "What are the next steps in the interview process?", tip: "Always close with this. It shows interest and gives you a timeline so you can manage competing offers." }
  ];

  /* ---------- question bank rendering ---------- */

  var CAT_LABELS = { classic: "Classic / HR", behavioral: "Behavioral", technical: "Technical", ask: "Ask them" };

  function renderBank(cat) {
    var list = $("bankList");
    list.innerHTML = "";
    QUESTIONS.forEach(function (item) {
      if (cat !== "all" && item.cat !== cat) return;
      var div = document.createElement("div");
      div.className = "question-item";
      div.innerHTML = '<span class="q-cat"></span><div class="q-text" style="font-weight:600;"></div><div class="q-tip"></div>';
      div.querySelector(".q-cat").textContent = CAT_LABELS[item.cat];
      div.querySelector(".q-text").textContent = item.q;
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

  function pickQuestion() {
    var cat = $("practiceCat").value;
    var pool = QUESTIONS.filter(function (q) { return cat === "all" || q.cat === cat; });
    var next;
    do { next = pool[Math.floor(Math.random() * pool.length)]; }
    while (pool.length > 1 && currentQ && next.q === currentQ.q);
    currentQ = next;
    $("practiceQ").textContent = currentQ.q;
    stopTimer();
    remaining = parseInt($("practiceTime").value, 10);
    $("practiceTimer").textContent = fmt(remaining);
    $("practiceTimer").style.color = "";
    $("startTimerBtn").disabled = false;
    $("stopTimerBtn").disabled = true;
    $("practiceNotes").value = loadNotes()[currentQ.q] || "";
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
    notes[currentQ.q] = $("practiceNotes").value;
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  });

  /* ---------- checklist ---------- */

  var CHECKLIST = [
    "Re-read the job description and your CV — know every line you may be asked about",
    "Research the company: product, recent news, competitors, culture",
    "Prepare 4–6 STAR stories covering leadership, conflict, failure and initiative",
    "Prepare your 90-second 'tell me about yourself' pitch and say it out loud twice",
    "Prepare 3+ questions to ask the interviewer",
    "Research the salary band and decide your target and walk-away numbers",
    "Confirm time, format (onsite/video), interviewer names — look them up on LinkedIn",
    "Test camera, mic and network (video) / plan the route and arrive 10 min early (onsite)",
    "Prepare copies of your CV, portfolio links, and a pen & notebook",
    "Plan your outfit one notch above the company's dress code",
    "Get a full night's sleep — cramming past midnight costs more than it gains",
    "Send a thank-you note within 24 hours after the interview"
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
