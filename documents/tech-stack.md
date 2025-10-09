# Tech Stack

---

## 🔹 Core Requirements Recap

- **Projects & Tasks** (SDLC-driven, hierarchical tracking)
- **Duration tracking** (time spent per task → project totals)
- **Cost tracking** (hourly input × duration → project cost)
- **Import/Export** (Excel, CSV, JSON)
- **Future ML analysis** (predict delays, budget overruns, etc.)
- **AI chatbot** (natural language Q&A over your project data)

---

## 🏗 Recommended Tech Stack

### 1. **Frontend (UI Layer)**

- **Framework**: **Next.js (React)** → free, modern, excellent for dashboards
- **Styling**: **Tailwind CSS** → fast to build responsive layouts
- **Charting**: **Chart.js (via react-chartjs-2)** → free and good for project/task visualization
- **Form Handling**: React Hook Form → clean validation & form states

👉 Why: Next.js is free, integrates APIs, supports static & dynamic rendering, and can easily evolve into a personal SaaS if you want.

---

### 2. **Backend / API Layer**

- **Option A (lightweight, easiest)**: **Supabase (Free tier, Postgres DB + Auth + Storage)**
- **Option B (if you want full control)**: **Node.js + Express + PostgreSQL (self-hosted, Docker)**

👉 Supabase gives you Postgres with free Auth and storage, saving setup headaches. If you want to host locally and keep costs _zero_, Docker + Postgres + Prisma ORM is better.

---

### 3. **Database**

- **PostgreSQL** (best for relational + analytics queries later)
- **Schema Example**:

  - `projects` (id, name, stage, start_date, end_date, rate_per_hour, …)
  - `tasks` (id, project_id, name, status, duration_hours, …)
  - `records` (id, task_id, date, hours_logged, cost, …)

👉 Using **UUIDs** instead of auto-increment IDs makes future API/ML integrations cleaner.

---

### 4. **Import/Export**

- **Excel/CSV**: Use `SheetJS (xlsx)` → works in frontend & backend
- **JSON**: Native JSON export via Node.js / Supabase queries

---

### 5. **Analytics / ML Layer (Future-ready)**

- **Python (Jupyter + Pandas + Scikit-learn)** for ML experiments:

  - Predict project overruns, cost trends, time-to-completion
  - Clustering tasks to detect bottlenecks

- Data pipeline: Export from Supabase/Postgres → Python CSV/JSON → ML

👉 You don’t need ML infra at first. Just keep clean data structures in Postgres so you can feed them into ML later.

---

### 6. **AI Chatbot Layer**

- **Option A (cheap, local-first)**: **LlamaIndex or LangChain + Open Source LLM (e.g., LLaMA2 or Mistral)**
- **Option B (managed, faster to start)**: **LangChain + OpenAI GPT-4o-mini**
- Backend: Node.js API or Python FastAPI serving the chatbot
- Vector DB: **SQLite w/ embeddings** (for local) or **Supabase Vector** (free tier)

👉 Flow: User asks → chatbot converts into SQL query → fetches project/task/cost data → returns conversational answer.

---

## 💡 Suggested Setup Path

1. **Phase 1 (MVP)**:

   - Next.js + Tailwind + Supabase (projects, tasks, cost/hour tracking)
   - Import/Export via SheetJS
   - Charts with Chart.js

2. **Phase 2 (Analytics)**:

   - Export data → Python Jupyter (Pandas, Scikit-learn)
   - Run basic ML (trend prediction, anomaly detection)

3. **Phase 3 (Chatbot)**:

   - Add API endpoint → integrate LangChain or LlamaIndex
   - Start with OpenAI GPT-4o-mini (cheap, reliable)
   - Later switch to local LLM (Mistral/LLaMA2) for cost-free queries

---

## 🔧 Cost Breakdown

- **Supabase Free Tier** → $0 (DB, Auth, API, Vector Search)
- **Next.js + Tailwind + Chart.js + React Hook Form** → $0
- **SheetJS** → $0 for personal use
- **Python ML stack** → $0 (Anaconda/Jupyter/Pandas/Scikit-learn)
- **AI chatbot** → $0 if local, or <$5/month using GPT-4o-mini
