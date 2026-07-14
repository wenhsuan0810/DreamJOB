#!/usr/bin/env node
/**
 * DreamJOB — daily multi-source job fetcher.
 *
 * Reads profile/profile.json, fetches the newest matching jobs from
 * 104 / LinkedIn (guest endpoint) / Yourator / Indeed (best-effort),
 * scores each against the CV keyword fingerprint, and writes:
 *   - out/email.html   (Top 10 email body)
 *   - out/subject.txt  (email subject)
 *   - data/latest.json (rendered by jobs.html "今日市場最新職缺")
 *
 * Zero dependencies — Node 18+ (global fetch).
 * Each source fails independently; failures are reported in the email
 * with a deep-link fallback so the digest always goes out.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

/* ---------------- profile ---------------- */

function loadProfile() {
  const p = JSON.parse(readFileSync(join(ROOT, "profile", "profile.json"), "utf8"));
  if (!p.searches || !p.searches.length || !p.searches[0].keyword) {
    throw new Error("profile/profile.json needs at least one search with a keyword");
  }
  p.cvKeywords = (p.cvKeywords || []).map((k) => String(k).toLowerCase());
  return p;
}

/* ---------------- scoring (same idea as assets/match.js) ---------------- */

function scoreJob(job, cvKeywords, searchKeyword) {
  const text = ((job.title || "") + " " + (job.company || "") + " " + (job.desc || "")).toLowerCase();
  if (!cvKeywords.length) return 50;
  let hits = 0;
  const matched = [];
  for (const k of cvKeywords) {
    if (k.length < 2) continue;
    if (text.includes(k)) { hits++; matched.push(k); }
  }
  let score = Math.round((hits / Math.min(cvKeywords.length, 25)) * 85);
  const kw = (searchKeyword || "").toLowerCase();
  if (kw && (job.title || "").toLowerCase().includes(kw)) score += 14;
  job.matchedKeywords = matched.slice(0, 8);
  return Math.min(99, score);
}

/* ---------------- fetch helpers ---------------- */

async function fetchWithRetry(url, opts = {}, retries = 3) {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { ...opts, headers: { "User-Agent": UA, ...(opts.headers || {}) } });
      if (res.status === 429 || res.status >= 500) throw new Error("HTTP " + res.status);
      return res;
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 2000 * Math.pow(2, i)));
    }
  }
  throw lastErr;
}

function stripTags(html) {
  return html.replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
}

/* ---------------- sources ---------------- */

async function fetch104(search) {
  const params = new URLSearchParams({
    ro: "0", keyword: search.keyword, order: "16", asc: "0",
    page: "1", mode: "s", jobsource: "index_s"
  });
  if (search.area) params.set("area", search.area);
  if (search.jobexp) params.set("jobexp", search.jobexp);
  params.set("isnew", "3"); // posted within 3 days — "newest on the market"

  const headers = { Referer: "https://www.104.com.tw/jobs/search/", Accept: "application/json" };
  // primary endpoint, then legacy fallback
  const urls = [
    "https://www.104.com.tw/jobs/search/api/jobs?" + params.toString(),
    "https://www.104.com.tw/jobs/search/list?" + params.toString()
  ];
  let data = null, lastErr = null;
  for (const url of urls) {
    try {
      const res = await fetchWithRetry(url, { headers });
      if (!res.ok) { lastErr = new Error("HTTP " + res.status); continue; }
      data = await res.json();
      break;
    } catch (e) { lastErr = e; }
  }
  if (!data) throw lastErr || new Error("104: no data");

  const list = data.data?.list || data.data || [];
  return (Array.isArray(list) ? list : []).slice(0, 30).map((j) => ({
    source: "104",
    title: j.jobName || j.jobNameSnippet && stripTags(j.jobNameSnippet) || "",
    company: j.custName || "",
    location: j.jobAddrNoDesc || j.jobAddress || "",
    desc: stripTags(j.description || ""),
    url: j.link?.job ? (j.link.job.startsWith("//") ? "https:" + j.link.job : j.link.job)
       : j.jobNo ? "https://www.104.com.tw/job/" + j.jobNo : "https://www.104.com.tw/jobs/search/?keyword=" + encodeURIComponent(search.keyword),
    date: j.appearDate || ""
  })).filter((j) => j.title);
}

async function fetchLinkedIn(search) {
  // public guest endpoint (no auth) — returns HTML job cards; rate-limited, so retry+degrade
  const params = new URLSearchParams({
    keywords: search.keyword,
    location: search.location || "Taiwan",
    f_TPR: "r86400", // past 24h — newest only
    start: "0"
  });
  const url = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?" + params.toString();
  const res = await fetchWithRetry(url, { headers: { Accept: "text/html" } });
  if (!res.ok) throw new Error("LinkedIn HTTP " + res.status);
  const html = await res.text();

  const jobs = [];
  const cardRe = /<li[\s>][\s\S]*?<\/li>/g;
  for (const card of html.match(cardRe) || []) {
    const title = card.match(/base-search-card__title[^>]*>([\s\S]*?)<\//);
    const company = card.match(/base-search-card__subtitle[^>]*>[\s\S]*?>([\s\S]*?)<\/a>/) ||
                    card.match(/base-search-card__subtitle[^>]*>([\s\S]*?)<\//);
    const loc = card.match(/job-search-card__location[^>]*>([\s\S]*?)<\//);
    const link = card.match(/href="(https:\/\/[a-z]{2,3}\.linkedin\.com\/jobs\/view\/[^"?]+|https:\/\/www\.linkedin\.com\/jobs\/view\/[^"?]+)/);
    if (title && link) {
      jobs.push({
        source: "LinkedIn",
        title: stripTags(title[1]),
        company: company ? stripTags(company[1]) : "",
        location: loc ? stripTags(loc[1]) : "",
        desc: "",
        url: link[1],
        date: ""
      });
    }
    if (jobs.length >= 25) break;
  }
  if (!jobs.length) throw new Error("LinkedIn: 0 cards parsed (endpoint may be rate-limiting)");
  return jobs;
}

async function fetchYourator(search) {
  const url = "https://www.yourator.co/api/v4/jobs?" + new URLSearchParams({ term: search.keyword, page: "1" });
  const res = await fetchWithRetry(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Yourator HTTP " + res.status);
  const data = await res.json();
  return (data.jobs || []).slice(0, 20).map((j) => ({
    source: "Yourator",
    title: j.name || "",
    company: j.company?.brand || j.company?.name || "",
    location: j.company?.area || "",
    desc: stripTags(j.description || ""),
    url: j.path ? "https://www.yourator.co" + j.path : "https://www.yourator.co/jobs?term=" + encodeURIComponent(search.keyword),
    date: ""
  })).filter((j) => j.title);
}

async function fetchIndeed(search) {
  // Heavily bot-protected (Cloudflare); one polite attempt, then degrade.
  const url = "https://tw.indeed.com/jobs?" + new URLSearchParams({ q: search.keyword, l: search.location || "", fromage: "1" });
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" } });
  if (!res.ok) throw new Error("Indeed HTTP " + res.status);
  const html = await res.text();
  const m = html.match(/window\.mosaic\.providerData\["mosaic-provider-jobcards"\]\s*=\s*(\{[\s\S]*?\});/);
  if (!m) throw new Error("Indeed: job data not found (likely bot-blocked)");
  const results = JSON.parse(m[1])?.metaData?.mosaicProviderJobCardsModel?.results || [];
  return results.slice(0, 20).map((j) => ({
    source: "Indeed",
    title: j.title || "",
    company: j.company || "",
    location: j.formattedLocation || "",
    desc: stripTags(j.snippet || ""),
    url: j.jobkey ? "https://tw.indeed.com/viewjob?jk=" + j.jobkey : url,
    date: j.formattedRelativeTime || ""
  })).filter((j) => j.title);
}

/* ---------------- pipeline ---------------- */

function dedupe(jobs) {
  const seen = new Set();
  return jobs.filter((j) => {
    const key = (j.title + "|" + j.company).toLowerCase().replace(/\s+/g, "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function deepLinks(search) {
  const kw = encodeURIComponent(search.keyword);
  return {
    "104": "https://www.104.com.tw/jobs/search/?keyword=" + kw + (search.area ? "&area=" + search.area : ""),
    LinkedIn: "https://www.linkedin.com/jobs/search/?keywords=" + kw + "&location=" + encodeURIComponent(search.location || "Taiwan") + "&f_TPR=r86400",
    Yourator: "https://www.yourator.co/jobs?term=" + kw,
    Indeed: "https://tw.indeed.com/jobs?q=" + kw + "&fromage=1"
  };
}

const SOURCE_COLORS = { "104": "#ff7800", LinkedIn: "#0a66c2", Yourator: "#00c3a0", Indeed: "#2557a7" };

function esc(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function buildEmail(top, failures, search, dateStr) {
  const links = deepLinks(search);
  const rows = top.map((j, i) => `
    <tr>
      <td style="padding:12px 14px;border-bottom:1px solid #e5e7eb;vertical-align:top;">
        <div style="font-size:15px;font-weight:700;">
          ${i + 1}. <a href="${esc(j.url)}" style="color:#1d4ed8;text-decoration:none;">${esc(j.title)}</a>
        </div>
        <div style="color:#374151;font-size:13px;margin-top:3px;">
          ${esc(j.company)}${j.location ? " · " + esc(j.location) : ""}${j.date ? " · " + esc(j.date) : ""}
        </div>
        ${j.matchedKeywords?.length ? `<div style="color:#059669;font-size:12px;margin-top:4px;">✓ 命中你的 CV 關鍵字:${esc(j.matchedKeywords.join(", "))}</div>` : ""}
      </td>
      <td style="padding:12px 14px;border-bottom:1px solid #e5e7eb;text-align:center;vertical-align:top;white-space:nowrap;">
        <span style="display:inline-block;background:${j.score >= 70 ? "#dcfce7;color:#15803d" : j.score >= 45 ? "#fef9c3;color:#a16207" : "#fee2e2;color:#b91c1c"};border-radius:999px;padding:4px 12px;font-size:13px;font-weight:700;">${j.score}%</span>
        <div style="margin-top:6px;"><span style="display:inline-block;background:${SOURCE_COLORS[j.source] || "#6b7280"};color:#fff;border-radius:6px;padding:2px 8px;font-size:11px;font-weight:700;">${esc(j.source)}</span></div>
      </td>
    </tr>`).join("");

  const failNote = failures.length
    ? `<p style="color:#92400e;background:#fef3c7;border-radius:8px;padding:10px 14px;font-size:13px;">
         ⚠️ 今日抓取失敗的來源:${failures.map((f) => `${esc(f.source)}(<a href="${esc(links[f.source])}">改用搜尋連結 ↗</a>)`).join("、")}
       </p>`
    : "";

  return `<!DOCTYPE html><html><body style="font-family:-apple-system,'Segoe UI','Noto Sans TC',sans-serif;background:#f9fafb;margin:0;padding:24px;">
  <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:#111827;color:#fff;padding:20px 24px;">
      <div style="font-size:20px;font-weight:800;">💼 DreamJOB 每日精選 Top ${top.length}</div>
      <div style="color:#9ca3af;font-size:13px;margin-top:4px;">${esc(dateStr)} · 搜尋「${esc(search.keyword)}」 · 依你的 CV 匹配度排序</div>
    </div>
    <table style="width:100%;border-collapse:collapse;">${rows || '<tr><td style="padding:24px;text-align:center;color:#6b7280;">今日各來源皆無新職缺 — 請點下方連結手動查看。</td></tr>'}</table>
    <div style="padding:16px 24px;">${failNote}
      <p style="font-size:13px;color:#4b5563;">直接搜尋:
        <a href="${esc(links["104"])}">104</a> ·
        <a href="${esc(links.LinkedIn)}">LinkedIn</a> ·
        <a href="${esc(links.Yourator)}">Yourator</a> ·
        <a href="${esc(links.Indeed)}">Indeed</a></p>
      <p style="font-size:12px;color:#9ca3af;">由 DreamJOB GitHub Actions 自動產生 · 修改條件請更新 repo 的 profile/profile.json</p>
    </div>
  </div></body></html>`;
}

async function main() {
  const profile = loadProfile();
  const search = profile.searches[0];
  const sources = [
    ["104", fetch104],
    ["LinkedIn", fetchLinkedIn],
    ["Yourator", fetchYourator],
    ["Indeed", fetchIndeed]
  ];

  const all = [];
  const failures = [];
  await Promise.all(sources.map(async ([name, fn]) => {
    try {
      const jobs = await fn(search);
      console.log(`[${name}] fetched ${jobs.length} jobs`);
      all.push(...jobs);
    } catch (e) {
      console.error(`[${name}] FAILED: ${e.message}`);
      failures.push({ source: name, error: e.message });
    }
  }));

  const unique = dedupe(all);
  unique.forEach((j) => { j.score = scoreJob(j, profile.cvKeywords, search.keyword); });
  unique.sort((a, b) => b.score - a.score);
  const top = unique.slice(0, 10);

  const dateStr = new Date().toLocaleDateString("zh-TW", { timeZone: "Asia/Taipei", year: "numeric", month: "long", day: "numeric" });

  mkdirSync(join(ROOT, "out"), { recursive: true });
  mkdirSync(join(ROOT, "data"), { recursive: true });
  writeFileSync(join(ROOT, "out", "email.html"), buildEmail(top, failures, search, dateStr));
  writeFileSync(join(ROOT, "out", "subject.txt"),
    `💼 DreamJOB 每日 Top ${top.length} 職缺 — ${search.keyword} (${dateStr})`);
  writeFileSync(join(ROOT, "data", "latest.json"), JSON.stringify({
    generatedAt: new Date().toISOString(),
    keyword: search.keyword,
    failures: failures.map((f) => f.source),
    jobs: top
  }, null, 2));

  console.log(`\nTotal: ${all.length} fetched, ${unique.length} unique, top ${top.length} selected.`);
  if (!all.length && failures.length === sources.length) {
    console.error("All sources failed — check network / endpoints.");
    process.exit(1);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
