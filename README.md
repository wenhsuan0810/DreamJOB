# DreamJOB 💼

An all-in-one, fully client-side job hunting toolkit:

- **🔍 Unified Job Search** (`jobs.html`) — enter keywords once and search
  **LinkedIn**, **104 人力銀行** and **Indeed** simultaneously, with filters for
  location, 104 area, remote work, date posted and experience level. Includes
  recent-search history and a personal **application tracker**.
- **🩺 CV Doctor** (`cv.html`) — paste your CV for an instant score across six
  dimensions (contact info, length, action verbs, quantified impact, weak
  phrases, style & clichés), concrete findings, before/after **rewrite
  suggestions**, and **keyword matching** against a target job description.
- **🎤 Interview Prep** (`interview.html`) — a curated question bank with
  answer strategies, the **STAR method** guide, a timed **mock-interview
  practice mode** with autosaved notes, and a pre-interview checklist.

## Running it

It's a static site — no build step, no dependencies, no server-side code.

```bash
# Option 1: just open it
open index.html

# Option 2: serve it locally
python3 -m http.server 8000
# then visit http://localhost:8000
```

It also deploys as-is to GitHub Pages, Netlify, Vercel or any static host.

## Privacy

Everything runs in the browser. CVs, job descriptions, saved searches,
practice notes and the application tracker are stored only in your browser's
`localStorage` — nothing is ever sent to a server.

## Structure

```
index.html          Landing page
jobs.html           Unified job search + application tracker
cv.html             CV diagnosis & rewrite
interview.html      Interview preparation
assets/style.css    Shared design system
assets/jobs.js      Search URL builders (LinkedIn / 104 / Indeed), tracker
assets/cv.js        CV analysis engine
assets/interview.js Question bank, practice timer, checklist
```
