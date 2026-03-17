# 🎮 KiddoKeys — Project Plan
> Interactive Play Platform for Preschoolers (Ages 2–5)  
> Version 1.0 | March 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Goals](#2-product-vision--goals)
3. [Tech Stack](#3-tech-stack)
4. [System Architecture](#4-system-architecture)
5. [Firebase Services Blueprint](#5-firebase-services-blueprint)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Feature Modules](#7-feature-modules)
8. [Database Schema](#8-database-schema)
9. [Security & Safety](#9-security--safety)
10. [CI/CD Pipeline](#10-cicd-pipeline)
11. [Scalability Strategy](#11-scalability-strategy)
12. [Project Phases & Milestones](#12-project-phases--milestones)
13. [Folder Structure](#13-folder-structure)
14. [Cost Estimation](#14-cost-estimation)

---

## 1. Executive Summary

**KiddoKeys** is a browser-based, fullscreen play platform for preschool children (ages 2–5). It provides a safe, parent-monitored environment for keyboard exploration, creative drawing, and simple interactive games — with zero login friction for kids and a rich analytics dashboard for parents.

The platform is built for **global scale**, with offline-first support, real-time analytics, and a parent portal backed by Firebase.

---

## 2. Product Vision & Goals

### Vision
> *"A screen time experience parents feel good about — and kids love."*

### Core Goals

| Goal | Description |
|------|-------------|
| 🎯 Safe Play | No ads, no external links, no user-generated risks |
| 📱 Universal | Works on mobile, tablet, desktop, touch & keyboard |
| 📊 Transparent | Parents see exactly what their child does |
| ⚡ Instant | No login required to start playing |
| 🌍 Scalable | Designed to handle millions of concurrent sessions |

### Non-Goals (v1)
- No user accounts for children
- No social features
- No in-app purchases

---

## 3. Tech Stack

### Frontend

| Layer | Technology | Reason |
|-------|-----------|--------|
| Framework | **Next.js 15** (App Router) | SSR/SSG, edge-ready, best-in-class DX |
| Language | **TypeScript 5.x** | Type safety, maintainability |
| UI Components | **shadcn/ui** + **Radix UI** | Accessible, unstyled, fully customizable |
| Styling | **Tailwind CSS v4** | Utility-first, smallest possible bundle |
| Animation | **Framer Motion 11** | Declarative, GPU-accelerated animations |
| Canvas / Game | **PixiJS v8** | WebGL-accelerated, perfect for games |
| Audio | **Tone.js** | Web Audio API wrapper, musical synthesis |
| State Management | **Zustand v5** | Minimal, scalable, no boilerplate |
| Forms | **React Hook Form + Zod** | Parent panel settings validation |
| PWA | **next-pwa** | Service worker, offline support |

### Backend / Infrastructure

| Layer | Technology | Reason |
|-------|-----------|--------|
| Hosting | **Firebase Hosting** | Global CDN, instant deploys, SSL |
| Database | **Firestore** | Real-time, NoSQL, scales to billions of docs |
| Auth | **Firebase Auth** | Parent portal login (Google, Apple, Email) |
| Functions | **Cloud Functions v2** (Node 22) | Analytics aggregation, notifications |
| Analytics | **Firebase Analytics + BigQuery** | Session tracking, funnel analysis |
| Storage | **Firebase Storage** | Save/export drawings as PNG |
| Remote Config | **Firebase Remote Config** | Feature flags, A/B testing |
| Performance | **Firebase Performance Monitoring** | Real-user metrics (LCP, FID, CLS) |
| Crashlytics | **Firebase Crashlytics (web)** | Error tracking |

### DevOps & Tooling

| Tool | Purpose |
|------|---------|
| **pnpm** | Fast, disk-efficient package manager |
| **Turborepo** | Monorepo build orchestration |
| **ESLint + Prettier** | Code quality & formatting |
| **Vitest** | Unit testing |
| **Playwright** | E2E testing |
| **GitHub Actions** | CI/CD pipeline |
| **Firebase CLI** | Deploy automation |
| **Sentry** | Runtime error tracking |

---

## 4. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                      │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Play Zone   │  │  Draw Mode   │  │   Mini Games     │  │
│  │ (Keyboard)   │  │  (PixiJS)    │  │ (Bubbles/Stars)  │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│         └─────────────────┼────────────────────┘            │
│                    ┌──────▼──────┐                          │
│                    │  Zustand    │                          │
│                    │ App Store   │                          │
│                    └──────┬──────┘                          │
│                    ┌──────▼──────┐                          │
│                    │  Firebase   │                          │
│                    │   SDK v10   │                          │
│                    └──────┬──────┘                          │
└───────────────────────────┼─────────────────────────────────┘
                            │  HTTPS / WebSocket
        ┌───────────────────┼──────────────────────────┐
        │           Firebase Platform                   │
        │                                              │
        │  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
        │  │ Hosting  │  │Firestore │  │   Auth    │  │
        │  │  (CDN)   │  │(Real-time│  │ (Parents) │  │
        │  └──────────┘  └──────────┘  └───────────┘  │
        │                                              │
        │  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
        │  │ Storage  │  │Functions │  │ Analytics │  │
        │  │(Drawings)│  │  (v2)    │  │+ BigQuery │  │
        │  └──────────┘  └──────────┘  └───────────┘  │
        │                                              │
        │  ┌──────────┐  ┌──────────┐                 │
        │  │ Remote   │  │Performan-│                 │
        │  │ Config   │  │ce Monitor│                 │
        │  └──────────┘  └──────────┘                 │
        └──────────────────────────────────────────────┘
```

### Architecture Principles

1. **Offline-First** — Service worker caches all game assets. Kids can play without internet
2. **Edge-First** — Next.js middleware + Firebase Hosting CDN ensures <50ms TTFB globally
3. **Event-Driven Analytics** — All interactions emit structured events; no tracking SDKs on the child-facing play screen
4. **Parent/Child Separation** — Child UI and Parent Portal are completely isolated routes and bundles
5. **Feature-Flag Driven** — New features ship behind Remote Config flags for controlled rollout
6. **Zero Trust Security** — Firestore rules deny all unless explicitly permitted; parent auth required for any data writes

---

## 5. Firebase Services Blueprint

### 5.1 Firebase Hosting

```
# firebase.json
{
  "hosting": {
    "public": ".next",
    "cleanUrls": true,
    "trailingSlash": false,
    "headers": [
      {
        "source": "**/*.@(js|css|woff2)",
        "headers": [{ "key": "Cache-Control", "value": "public,max-age=31536000,immutable" }]
      },
      {
        "source": "**",
        "headers": [
          { "key": "X-Frame-Options", "value": "DENY" },
          { "key": "X-Content-Type-Options", "value": "nosniff" },
          { "key": "Referrer-Policy", "value": "no-referrer" },
          { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
        ]
      }
    ],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  }
}
```

### 5.2 Firestore Collections

```
kiddokeys/
├── sessions/              # Anonymous child play sessions
│   └── {sessionId}/
│       ├── startedAt
│       ├── mode
│       ├── events[]        # keyPresses, bubblesPop, starsCatch
│       └── deviceType
│
├── parents/               # Parent portal accounts
│   └── {uid}/
│       ├── email
│       ├── createdAt
│       ├── settings/
│       │   ├── soundEnabled
│       │   ├── animationsEnabled
│       │   └── theme
│       └── children/
│           └── {childId}/
│               ├── nickname
│               └── totalStats{}
│
├── analytics/             # Aggregated stats (written by Cloud Functions)
│   └── {date}/
│       ├── dau            # Daily Active Users
│       ├── avgSessionMin
│       ├── topMode
│       └── bubblesPopped
│
└── drawings/              # Saved drawing metadata
    └── {drawingId}/
        ├── parentUid
        ├── storageUrl
        ├── createdAt
        └── thumbUrl
```

### 5.3 Cloud Functions (v2)

| Function | Trigger | Purpose |
|----------|---------|---------|
| `aggregateDailyStats` | Firestore `sessions` write | Roll up session events to `analytics/` collection |
| `onParentSignup` | Auth `onCreate` | Create parent document in Firestore |
| `generateDrawingThumb` | Storage `onObjectFinalized` | Create 200×200 WEBP thumbnail of saved drawing |
| `cleanOldSessions` | Scheduled (daily) | Delete sessions older than 90 days |
| `sendWeeklyReport` | Scheduled (weekly) | Email parents a play time summary |

```typescript
// functions/src/aggregateDailyStats.ts
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

export const aggregateDailyStats = onDocumentCreated(
  'sessions/{sessionId}',
  async (event) => {
    const session = event.data?.data();
    if (!session) return;

    const db = getFirestore();
    const today = new Date().toISOString().split('T')[0];

    await db.doc(`analytics/${today}`).set({
      dau: FieldValue.increment(1),
      totalKeys: FieldValue.increment(session.keyPresses ?? 0),
      bubblesPopped: FieldValue.increment(session.bubblesPopped ?? 0),
      starsCaught: FieldValue.increment(session.starsCaught ?? 0),
    }, { merge: true });
  }
);
```

### 5.4 Firebase Remote Config

```json
{
  "bubbleSpawnInterval": 1200,
  "starSpawnInterval": 1000,
  "enableDrawSaveFeature": true,
  "enableLeaderboard": false,
  "maxBubbleSpeed": 2.5,
  "weeklyEmailEnabled": true,
  "maintenanceMode": false
}
```

### 5.5 Firebase Analytics Events

```typescript
// All child-facing events are anonymous — no PII ever logged
const ANALYTICS_EVENTS = {
  SESSION_START:    'session_start',
  MODE_SWITCH:      'mode_switch',       // { from, to }
  KEY_PRESSED:      'key_pressed',       // { key_type: 'alpha|number|special' }
  BUBBLE_POPPED:    'bubble_popped',     // { score }
  STAR_CAUGHT:      'star_caught',       // { score }
  DRAW_STROKE:      'draw_stroke',       // { color, brush_size }
  DRAW_SAVED:       'draw_saved',
  PARENT_PANEL_OPEN:'parent_panel_open',
  SESSION_END:      'session_end',       // { duration_seconds, modes_used[] }
} as const;
```

---

## 6. Frontend Architecture

### 6.1 Next.js App Router Structure

```
app/
├── (play)/                    # Child play zone — NO auth required
│   ├── layout.tsx             # Fullscreen layout, no navbar
│   ├── page.tsx               # KiddoKeys play screen
│   └── loading.tsx            # Animated loader
│
├── (parent)/                  # Parent portal — Auth required
│   ├── layout.tsx             # Parent dashboard layout
│   ├── login/page.tsx
│   ├── dashboard/page.tsx     # Stats overview
│   ├── drawings/page.tsx      # Saved drawings gallery
│   └── settings/page.tsx      # Child settings
│
├── api/
│   └── session/route.ts       # Edge function: session init
│
└── layout.tsx                 # Root layout with Firebase providers
```

### 6.2 Zustand Store Design

```typescript
// store/useAppStore.ts
interface AppStore {
  // Mode
  mode: 'keyboard' | 'draw' | 'bubbles' | 'stars';
  setMode: (mode: Mode) => void;

  // Settings (synced with Remote Config + Firestore)
  settings: {
    soundEnabled: boolean;
    animationsEnabled: boolean;
    theme: 'colorful' | 'space' | 'ocean' | 'jungle';
  };
  updateSettings: (patch: Partial<Settings>) => void;

  // Session stats (local, flushed to Firestore on exit)
  session: {
    id: string;
    startedAt: number;
    keyPresses: number;
    bubblesPopped: number;
    starsCaught: number;
  };
  incrementStat: (key: keyof SessionStats) => void;
  flushSession: () => Promise<void>;

  // Parent portal
  parentUser: FirebaseUser | null;
  setParentUser: (user: FirebaseUser | null) => void;
}
```

### 6.3 Component Architecture

```
components/
├── play/
│   ├── KeyboardZone.tsx        # Letter burst + audio
│   ├── DrawCanvas.tsx          # PixiJS canvas wrapper
│   ├── BubbleGame.tsx          # Bubble game engine
│   └── StarGame.tsx            # Star catch game engine
│
├── ui/
│   ├── BottomNav.tsx
│   ├── ParentPanel.tsx
│   ├── ThemeSelector.tsx
│   └── StatCard.tsx
│
├── parent/
│   ├── DashboardChart.tsx      # Recharts / sessions over time
│   ├── DrawingGallery.tsx
│   └── SettingsForm.tsx
│
└── providers/
    ├── FirebaseProvider.tsx    # Auth + Firestore context
    ├── RemoteConfigProvider.tsx
    └── AnalyticsProvider.tsx
```

---

## 7. Feature Modules

### Module 1 — Keyboard Play Zone
- Giant animated letters/emojis on key press
- Pentatonic musical scale via Tone.js (always sounds harmonious)
- Color cycling, screen flash, particle burst
- Fullscreen lock support (Fullscreen API)

### Module 2 — Drawing Canvas
- WebGL-accelerated PixiJS canvas
- 9 colors, 3 brush sizes, eraser, clear
- **Save Drawing** → uploads PNG to Firebase Storage
- Parent can view saved drawings in portal

### Module 3 — Bubble Pop Game
- Progressive difficulty via Remote Config
- Ocean background with animated wave
- Sea creature emojis inside bubbles
- High score stored in Firestore (per session)

### Module 4 — Star Catch Game
- Space parallax background with twinkling stars
- Falling star shapes with rotation + glow
- Same progressive difficulty system as bubbles

### Module 5 — Parent Portal
- **Firebase Auth** — Google / Apple / Email sign-in
- **Dashboard** — DAU-style charts for a single child
- **Drawings Gallery** — Browse, download, delete saved drawings
- **Settings** — Toggle sound, animations, theme, restrict modes
- **Weekly Report** — Cloud Function sends email summary
- **Remote Config override** — Parents can push custom difficulty

---

## 8. Database Schema

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Sessions: write-only, anonymous, no read
    match /sessions/{sessionId} {
      allow create: if request.resource.data.keys().hasOnly([
        'startedAt','mode','keyPresses','bubblesPopped','starsCaught','deviceType'
      ]);
      allow read, update, delete: if false;
    }

    // Parents: only the authenticated parent can read/write their own doc
    match /parents/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;

      match /children/{childId} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
    }

    // Analytics: read-only for authenticated parents
    match /analytics/{date} {
      allow read: if request.auth != null;
      allow write: if false; // only Cloud Functions write here
    }

    // Drawings: parent can read/delete their own
    match /drawings/{drawingId} {
      allow create: if request.auth != null;
      allow read, delete: if request.auth != null
        && resource.data.parentUid == request.auth.uid;
      allow update: if false;
    }
  }
}
```

---

## 9. Security & Safety

### Child Safety Principles

| Principle | Implementation |
|-----------|----------------|
| **No PII from children** | All play sessions are anonymous; zero personally identifiable data collected |
| **COPPA Compliant** | No accounts, no data collection on children under 13 |
| **No outbound links** | `Content-Security-Policy` blocks all navigation outside the domain |
| **No ads** | No ad SDK, no tracking pixels |
| **Fullscreen lock** | Reduces accidental exits (Fullscreen API + guided access hints) |

### Content Security Policy

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://www.gstatic.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src https://fonts.gstatic.com;
  img-src 'self' data: https://firebasestorage.googleapis.com;
  connect-src 'self' https://*.firebaseio.com wss://*.firebaseio.com
              https://firestore.googleapis.com https://www.googleapis.com;
  frame-ancestors 'none';
```

---

## 10. CI/CD Pipeline

```
GitHub Push / PR
      │
      ▼
┌─────────────────────────────────────────────────────┐
│                  GitHub Actions                      │
│                                                     │
│  ① Install (pnpm ci)                                │
│  ② Lint (ESLint + TypeScript typecheck)             │
│  ③ Unit Tests (Vitest)                              │
│  ④ Build (next build)                               │
│  ⑤ E2E Tests (Playwright — play + parent portal)   │
│  ⑥ Bundle size check (bundlewatch)                  │
│                                                     │
│  On main branch only:                               │
│  ⑦ Deploy to Firebase Hosting (Preview Channel)    │
│  ⑧ Deploy Cloud Functions                          │
│  ⑨ Run Firestore Rules Tests                       │
│  ⑩ Promote Preview → Live                          │
└─────────────────────────────────────────────────────┘
```

```yaml
# .github/workflows/deploy.yml (simplified)
name: CI/CD
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SA }}
          channelId: live
          projectId: kiddokeys-prod
```

---

## 11. Scalability Strategy

### Traffic Tiers

| Users (DAU) | Architecture Change |
|-------------|---------------------|
| 0 – 10K | Firebase free tier, single region |
| 10K – 100K | Upgrade to Blaze plan, enable BigQuery export |
| 100K – 1M | Cloud Functions min-instances, Firestore composite indexes tuned |
| 1M+ | Introduce Redis (Upstash) for hot counters, CDN image optimization via Firebase Extensions |

### Performance Targets

| Metric | Target |
|--------|--------|
| Lighthouse Score | ≥ 95 (all categories) |
| First Contentful Paint | < 1.0s |
| Time to Interactive | < 1.8s |
| Bundle Size (initial) | < 120 KB gzipped |
| Offline capability | 100% game playable offline |

### Scaling Patterns

1. **Session writes are fire-and-forget** — Client writes to Firestore on `beforeunload`; no blocking calls during play
2. **Remote Config cached locally** — Fetched once per session, cached 12h; no latency hit
3. **PixiJS asset preloading** — All game sprites/textures loaded during splash, not during gameplay
4. **Static pre-rendering** — Play zone is statically generated; parent portal is dynamic
5. **Edge middleware** — Feature flag checks at the edge (Next.js middleware + Firebase Hosting rewrites)
6. **Drawings upload progress** — Chunked uploads with resumable Firebase Storage sessions

---

## 12. Project Phases & Milestones

### Phase 1 — Foundation (Weeks 1–2)
- [ ] Next.js 15 + TypeScript project scaffold (Turborepo monorepo)
- [ ] Firebase project setup (Hosting, Firestore, Auth, Storage)
- [ ] Design tokens + Tailwind config
- [ ] CI/CD pipeline with GitHub Actions
- [ ] Remote Config integration

### Phase 2 — Play Zone (Weeks 3–4)
- [ ] Keyboard Zone (PixiJS + Tone.js)
- [ ] Drawing Canvas (PixiJS)
- [ ] Bottom navigation
- [ ] PWA manifest + service worker (offline support)
- [ ] Fullscreen API integration

### Phase 3 — Mini Games (Weeks 5–6)
- [ ] Bubble Pop game (PixiJS)
- [ ] Star Catch game (PixiJS)
- [ ] Progressive difficulty via Remote Config
- [ ] Particle system + audio feedback

### Phase 4 — Parent Portal (Weeks 7–8)
- [ ] Firebase Auth (Google + Apple + Email)
- [ ] Parent dashboard + Recharts analytics
- [ ] Settings sync (Firestore ↔ Remote Config)
- [ ] Drawing gallery (Firebase Storage)
- [ ] Weekly email report (Cloud Function)

### Phase 5 — Analytics & QA (Weeks 9–10)
- [ ] Full Firebase Analytics event instrumentation
- [ ] BigQuery export + sample queries
- [ ] Playwright E2E test suite
- [ ] Performance audit (Lighthouse CI)
- [ ] Accessibility audit (axe-core)
- [ ] Cross-device QA (iOS Safari, Android Chrome, Desktop)

### Phase 6 — Launch (Week 11–12)
- [ ] Production Firebase project (separate from staging)
- [ ] Custom domain + SSL
- [ ] Firebase App Check (anti-abuse)
- [ ] Sentry error monitoring
- [ ] Soft launch → full launch
- [ ] Post-launch monitoring (Firebase Performance + Crashlytics)

---

## 13. Folder Structure

```
kiddokeys/                          # Turborepo root
├── apps/
│   └── web/                        # Next.js 15 app
│       ├── app/
│       │   ├── (play)/
│       │   ├── (parent)/
│       │   └── layout.tsx
│       ├── components/
│       │   ├── play/
│       │   ├── parent/
│       │   ├── ui/
│       │   └── providers/
│       ├── store/                  # Zustand stores
│       ├── lib/
│       │   ├── firebase.ts         # Firebase SDK init
│       │   ├── analytics.ts        # Typed analytics helpers
│       │   ├── audio.ts            # Tone.js helpers
│       │   └── gameEngine.ts       # PixiJS factory helpers
│       ├── hooks/                  # useRemoteConfig, useParentAuth, etc.
│       ├── public/
│       │   └── sounds/
│       └── tests/
│           ├── unit/
│           └── e2e/                # Playwright
│
├── packages/
│   ├── ui/                         # Shared shadcn component library
│   ├── config/                     # ESLint, TS, Tailwind configs
│   └── types/                      # Shared TypeScript interfaces
│
├── functions/                      # Firebase Cloud Functions
│   ├── src/
│   │   ├── aggregateDailyStats.ts
│   │   ├── onParentSignup.ts
│   │   ├── generateDrawingThumb.ts
│   │   ├── cleanOldSessions.ts
│   │   └── sendWeeklyReport.ts
│   └── package.json
│
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
├── firebase.json
├── .firebaserc
├── turbo.json
└── pnpm-workspace.yaml
```

---

## 14. Cost Estimation

### Firebase Blaze Plan (Pay-as-you-go)

| Service | Usage (10K DAU) | Est. Monthly Cost |
|---------|----------------|-------------------|
| Hosting | 50 GB transfer | ~$5 |
| Firestore reads | 30M reads | ~$9 |
| Firestore writes | 10M writes | ~$9 |
| Cloud Functions | 5M invocations | ~$2 |
| Firebase Storage | 20 GB stored, 100 GB transfer | ~$5 |
| Firebase Analytics | Included | $0 |
| BigQuery export | 50 GB | ~$1 |
| **Total** | | **~$31/month** |

> At 100K DAU, estimate ~$250–350/month.  
> At 1M DAU, introduce CDN cost optimization and Redis for counters; estimate ~$1,500–2,500/month.

---

## Appendix A — Recommended Firebase Extensions

| Extension | Purpose |
|-----------|---------|
| `storage-resize-images` | Auto-generate drawing thumbnails |
| `firestore-send-email` | Weekly parent reports via SendGrid |
| `firestore-bigquery-export` | Pipe analytics to BigQuery |
| `auth-mailchimp-sync` | Optional: newsletter for parents |

---

## Appendix B — Useful Commands

```bash
# Install all dependencies
pnpm install

# Dev server
pnpm dev

# Build
pnpm build

# Run unit tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Deploy to Firebase (staging)
firebase use staging && firebase deploy

# Deploy to Firebase (production)
firebase use production && firebase deploy

# Deploy only functions
firebase deploy --only functions

# View Firestore rules diff
firebase firestore:rules:diff

# Emulate locally
firebase emulators:start
```

---

*KiddoKeys Project Plan — Confidential*  
*Last updated: March 2026*
