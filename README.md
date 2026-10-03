# Smart Personal Calendar 📅✨

Smart Personal Calendar (or **Smart Calender**) is a modern, high-performance, and beautiful customizable calendar and task board application focused on daily productivity and personal schedule coordination.

It features a unique, high-contrast **Mixed-Theme UI** (locking sidebars, buttons, and pop-up modals to a dark glassmorphic layout, while keeping the main calendar cells and dashboard cards in a clean, legible light-glass style) with smooth animations and dynamic wallpaper controls.

---

## 🚀 Live Host Link
The application is hosted on Vercel:
🔗 **Production URL**: **[https://smart-calender-kappa.vercel.app](https://smart-calender-kappa.vercel.app)**

---

## 🎨 UI/UX & Design Highlights
- **Curated Mixed Theme (Lock Dark Controls + Light Canvas)**:
  - **All Buttons**: Locked to dark slate background (`#0f172a`) with white text and active neon glow outlines corresponding to the current color theme.
  - **TaskManager & Settings sidebars**: Enforce dark glass cards (`.dark-glass-card`) and light text colors to contrast beautifully against custom wallpapers.
  - **Event & Auth Modals**: Always styled as dark glass panels with white text for premium accessibility.
  - **Main Calendar View & Widgets**: Rendered in clean white-glass styles (`bg-white/90` and `text-slate-800`) to guarantee calendar cells, dates, times, and schedule items are perfectly legible.
- **Modern Glassmorphism & Micro-animations**:
  - High-blur backdrops with adjustable opacities.
  - Smooth interactive transitions powered by `Framer Motion`.
  - Ambient floating glowing orbs and animated mesh gradients on the authentication dashboard.
- **Custom Accent Themes**: Swap accent color profiles instantly (Indigo, Emerald, Rose, Amber, Sky, Teal, Violet, Orange).

---

## 📅 Core Features
1. **FullCalendar Coordination**:
   - Month, Week, Day, and Agenda List views.
   - Click a day cell to trigger the Event Creation modal.
   - Color-coded categories (Personal, Work, Study, Health, Other).
2. **Integrated Task Board**:
   - Manage pending goals, select priority tiers (High, Medium, Low), and set deadlines.
   - Track live completion percentage with an interactive circular SVG gauge.
3. **Important Milestones & Countdowns**:
   - Track birthdays, anniversaries, and special countdowns.
   - Auto-calculates milestones (e.g. "Sarah's 28th Birthday - Turning 28 in 2 days").
4. **Desktop Reminder Notifications**:
   - Integrated with the browser Notification API.
   - Background polling service regularly checks event alarms (10m, 30m, 1h, 1d) and triggers native OS push alarms.
5. **Dashboard Wallpaper Settings**:
   - Upload personal wallpaper photos directly.
   - Controls to dynamically adjust background blur (px) and card glass opacity (%).

---

## ⚙️ Architecture & Data Persistence
The app implements a **Dual-Mode Adapter** to run anywhere with zero setups:
- **Local Mock Mode (Default)**: If no environment credentials are detected, the app automatically runs offline. It persists all user data, events, tasks, and base64-encoded custom wallpapers in `localStorage`, simulating authentication, OTP email delivery, and Google Logins completely client-side.
- **Firebase/Google Cloud Mode**: Once variables are supplied, the adapter transparently upgrades to use:
  - **Firebase Auth**: Google Logins & Email Sign-In.
  - **Firestore**: Collection schemas storing events, tasks, and user preferences.
  - **Firebase Storage**: Cloud hosting for uploaded wallpaper backdrops and event memory thumbnails.

---

## 🛠️ Technology Stack
- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vite.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Calendar Engine**: [FullCalendar v6](https://fullcalendar.io/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 💻 Local Setup & Development

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed.

### 2. Clone and Install
```bash
git clone https://github.com/codexanjan/smart-calender.git
cd smart-calender
npm install
```

### 3. Run Dev Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build Production Bundle
```bash
npm run build
```

### 5. Configuring Live Cloud Database (Optional)
Copy `.env.example` to `.env` and fill in your Firebase configuration keys:
```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

<div align="center">

Made with ❤️ by [Anjan Shetty](https://github.com/codexanjan)

[![GitHub](https://img.shields.io/badge/GitHub-codexanjan-181717?style=flat&logo=github)](https://github.com/codexanjan)

</div>
