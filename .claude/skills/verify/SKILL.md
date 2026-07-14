---
name: verify
description: Build/launch/drive recipe for verifying DreamJOB (static site) changes end-to-end in a headless browser.
---

# Verifying DreamJOB

DreamJOB is a pure static site (no build step, no dependencies). Verify by
serving it and driving it with the pre-installed Chromium via playwright-core.

## Launch

```bash
# serve from the repo root
python3 -m http.server 8741 &

# one-time per session: playwright-core in the scratchpad (browser is pre-installed)
cd <scratchpad> && npm init -y && npm install playwright-core
```

Launch Chromium with `executablePath: '/opt/pw-browsers/chromium'`
(a symlink to the real binary — do NOT append `/chrome-linux/chrome`).

## Flows worth driving

- **jobs.html** — fill `#keywords`, pick filters, click `#buildBtn`; assert the
  three URL previews (`#urlLinkedin`, `#url104`, `#urlIndeed`) contain the
  expected query params. Add a tracker row, change its status, reload (localStorage
  persistence), delete it.
- **cv.html** — click `#sampleBtn` and assert `#scoreNum`, findings and rewrite
  pairs render; paste a JD into `#jdText` + `#analyzeBtn` and assert `#keywordCard`
  unhides with hit/miss chips. Probe: `#analyzeBtn` with empty CV must keep
  `#results` hidden.
- **interview.html** — count `#bankList .question-item` per tab, click one to
  toggle its tip; `#newQBtn` → `#startTimerBtn` and assert the timer counts down;
  type in `#practiceNotes`, reload, check `localStorage['dreamjob.practiceNotes']`;
  check `#chk0`, reload, assert still checked.

Collect `console`/`pageerror` events on every page — the bar is zero errors.

- **profile.html** — fill `#pfCv`/`#pfRole`, click `#pfSaveBtn`, reload → values persist
  (key `dreamjob.profile`). All pages read the CV from here via `DJ.loadProfile()`.
- **jobs.html match basket** — fill `#mjTitle` + `#mjJd`, click `#mjAddBtn` → `.pill` shows
  匹配度 %, expanding shows hit/miss chips + XYZ suggestions. Digest section `#digestCard`
  only appears when `data/latest.json` exists (generate via the mock harness below).
- **cv.html letters** — fill `#clCompany`/`#clRole`, `#genLetterBtn` → `#letterOutput` filled;
  `[data-letter="reco"]` + `#clLang`=zh for the Chinese recommendation letter.
- **interview.html JD flow** — fill `#ivJd`, click `#ivAnalyzeBtn` → 8–10 `#predictedList`
  items + `#weaknessList` cards (needs profile CV). BEAT: `#beatFromCvBtn` pulls quantified
  CV lines; `#beatGenBtn` outputs zh+en scripts.
- **scripts/daily-jobs.mjs** — 104/LinkedIn/Yourator/Indeed are proxy-blocked in this sandbox;
  test the pipeline with a mock-fetch harness that stubs `globalThis.fetch` before
  `import`ing the script (see scratchpad `test-daily.mjs` pattern), then check
  `out/email.html` + `data/latest.json`. Real fetches only work on GitHub Actions
  (`workflow_dispatch` the "Daily Top 10 Jobs" workflow).

## Gotchas

- localStorage keys: `dreamjob.recentSearches`, `dreamjob.applications`,
  `dreamjob.practiceNotes`, `dreamjob.checklist`.
- Full-page screenshots repeat the sticky header mid-page — that's a
  screenshot artifact, not a bug.
