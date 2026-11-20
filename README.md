# CampusFix — DBS Global University Hostel & PG Service Prototype

CampusFix is a mobile-first student venture prototype built for the Entrepreneurship & Innovation assignment at DBS Global University (Dehradun). It helps DGU hostel and nearby PG students request, track, and review everyday campus services (Laundry, Electrical & Plumbing Repairs, Printing, and Housekeeping) in one place instead of scattered WhatsApp messages and phone calls.

> **Prototype Boundaries:** This is an academic student venture prototype, not an official DBS Global University service. Seeded providers and prices are **Demo Examples**. Payments are arranged directly with the service provider (no online payment gateway, no live GPS tracking, no automatic matching, and no file upload in v1). The venture plan assumes an INR 30 platform commission per completed booking as a planning assumption only.

---

## 1. Local Installation & Production Build

**Prerequisites:** Node.js 20+ and npm.

```bash
npm install
cp .env.example .env.local
# Fill in your VITE_FIREBASE_* values in .env.local (or use firebase-applet-config.json)
npm run dev
```

Verify TypeScript and Vite production build:

```bash
npm run lint
npm run build
```

The production static bundle is emitted to `dist/`.

---

## 2. Firebase Connection, Trusted Role Setup & Catalog Seeding

### A. Firebase Project Configuration
1. Create or select a Firebase project in the [Firebase Console](https://console.firebase.google.com/).
2. Register a **Web App** and copy its SDK config values into `.env.local` (for local) or Vercel Environment Variables (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_DATABASE_ID`).
   - Never place Firebase Admin SDK credentials, private keys, or service-account JSON in the client repository.
3. Enable **Authentication -> Sign-in method -> Google**.
4. Create a **Cloud Firestore** database.
5. Publish `firestore.rules` and `firestore.indexes.json`:
   ```bash
   npx firebase-tools login
   npx firebase-tools use <your-firebase-project-id>
   npx firebase-tools deploy --only firestore:rules,firestore:indexes
   ```
   *(In AI Studio, `firestore.rules` is already deployed to the provisioned project.)*

### B. One-Time Trusted Role Setup (Firebase Console)
Ordinary users always register with `role: "student"` and cannot promote themselves or choose a provider/admin role at signup.

- **Owner / Admin account:**
  1. Sign in once in the app using Google so your Firebase Auth UID is created (visible on the **Profile** page).
  2. In **Firebase Console -> Firestore Database**, create document `/admins/<YOUR_UID>` with fields:
     - `uid` (string): `<YOUR_UID>`
     - `email` (string): `<YOUR_VERIFIED_GOOGLE_EMAIL>`
     - `addedAt` (timestamp): *Server timestamp / current time*
- **Authorized Provider account:**
  1. First seed the catalog (below) so provider documents (e.g. `prov_demo_laundry`) exist in `/providers`.
  2. Have the provider sign in once with Google and copy their UID from **Profile**.
  3. Either use the **Admin Console -> Authorize a provider Google account** form in the app, **or** in **Firebase Console -> Firestore Database** create `/providerAccounts/<PROVIDER_UID>` with:
     - `uid` (string): `<PROVIDER_UID>`
     - `providerId` (string): e.g. `"prov_demo_laundry"`
     - `providerName` (string): e.g. `"Pondha Wash & Fold (Demo Example)"`
     - `email` (string): `<PROVIDER_GOOGLE_EMAIL>`
     - `active` (boolean): `true`
     - `createdAt` (timestamp): *current time*
     - `updatedAt` (timestamp): *current time*

### C. One-Time Idempotent Catalog Seeding
Catalog data is never auto-written during normal page loads.
1. Sign in as a verified administrator.
2. Open **Admin** (`/admin`).
3. Click **Seed demo catalog (idempotent)** to create the 4 demo providers, their protected `providerPrivate` documents, and 8 demo services without overwriting any existing customizations.

---

## 3. Exporting to GitHub

1. Initialize Git (if not already initialized) and verify `.env*` files with secrets are ignored by `.gitignore` (while `.env.example` stays tracked).
2. Push to a new GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial CampusFix student venture prototype"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```

---

## 4. Deploying on Vercel

1. Go to [Vercel](https://vercel.com/new) and import your GitHub repository.
2. Configure Build & Output Settings:
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add all `VITE_FIREBASE_*` environment variables from `.env.example` in **Project Settings -> Environment Variables**.
4. Deploy.
5. **Important:** Copy your final Vercel hostname (e.g. `campusfix-dgu.vercel.app`) and add it to **Firebase Console -> Authentication -> Settings -> Authorized domains** so Google sign-in popups work on the live URL.

---

## 5. Vercel SPA Route Fallback

`vercel.json` is included at the repository root and rewrites all routes (`/(.*)`) to `/index.html`, ensuring direct refreshes on `/services`, `/book`, `/requests`, `/requests/:id`, `/profile`, `/provider`, and `/admin` work cleanly without 404 errors.

---

## 6. End-to-End Verification Checklist (2 Students + 1 Provider)

1. **Admin Setup:** Sign in as Admin -> open `/admin` -> click **Seed demo catalog** -> verify 4 demo providers and 8 demo services appear on `/services`.
2. **Student A Flow:** Sign in with Google Account A -> open `/book` -> submit a booking for a future date -> confirm `/requests/<id>` shows generated `CF-YYYY-XXXXXX` reference and `Requested` status -> refresh browser and sign out/in to confirm persistence.
3. **Cross-Student Isolation:** Sign in with Google Account B -> confirm `/requests` does not show Student A's bookings, and visiting `/requests/<StudentA_BookingId>` returns permission denied. Confirm Profile has no role selector and Account B cannot access `/provider` or `/admin`.
4. **Cancellation Enforcement:** Student A cancels a `Requested` or `Accepted` booking -> status updates to `Cancelled`. Once a provider moves a booking to `In Progress`, verify cancellation is blocked.
5. **Provider Progression & Review:** Link Account C (or a test Google account) to `prov_demo_laundry` via `/admin` -> sign in as Account C -> open `/provider` -> accept Student A's booking (`Accepted`), move to `In Progress`, then `Completed` -> sign back in as Student A -> submit a 1–5 star review on `/requests/<id>` -> confirm duplicate review submission is prevented.
