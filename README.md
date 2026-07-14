# DreamJOB 💼

An all-in-one job hunting toolkit — 求職一站式工具:

- **👤 My Profile** (`profile.html`) — 履歷與求職目標只填一次,全站共用
  (localStorage);可匯出 `profile.json` 給每日職缺機器人。
- **🔍 Job Search & 職缺配對** (`jobs.html`) — 一個表單同時搜尋
  **LinkedIn**、**104 人力銀行**、**Indeed**(地點、104 地區、職務類別、產業、
  等級、遠端、刊登時間篩選);貼上任何 JD 立即計算與你 CV 的**匹配度**、缺少的
  ATS 關鍵字與 XYZ wording 建議;內建**應徵追蹤器**與「📡 今日市場最新職缺」
  每日榜單。
- **🩺 CV Doctor** (`cv.html`) — 6 大面向即時評分、**ATS 模擬篩選**
  (加分/缺少關鍵字)、**Google XYZ formula**("Accomplished X as measured by Y,
  by doing Z")改寫建議、依目標職務/等級/產業客製化建議,以及中英文
  **Cover Letter / 推薦信產生器**(可編輯 template)。
- **🎤 Interview Prep** (`interview.html`) — 貼上 JD **預測 8–10 題**
  behavioral/situational 面試題(附 STAR 答題要點,中英雙語)、**BEAT 架構**
  自我介紹產生器(Background → Experience → Achievement → Type)、
  **弱點題預備**(可轉移能力框架)、反問面試官題庫(勾選 3–5 題)、
  計時模擬練習與行前檢查清單。

## 每日 Top 10 職缺 Email 📬

GitHub Actions 每天 09:00(台北)自動執行 `scripts/daily-jobs.mjs`:

1. 讀取 `profile/profile.json`(搜尋條件 + CV 關鍵字指紋)。
2. 並行抓取 **104**(站內 JSON API)、**LinkedIn**(免登入 guest 端點)、
   **Yourator**(公開 API)、**Indeed**(best-effort,被擋即降級為搜尋連結)。
   各來源獨立容錯,失敗會在信中註明。
3. 去重、依 CV 匹配度排序,取 Top 10。
4. 寄出 HTML email,並把 `data/latest.json` commit 回 repo —
   網站的 Job Search 頁會自動顯示同一份榜單。

### 設定步驟

1. 在 Profile 頁下載你的 `profile.json`,覆蓋 repo 中的 `profile/profile.json` 並 commit。
2. GitHub repo → Settings → Secrets and variables → Actions,新增三個 secrets:
   | Secret | 內容 |
   |---|---|
   | `MAIL_USERNAME` | Gmail 帳號(寄件者) |
   | `MAIL_PASSWORD` | Gmail **應用程式密碼**(Google 帳戶 → 安全性 → 兩步驟驗證 → 應用程式密碼) |
   | `MAIL_TO` | 收件信箱 |
3. Actions 頁面手動觸發 **Daily Top 10 Jobs**(workflow_dispatch)測試一次。

> 注:LinkedIn guest 端點有 rate limit、Indeed 有 Cloudflare 防護 — 這兩個來源
> 屬 best-effort,失敗時信件仍會照常寄出並附深度連結。104 與 Yourator 最穩定。

## 🌐 線上使用(推薦)

repo 已內建 GitHub Pages 自動部署(`.github/workflows/pages.yml`)。**一次性啟用**:

1. GitHub repo → **Settings → Pages → Build and deployment → Source** 選 **GitHub Actions**。
2. 到 **Actions** 頁手動執行一次 **Deploy to GitHub Pages**(之後每次 push 都會自動部署)。
3. 完成!網站常駐在 **https://wenhsuan0810.github.io/DreamJOB/**,手機、電腦直接開。

每日職缺機器人 commit `data/latest.json` 時也會觸發重新部署,所以打開網站
就能看到當天最新的 Top 10 榜單。

## Running the site

純靜態網站 — 無 build、無依賴、無後端:

```bash
python3 -m http.server 8000   # http://localhost:8000
```

可直接部署到 GitHub Pages / Netlify / Vercel。

## Privacy

網站功能 100% 在瀏覽器執行;CV、JD、追蹤器、筆記都只存在 localStorage。
`profile/profile.json` 只含關鍵字指紋與搜尋條件,**不含履歷全文**。

## Structure

```
index.html            Landing page
profile.html          共用個人檔案(CV + 求職目標 + profile.json 匯出)
jobs.html             多平台搜尋 + 職缺配對 + 每日榜單 + 應徵追蹤
cv.html               CV 診斷 / ATS / XYZ 改寫 / Cover Letter & 推薦信
interview.html        JD 預測題 / BEAT 自介 / 弱點題 / 反問 / 計時練習
assets/match.js       共用配對引擎(中英斷詞、CV↔JD 匹配、XYZ)
assets/*.js           各頁邏輯
scripts/daily-jobs.mjs  每日多來源職缺抓取器(Node 20,零依賴)
.github/workflows/daily-top10.yml  每日排程 + 寄信
profile/profile.json  機器人搜尋條件與 CV 關鍵字指紋
data/latest.json      每日榜單(由 Actions 自動 commit)
```
