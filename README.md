# 🎓 Qemma — AI-Powered Learning Management System (Monorepo)

<div align="center">

![Status](https://img.shields.io/badge/Status-Active_under_development-2ea44f?style=for-the-badge)
![Frontend](https://img.shields.io/badge/Frontend-React_18_+_Vite-61dafb?style=for-the-badge)
![Backend](https://img.shields.io/badge/Backend-Node.js_+_Express_+_Prisma-68a063?style=for-the-badge)
![Docs](https://img.shields.io/badge/Docs-SRS_+_ERD_+_Testing-blue?style=for-the-badge)

**This repository consolidates the whole Qemma project — documentation, backend, and frontend — in one place.**

</div>

---

## 📌 About Qemma

**Qemma** is an **AI-powered Learning Management System (LMS)** built as a graduation project. It provides courses, live contests, real-time classrooms (WebRTC/Socket.IO), AI-assisted question/contest generation, dashboards, and more.

## 🏗️ Monorepo Structure

| Folder | Contents | Originally |
|--------|----------|------------|
| **[`backend/`](./backend)** | API & real-time server — Node.js, Express, Prisma, MongoDB, Redis, Socket.IO, OpenAI/Groq AI features | `qemma-backend` |
| **[`frontend/`](./frontend)** | Web application — React 18, Vite, Redux Toolkit, Tailwind CSS 4, MUI, Radix UI, WebRTC, i18next (Arabic/English) | `qemma-frontend` |
| **[`docs/`](./docs)** | Documentation hub — SRS, Proposal, ERD, Use Case Diagram, timelines, implementation/deployment plans, testing document, user manual | `Qema-Graduation-Project` |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** >= 18 and npm >= 9
- A **MongoDB** database and a **Redis** instance
- Environment variables (see `backend/.env.example` conventions: `DATABASE_URL`, `CLERK_*`, `OPENAI_API_KEY`, …)

### Backend
```bash
cd backend
npm install
npx prisma generate
npm run dev        # starts on port 5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev        # starts on port 5173, proxies /api and /socket.io to localhost:5000
```

### Production frontend build
```bash
cd frontend
npm run build      # outputs to frontend/dist
```

---

## 🚢 Deployment

- The **frontend** is deployed on **Vercel** (root directory: `frontend`, framework: Vite).
- The **backend** requires long-running Node services (Socket.IO, WebRTC/mediasoup, Redis) — deploy to a VM/container platform (see `docs/` → `DeploymentPlan.docx`, `kubernetes/`).
- Full SRS, ERD, and deployment documentation live under [`docs/`](./docs).

---

## 📚 Documentation Index

See [`docs/README.md`](./docs/README.md) for the complete list: SRS documents, ERD & Use Case archives, AI/Flutter/Front-end timelines, implementation & deployment plans, testing document, and user manual.

---

## 👨‍💻 Author

**Amjad Ibrahim**
- GitHub: [@AmjadIbrahim1](https://github.com/AmjadIbrahim1)
