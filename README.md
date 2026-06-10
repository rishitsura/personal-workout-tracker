# RepsLoop (formerly Iron Log)

**RepsLoop** is a modern, mobile-first, AI-powered Progressive Web App (PWA) built to track personal workouts, enforce progressive overload, and generate intelligent training insights.

---

## 🚀 Core Features

### 1. Smart Queue Management
Traditional workout apps lock you into specific days of the week (e.g., "Monday is Chest Day"). RepsLoop uses a **Sequential Queue System**. 
- Workouts follow a strict sequence.
- If you miss a day, you don't skip the workout. The app picks up exactly where you left off.
- You can manually "Skip Day" to advance the queue if needed.

### 2. Auto-Updating Progressive Overload
RepsLoop acts as an automated trainer. 
- When you start a session, your sets are pre-filled with your baseline plan.
- If you lift heavier or do more reps than your plan dictates, the system catches it.
- Upon logging the workout, the app **automatically updates your baseline template**. The next time that workout cycles around, your new PR is the default weight.

### 3. AI Workout Insights (Powered by Gemma)
RepsLoop features a built-in AI Personal Trainer.
- By clicking "Generate Workout Insights" on the Activity page, the app bundles your last 20 workouts and sends them securely to Google's **Gemma 3 12B** model via a server-side Next.js route.
- The AI analyzes your data and returns beautifully rendered markdown covering:
  - **Volume Trends:** Are you plateauing or growing?
  - **Overload Checks:** Which exercises are progressing fastest.
  - **Muscle Balance:** Identifying neglected muscle groups.
  - **Actionable Tips:** 3 concrete things to fix in your next session.

### 4. Progress & Activity Tracking
- **Heatmap & Streaks:** Tracks daily consistency and computes current streaks.
- **Volume Metrics:** Calculates total volume lifted per session and all-time.
- **PR Tracking:** Automatically logs and displays your heaviest lifts per exercise.

---

## 🛠️ Tech Stack & Architecture

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS (Dark theme, mobile-first design, glassmorphism)
- **Icons:** `lucide-react`
- **PWA:** `next-pwa` (Installable on iOS/Android, offline support)

### Backend & Database
- **Database:** Firebase Firestore (NoSQL, real-time syncing)
- **Authentication:** Firebase Auth (Google Sign-In)
- **API Routes:** Next.js Serverless Functions (Route Handlers)

### AI Integration
- **SDK:** `@google/genai`
- **Model:** `gemma-3-12b-it`
- **Security:** API keys (`GEMINI_API_KEY`) are kept strictly on the server (`/api/insights/route.js`). They are never exposed to the client.

### Deployment
- **Hosting:** Vercel
- **Domains:** `repsloop.vercel.app` (Custom domain with automated branch deployments)

---

## 📂 Project Structure

```text
workout-tracker/
├── app/
│   ├── (app)/               # Protected routes (requires login)
│   │   ├── history/         # Activity logs, charts, and AI Insights tab
│   │   ├── plan/            # Template builder (exercises, default sets/weights)
│   │   ├── profile/         # User stats, goal settings, logout
│   │   └── today/           # Active workout session, sets/reps input, queue manager
│   ├── api/insights/        # Server-side route for generating AI feedback
│   ├── login/               # Google Sign-in page
│   └── onboarding/          # First-time user setup (metrics, goals, default plan)
├── components/              # Reusable UI (Toast, BottomSheet, MarkdownRenderer, etc.)
├── lib/
│   ├── authContext.js       # Firebase Auth listener & React Context provider
│   ├── firestoreService.js  # Core DB logic (Queue advancing, Overload updates)
│   └── utils.js             # Math, volume calculations, date formatting
└── public/                  # PWA Manifest, icons, offline fallback
```

---

## 🔒 Security & Data Flow
1. **Client Layer:** Handles UI state, timer, and optimistic updates.
2. **Database Layer:** Direct client-to-Firestore connection secured by Firebase Security Rules (users can only read/write their own `uid` documents).
3. **AI Layer:** The client sends an array of recent workouts to the Next.js API route. The server formats this into a strict prompt and calls the Gemini API, ensuring the API key is safely hidden from the browser.
