# 🌿 EcoSync Hub: Sustainable Commerce & Community
**Production Ready | PostgreSQL | Socket.io | Multi-Theme**

EcoSync Hub is a premium, full-stack marketplace and social ecosystem designed to bridge the gap between sustainable shopping and impactful community action. Engineered for performance, scalability, and aesthetic excellence.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://dashboard.render.com/blueprints?repo=https://github.com/rbkhan007/EcoSync-Hub)

---

## ✨ Key Features

### 🚀 Production-Grade Backend
- **Universal SQL Shim**: A robust database layer in `db.js` that transparently translates MySQL syntax to PostgreSQL on-the-fly.
- **Real-time Engine**: Integrated PostgreSQL `LISTEN/NOTIFY` bridge with Socket.IO for instant database-to-UI updates.
- **Architectural Excellence**: Graceful process handling (SIGTERM/SIGINT) and optimized connection pooling.

### 🎨 Premium Visual Experience
- **Dynamic Theming**: Switch instantly between **Eco Light**, **Dracula Dark**, and **Nord Arctic** modes via a sleek navbar switcher.
- **Glassmorphic UI**: Ultra-modern React interface with smooth animations and responsive "lift" effects.
- **Unified Impact Dashboard**: Real-time tracking of personal and community CO2 savings and Eco-Points.

### 🛠️ Core Modules
- **Marketplace**: Browse eco-rated products, manage a sophisticated cart, and checkout with transactional integrity.
- **Social Hub**: Community posts, real-time private messaging, and a global leaderboard.
- **Gaming & Impact**: Daily eco-missions and interactive quizzes to earn rewards.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Material UI (MUI), Socket.io-client, Framer Motion.
- **Backend**: Node.js, Express, PostgreSQL (pg), Socket.io, JWT Auth.
- **DevOps**: Render (Deployment), Aiven (Cloud Database), ESLint (Hardened Code).

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL (Local or Cloud like Aiven/Render)

### 2. Backend Setup
```bash
cd backend
npm install
# Configure your .env (see .env.example)
npm start
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🎨 Professional Theming
EcoSync Hub isn't just one look. We support three high-fidelity environments:

- **🌿 Eco Light**: For that crisp, clean sustainability vibe.
- **🧛 Dracula**: A premium dark theme optimized for comfort and aesthetic.
- **❄️ Nord Blue**: A sleek, arctic-inspired theme for a focused workflow.

*Switch themes instantly via the Palette icon in the navigation bar.*

---

## 📦 Database Migration
Moving from MySQL? We've got you covered. The project includes a **Universal SQL Shim** that allows you to run existing MySQL-style queries directly on PostgreSQL without rewriting your routes.

To initialize your DB, run the provided `ecosync_hub_pg.sql` script in your PostgreSQL editor or use the `backend/scripts/import-db.js` utility.

---

## 📄 License
EcoSync Hub is open-source under the MIT License.

Built with passion for a greener planet. 🌍 by **rbkhan**

## Deployment Status
You can track the live deployment status of EcoSync Hub on [Render](https://dashboard.render.com).
