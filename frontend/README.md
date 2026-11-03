# 🎨 Qemma Frontend

<div align="center">

![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Redux Toolkit](https://img.shields.io/badge/Redux%20Toolkit-764ABC?style=for-the-badge&logo=redux&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![WebRTC](https://img.shields.io/badge/WebRTC-333333?style=for-the-badge&logo=webrtc&logoColor=white)

**Frontend for Qemma — an AI-powered Learning Management System**

</div>

---

## 📌 Project Overview

**Qemma Frontend** is the **client-side application** of the **Qemma** project — an AI-powered Learning Management System (LMS). It delivers the interactive learning interface with real-time collaboration features.

**Its role in the project:** the frontend is the face of Qemma. It consumes the backend API to render courses and content, manages application state with Redux Toolkit, and enables real-time collaboration (chat, notifications) and peer-to-peer audio/video via Socket.IO and WebRTC.

> **Status:** Repository scaffold — issue/PR templates are set up and the tech stack is defined. Implementation is in progress.

---

## 🏗️ Project Architecture — The Qemma Ecosystem

Qemma is **one project split across three repositories**:

| Repository | Role in the project | Link |
|------------|--------------------|------|
| **Qema-Graduation-Project** | Documentation hub — SRS, ERD, timelines, testing & user manual | [Open](https://github.com/AmjadIbrahim1/Qema-Graduation-Project) |
| **qemma-backend** | Backend API & real-time server (Node.js, Express, PostgreSQL, Redis) | [Open](https://github.com/AmjadIbrahim1/qemma-backend) |
| **qemma-frontend** *(this repo)* | Frontend web application (React, Redux Toolkit, WebRTC) | [Open](https://github.com/AmjadIbrahim1/qemma-frontend) |

> 📖 Start with the [Qema-Graduation-Project](https://github.com/AmjadIbrahim1/Qema-Graduation-Project) repository for the full system documentation (SRS, ERD, timelines).

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React.js** | UI framework |
| **Redux Toolkit** | State management |
| **Socket.IO** | Real-time communication |
| **WebRTC** | Peer-to-peer audio/video |

---

## 🌿 Branching Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production |
| `develop` | Integration |
| `feature/*` | New features |

---

## 📁 Project Structure

```
qemma-frontend/
├── .github/
│   ├── ISSUE_TEMPLATE/      # Issue templates
│   ├── FEATURE_TEMPLATE/    # Feature request template
│   └── pull_request_template.md
└── README.md
```

---

## 🚀 Getting Started

> Detailed setup instructions will be added as the implementation progresses.

### Planned setup

```bash
# Clone the repository
git clone https://github.com/AmjadIbrahim1/qemma-frontend.git
cd qemma-frontend

# Install dependencies (once package.json is added)
npm install

# Start the development server
npm run dev
```

---

## 🤝 Contributing

This repository includes **issue templates**, a **feature request template**, and a **pull request template** to standardize contributions. Please follow the branching strategy above when contributing.

---

## 👨‍💻 Author

**Amjad Ibrahim**

- GitHub: [AmjadIbrahim1](https://github.com/AmjadIbrahim1)
