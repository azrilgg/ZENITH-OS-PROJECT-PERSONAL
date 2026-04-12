# ⚡ ZENITH OS — Productivity Engine

<div align="center">
  <img src="https://img.shields.io/badge/Status-God_Mode_Active-00F0FF?style=for-the-badge&logoColor=black" alt="Status" />
  <img src="https://img.shields.io/badge/Architecture-Next.js_14-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/Styling-Tailwind_%2B_Framer-8B5CF6?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Styling" />
</div>

<br />

**Zenith OS** is a premium, offline-first productivity suite built with a striking "God-Tier" dark-mode aesthetic. It is engineered to feel less like a standard task manager and more like a high-end cybernetic operating system designed to optimize human performance.

---

## 💎 The Aesthetic

The entire application relies heavily on an intricate **Dark Glassmorphism** design language.
- **Deep Void Backgrounds:** `rgba(6, 6, 11, 1)` provides infinite depth.
- **Neon Accents:** Brand colors include Cyber Cyan (`#00F0FF`), Archangel Violet (`#8B5CF6`), and Momentum Amber (`#FBBF24`).
- **Fluid Motion:** Extensive use of physical-based spring animations to make every interaction satisfying and weighty.
- **Typography:** Aerospace-inspired UI with monospace tracking for labels (JetBrains Mono) and stark sans-serif body text (Inter).

## 🏗️ Technology Stack

Zenith OS is built on a modern, robust front-end stack prioritizing speed, offline capability, and visual fidelity.

| Technology | Purpose |
| ---------- | ------- |
| **Next.js (App Router)** | Core framework. Fast rendering and scalable routing. |
| **React** | Component architecture and state lifecycle management. |
| **Tailwind CSS** | Core utility styling, heavily augmented with custom volumetric CSS variables for glows and glass effects. |
| **Framer Motion** | Engine for all micro-interactions, layout transitions, and presence animations. |
| **Lucide React** | The exclusive iconography system. Chosen for its clean, consistent stroke weights that match the technical aesthetic. |
| **Chart.js / React-Chartjs-2** | Rendering high-performance, custom-styled analytics charts. |
| **Browser LocalStorage** | Zero-latency, highly secure offline database architecture. No load times. |

## ⚙️ Core Modules

### 1. Command Center (Tasks)
- Fast-entry task system with priority flags.
- Real-time experience points (XP) and leveling system.
- Global command palette (`Ctrl+K`) for rapid navigation.

### 2. The Architect (Habits)
A complete paradigm shift for habit tracking. Integrates a "performance coach" persona.
- **Never Miss Twice Engine:** Intelligent streak tracking with "Life Support" warnings before a streak resets.
- **Momentum States:** Streaks unlock visual auras (Blue Glow at 7 days, Neon Purple at 30 days).
- **Expansion Phases:** dynamically categorizes habits into Foundation, Architecture, Mastery, and God-Mode based on longevity.

### 3. Hyper-Focus Engine (Timer)
- Pomodoro workspace with ambient focus sounds (Brown Noise, Rain, etc.).
- Web Worker architecture ensures timers never desync, even if the browser tabs are backgrounded.
- Sessions automatically feed into global analytics.

### 4. Neural Analytics
- Cross-module data aggregation.
- Tracks peak hours, focus efficiency, and task velocity.
- Data remains totally private to the local device.

### 5. Spatial Calendar
- Drag-and-drop chronological mapping.
- Full system JSON Backup and Restore capability.
- Flawless timezone-handling using robust local `Date` conversions.

---

## 🎨 Iconography System (Lucide)

Zenith OS relies completely on **Lucide-React** icons to maintain a highly uniform, technical aesthetic. Standard stroke widths are preserved to look like precision instruments.

- `Zap` / `Flame` / `Crown` — Associated with momentum, streaks, and mastery.
- `Brain` / `Shield` / `Target` — Used for The Architect persona insights and logic.
- `Briefcase` / `Heart` / `Dumbbell` — Categorical visual anchors.

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Run the Development Server
npm run dev

# 3. Open your portal
# Navigate to http://localhost:3000
```

> **Note:** Zenith OS is an entirely client-side, offline-first application. It requires no connected backend infrastructure to operate at 100% capacity. Your data belongs to you.
