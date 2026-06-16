<p align="center">
  <img src="https://img.shields.io/badge/⚡-Supply_Chain_AI-6366f1?style=for-the-badge&labelColor=0a0e1a" alt="Supply Chain AI"/>
</p>

<h1 align="center">AI Supply Chain Disruption Alert Summarizer</h1>

<p align="center">
  <strong>An AI-powered disruption analysis tool built for Manikanta Enterprises, Hyderabad</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Groq-Llama_3.3_70B-FF6B35?style=flat-square&logo=meta&logoColor=white" alt="Groq Llama 3"/>
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase"/>
  <img src="https://img.shields.io/badge/Vercel-Serverless-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel"/>
  <img src="https://img.shields.io/badge/Chart.js-Visualizations-FF6384?style=flat-square&logo=chartdotjs&logoColor=white" alt="Chart.js"/>
  <img src="https://img.shields.io/badge/License-MIT-22d3ee?style=flat-square" alt="License"/>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-deployment">Deployment</a> •
  <a href="#-api-reference">API Reference</a> •
  <a href="#-team">Team</a>
</p>

---

## 📋 About

**Manikanta Enterprises** is a goods distribution and supply company in Hyderabad managing procurement, warehousing, and distribution to retail dealers, shopkeepers, and institutional buyers.

This tool solves a critical operational problem: when suppliers communicate delays or shortages via calls, WhatsApp, or emails, management must **manually** assess the customer impact and decide on response actions. This process is slow, scattered, and error-prone.

**AI Supply Chain Disruption Alert Summarizer** automates this by using **Groq's Llama 3.3 70B** model to instantly generate:

- 📝 **Executive Summary** — What happened, why, and for how long
- 🚨 **Customer Impact Assessment** — Effects on retail, credit, and repeat-order customers
- 📦 **Affected Orders Analysis** — Which shipments, credit cycles, and deliveries are hit
- 💡 **Recommended Response Actions** — Concrete steps with communication scripts

---

## ✨ Features

### 🤖 AI-Powered Disruption Analysis
- Paste any supplier communication (email, WhatsApp, phone notes) and get a structured executive report in **under 3 seconds**
- Powered by **Groq Llama 3.3 70B Versatile** with optimized prompt engineering (v4)
- One-click **template presets** for common scenarios (crop floods, transport strikes, packaging shortages, power outages)

### 📊 Analytics Dashboard
- **Real-time metrics**: Total alerts logged, average AI quality rating, response latency, feedback coverage
- **Daily disruption volume** line chart with trend visualization
- **Top disrupting suppliers** horizontal bar chart
- All charts powered by **Chart.js** with theme-aware colors

### 📜 History & Search
- Full log of every generated disruption report with timestamps
- **Full-text search** across supplier names, admin names, and report content
- Click any record to view the complete detail in a modal overlay

### ⭐ Quality Feedback System
- **1-5 star rating** with hover preview and bounce animations
- Optional text comments for prompt engineering improvement
- Feedback is tracked and visible in the analytics dashboard

### 🎨 Premium UI/UX
- **Glassmorphism** cards with animated gradient borders
- **Aurora background** with floating glow orbs
- **Triple-ring loading** animation with cycling status messages
- **Dark / Light mode** toggle with localStorage persistence
- **Fully responsive** — works on desktop, tablet, and mobile
- **Print-optimized** styles for PDF export
- **Accessibility**: `prefers-reduced-motion` support, keyboard navigation, focus outlines

### 📤 Export Options
- **Copy to clipboard** — one-click markdown copy
- **Download as .txt** — saves formatted report file
- **Print / PDF** — browser print dialog with clean styling
- **Regenerate** — get a fresh AI response with the same inputs

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    BROWSER (SPA)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │Summarizer│  │ History  │  │  Analytics Dashboard │  │
│  │   Form   │  │   Log    │  │  Charts & Metrics    │  │
│  └────┬─────┘  └────┬─────┘  └──────────┬───────────┘  │
│       │              │                   │              │
└───────┼──────────────┼───────────────────┼──────────────┘
        │              │                   │
   POST /api/     GET /api/          GET /api/
    generate       history            analytics
        │              │                   │
┌───────┼──────────────┼───────────────────┼──────────────┐
│       ▼              ▼                   ▼              │
│            VERCEL SERVERLESS FUNCTIONS                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │ generate │  │ history  │  │ analytics│  │feedback│  │
│  │   .js    │  │   .js    │  │   .js    │  │  .js   │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘  │
│       │              │              │            │      │
└───────┼──────────────┼──────────────┼────────────┼──────┘
        │              │              │            │
   ┌────▼────┐    ┌────▼──────────────▼────────────▼────┐
   │  GROQ   │    │         SUPABASE (PostgreSQL)       │
   │  API    │    │    ┌─────────────────────────────┐  │
   │ Llama   │    │    │    disruptions table        │  │
   │ 3.3 70B │    │    │  id, admin, supplier,       │  │
   └─────────┘    │    │  raw_input, ai_output,      │  │
                  │    │  rating, feedback, latency   │  │
                  │    └─────────────────────────────┘  │
                  └─────────────────────────────────────┘
```

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | HTML, CSS, JavaScript | SPA with tab navigation, glassmorphism design |
| **Icons** | [Lucide Icons](https://lucide.dev/) | 100+ SVG icons via CDN |
| **Charts** | [Chart.js 4](https://www.chartjs.org/) | Line & bar charts for analytics |
| **AI Engine** | [Groq](https://groq.com/) — Llama 3.3 70B | Ultra-fast AI inference (~2s latency) |
| **Database** | [Supabase](https://supabase.com/) — PostgreSQL | Disruption logs, ratings, analytics |
| **Backend** | Vercel Serverless Functions | Node.js API endpoints |
| **Hosting** | [Vercel](https://vercel.com/) | Zero-config deployment with Edge CDN |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- A free [Groq Console](https://console.groq.com/) account (for API key)
- A free [Supabase](https://supabase.com/) account (for database)

### 1. Clone the Repository

```bash
git clone https://github.com/rnc1127/Supply-chain.git
cd Supply-chain
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase Database

Create a new Supabase project and run the following SQL in the **SQL Editor**:

```sql
CREATE TABLE IF NOT EXISTS disruptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  admin_name TEXT NOT NULL,
  supplier_name TEXT NOT NULL,
  raw_input TEXT NOT NULL,
  ai_output TEXT NOT NULL,
  prompt_version TEXT DEFAULT 'v4' NOT NULL,
  response_time_ms INTEGER NOT NULL,
  rating INTEGER,
  feedback_comment TEXT
);

ALTER TABLE disruptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON disruptions FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON disruptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON disruptions FOR UPDATE USING (true);
```

### 4. Configure Environment Variables

Copy the example file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your keys:

```env
GROQ_API_KEY=gsk_your_groq_api_key_here
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 5. Run Locally

```bash
npx vercel dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub (already done ✅)
2. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
3. Click **Add New → Project** and import the `Supply-chain` repository
4. Add the three **Environment Variables**:
   - `GROQ_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
5. Click **Deploy**

> ⚡ Vercel automatically deploys on every `git push` to `main`.

---

## 📡 API Reference

### `POST /api/generate`

Generate an AI disruption summary report.

**Request Body:**
```json
{
  "admin": "Nuthan",
  "supplier": "Krishna Agro Industries",
  "inputs": "Heavy flooding has delayed sunflower seed shipments by 15 days..."
}
```

**Response:**
```json
{
  "success": true,
  "id": "uuid-of-record",
  "aiOutput": "# Supply Chain Disruption Summary\n## Executive Summary...",
  "responseTimeMs": 2061,
  "createdAt": "2026-06-16T09:24:16.333234+00:00"
}
```

### `GET /api/history`

Retrieve all disruption logs, sorted newest first (limit 100).

### `POST /api/feedback`

Submit a quality rating and comment for a generated report.

**Request Body:**
```json
{
  "id": "uuid-of-record",
  "rating": 5,
  "comment": "Excellent summary with actionable steps"
}
```

### `GET /api/analytics`

Returns aggregated metrics and raw data for dashboard charts.

---

## 📁 Project Structure

```
Supply-chain/
├── api/
│   ├── generate.js      # Groq Llama 3 AI call + Supabase insert
│   ├── history.js       # Fetch disruption logs
│   ├── feedback.js      # Update ratings & comments
│   └── analytics.js     # Dashboard aggregations
├── index.html           # SPA — Summarizer, History, Analytics tabs
├── style.css            # 2300+ lines premium glassmorphism CSS
├── app.js               # Frontend state, API calls, charts, interactions
├── package.json         # Node.js dependencies
├── vercel.json          # Vercel routing config
├── .env.example         # Environment variable template
├── .gitignore           # Ignores .env, node_modules
└── README.md            # This file
```

---

## 🔒 Security

- API keys are stored in **environment variables**, never committed to Git
- `.env` is listed in `.gitignore`
- Supabase **Row Level Security (RLS)** is enabled on all tables
- CORS headers are configured on all serverless endpoints
- Input validation on both client and server side

---

## 👥 Team

| Role | Responsibility |
|------|---------------|
| **Student 1** — Frontend | UI/UX design, form validation, output display, history view, responsive layout |
| **Student 2** — Backend & AI | Prompt engineering, Groq API integration, Supabase schema, serverless functions |
| **Student 3** — Testing & Deployment | Quality testing, Postman API testing, GitHub management, Vercel deployment |

---

## 🏢 Company

**Manikanta Enterprises**
Goods Distribution & Supply Company
Hyderabad, Telangana, India

---

## 📄 License

This project is built as part of an internship programme (June 2026) for Manikanta Enterprises.

---

<p align="center">
  <sub>Built with ❤️ using Groq Llama 3 • Supabase • Vercel</sub>
</p>
