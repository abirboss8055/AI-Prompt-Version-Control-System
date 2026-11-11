<div align="center">

# 🌿 PromptGit

### *Git-style version control and interactive lineage tree visualization for Generative AI prompts.*

[![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![React Flow](https://img.shields.io/badge/React_Flow-FF0072?style=for-the-badge&logo=reactflow&logoColor=white)](https://reactflow.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma_ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![OpenAI](https://img.shields.io/badge/OpenAI_DALL--E_3-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com/)

</div>

---

## ⚡ Elevator Pitch

> **PromptGit** is a full-stack developer platform that treats generative AI prompts like source code—enabling engineers to version, branch, mutate, and visually trace prompt iterations and hyperparameters through an interactive React Flow DAG tree backed by PostgreSQL.

---

## 🏗️ System Architecture

```text
ai-prompt-version-control/
├── client/                     # Vite + React Frontend SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── LinearPromptTracker.jsx   # Linear-style vertical timeline
│   │   │   ├── PromptTreeVisualizer.jsx  # React Flow visual tree canvas
│   │   │   └── PromptNode.jsx            # Custom tree node with prompt snippets
│   │   ├── utils/
│   │   │   └── promptGraphMapper.js      # DB flat array -> 2D DAG layout mapper
│   │   ├── App.jsx                       # Tabbed view switcher
│   │   ├── index.css                     # Tailwind design system
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js                    # API reverse proxy configuration
│
├── server/                     # Express.js REST API Backend
│   ├── prisma/
│   │   └── schema.prisma                 # Self-referencing PostgreSQL schema
│   ├── src/
│   │   ├── controllers/
│   │   │   └── generationController.js   # OpenAI DALL-E 3 secure image generation
│   │   ├── routes/
│   │   │   ├── projectRoutes.js          # Project & nested prompts endpoints
│   │   │   └── promptRoutes.js           # Prompt CRUD & 'Branch from here' logic
│   │   ├── lib/
│   │   │   └── prisma.js                 # Reusable PrismaClient singleton
│   │   └── server.js                     # Server entry point & middlewares
│   ├── .env.example
│   └── package.json
│
├── .gitignore                  # Monorepo secret & build exclusion rules
├── package.json                # Monorepo scripts & workspaces
└── README.md
```

---

## 💻 Tech Stack

### Frontend (`/client`)
- **React 18 & Vite**: Ultra-fast single-page application development and HMR.
- **React Flow (`reactflow`)**: Interactive node-based Directed Acyclic Graph (DAG) for visual prompt tree rendering.
- **Tailwind CSS**: Modern dark-mode aesthetic with custom scrollbars and backdrop blur filters.
- **Axios**: HTTP client with automated proxy routing to the backend.
- **Lucide React**: Clean, accessible iconography.

### Backend (`/server`)
- **Node.js & Express.js**: RESTful API service supporting modular route handlers and error middleware.
- **PostgreSQL**: Relational storage engine with native `JSONB` support for schema-less AI parameter tuning.
- **Prisma ORM**: Type-safe database client featuring a self-referencing `Prompt` model for branching trees.
- **OpenAI DALL-E 3 REST API**: Server-side image generation with private credential isolation.

---

## ✨ Core Features

### 1. 🌿 Git-Style Prompt Branching
- Every prompt model features an optional self-referencing `parent_id` foreign key.
- Users can click **"Branch from here"** on any historical iteration, tweak wording (e.g. *adding cinematic studio lighting*), and create a distinct fork without overwriting the parent prompt.

### 2. 🗺️ Interactive DAG Tree Visualization (React Flow)
- Built-in `promptGraphMapper` utility transforms flat database query arrays into clean 2D tree coordinates.
- Prevents node overlapping through bottom-up child centering.
- Custom node cards display prompt text snippets, thumbnail outputs, CFG scale guidance, and branch tags (`#branch-v2`).
- Switchable **Horizontal (LR)** and **Vertical (TB)** orientation controls.

### 3. ⏱️ Linear Commit Timeline Tracker
- Chronological vertical commit feed reminiscent of Linear and GitHub.
- **Time-Travel Restore**: 1-click restoration of any historical prompt and its generation settings directly back into the editor.
- Quick copy action with clipboard feedback.

### 4. 🎛️ PostgreSQL JSONB Parameter Auditing
- Captures full generation parameters per iteration: `cfg_scale`, `steps`, `sampler`, `aspect_ratio`, `model`, and DALL-E's AI `revised_prompt`.

### 5. 🔐 Secure Server-Side AI Generation
- Frontend requests are routed through Express, keeping private `OPENAI_API_KEY` credentials hidden from client-side network inspectors.

---

## 🚀 Local Setup Guide

Follow these exact steps to run the complete full-stack platform locally.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- [PostgreSQL](https://www.postgresql.org/) running locally or in the cloud (e.g., Supabase, Neon, or local Postgres)
- (Optional) [OpenAI API Key](https://platform.openai.com/api-keys) for live DALL-E 3 image generation

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/ai-prompt-version-control.git
cd ai-prompt-version-control
```

---

### Step 2: Install Dependencies

You can install dependencies for both the `server` and `client` using the monorepo root command:

```bash
npm run install:all
```

*(Alternatively, run `npm install` inside both `/server` and `/client` directories individually).*

---

### Step 3: Configure Environment Variables

1. Navigate to the `/server` directory:
   ```bash
   cd server
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   *(On Windows Command Prompt: `copy .env.example .env`)*

3. Open `server/.env` and update your PostgreSQL connection URL and optional OpenAI key:
   ```env
   PORT=5000
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/prompt_vcs?schema=public"

   # Optional: Live DALL-E 3 image generation
   OPENAI_API_KEY="sk-your-openai-api-key"
   ```

---

### Step 4: Push the Prisma Schema to PostgreSQL

Synchronize the Prisma models (`User`, `Project`, and self-referencing `Prompt`) with your PostgreSQL database:

```bash
npx prisma db push
```

> **Optional DB GUI:** To inspect your database visually in your browser at any time, run:
> ```bash
> npx prisma studio
> ```

---

### Step 5: Start Development Servers

Open two terminal windows:

#### Terminal 1 — Start Express Backend:
```bash
cd server
npm run dev
```
*Backend runs on: [http://localhost:5000](http://localhost:5000)*

#### Terminal 2 — Start Vite React Frontend:
```bash
cd client
npm run dev
```
*Frontend runs on: [http://localhost:3000](http://localhost:3000)*

Open your browser to [http://localhost:3000](http://localhost:3000) to view the Linear Tracker and React Flow tree!

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/projects` | Create a new project container |
| `GET` | `/api/projects` | Fetch all projects |
| `GET` | `/api/projects/:projectId` | Fetch a single project with its prompt history |
| `POST` | `/api/projects/:projectId/prompts` | Save a new sequential prompt version |
| `GET` | `/api/projects/:projectId/prompts` | Fetch all prompts for a project with parent links |
| `POST` | `/api/prompts/:id/branch` | **Branch from here**: Fork prompt `id` with parameter tweaks |
| `POST` | `/api/prompts/generate` | Generate via DALL-E 3 & persist record to database |
| `GET` | `/api/prompts/:id` | Get prompt detail with parent & all child branches |

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
