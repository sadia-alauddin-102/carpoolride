# PoolRide — Colleague Carpooling App

A production-ready web app for workplace carpooling. Built with React + Vite + Supabase.

---

## What's included

- **Find Ride** — browse, search & filter colleague rides with real-time seat availability
- **Offer Ride** — post routes with multiple waypoints/stops, schedule, seat count, free or paid
- **My Rides** — manage your offered rides, approve/decline seat requests, view joined rides
- **Real-time Chat** — direct messaging between drivers and passengers (Supabase Realtime)
- **Email Notifications** — ride request, confirmation, cancellation, new message emails
- **Admin Dashboard** — manage users and rides, suspend accounts
- **PWA** — installable on iOS and Android from the browser
- **Work email restriction** — only your company domain can sign up

---

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React 18 + Vite                   |
| Styling    | Plain CSS + CSS variables         |
| Routing    | React Router v6                   |
| Backend    | Supabase (PostgreSQL + Auth + Realtime) |
| Emails     | Resend + Supabase Edge Functions  |
| PWA        | vite-plugin-pwa (Workbox)         |
| Deploy     | Vercel or Netlify (free tier)     |

---

## Step 1 — Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New project**, give it a name (e.g. `poolride`), choose a region close to your users
3. Wait ~2 minutes for the project to spin up
4. Go to **SQL Editor** in the left sidebar
5. Copy the entire contents of `supabase/migrations/001_schema.sql` and paste it in, then click **Run**
6. Go to **Project Settings → API** and copy:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon / public** key

---

## Step 2 — Configure email (optional but recommended)

1. Create a free account at [resend.com](https://resend.com)
2. Add and verify your sending domain (e.g. `poolride.yourcompany.com`)
3. Go to **API Keys** and create one
4. Install the Supabase CLI: `npm install -g supabase`
5. Login: `supabase login`
6. Link your project: `supabase link --project-ref YOUR_PROJECT_REF`
   (find your project ref in Supabase → Settings → General)
7. Set the Resend secret:
   ```
   supabase secrets set RESEND_API_KEY=re_your_key_here
   ```
8. Deploy the email function:
   ```
   supabase functions deploy send-email
   ```
9. In `supabase/functions/send-email/index.ts`, update `FROM_EMAIL` to your verified sender email

> If you skip email setup, the app still works fully — email notifications just won't fire.

---

## Step 3 — Run locally

```bash
# Clone / download the project folder
cd poolride

# Install dependencies
npm install

# Create your environment file
cp .env.example .env

# Edit .env and fill in your values:
# VITE_SUPABASE_URL=https://xxxxx.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key
# VITE_COMPANY_DOMAIN=yourcompany.com   ← employees must sign up with this domain
# VITE_APP_NAME=PoolRide

# Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Step 4 — Create the first admin user

1. Sign up in the app using your work email
2. Confirm your email (check your inbox)
3. Go to Supabase → **Table Editor → profiles**
4. Find your row, click Edit, set `is_admin` to `true`, save
5. Refresh the app — you'll see the **Admin** badge and link in the header

---

## Step 5 — Deploy to Vercel (recommended, free)

### Option A — Vercel (easiest)

1. Push the project to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo
3. Vercel auto-detects Vite. In **Environment Variables**, add:
   ```
   VITE_SUPABASE_URL        = https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY   = your-anon-key
   VITE_COMPANY_DOMAIN      = yourcompany.com
   VITE_APP_NAME            = PoolRide
   ```
4. Click **Deploy** — done! You'll get a live URL like `poolride.vercel.app`
5. Add a custom domain in Vercel → Project → Domains (optional)

### Option B — Netlify

1. Push to GitHub
2. Go to [netlify.com](https://netlify.com) → **Add new site** → Import from Git
3. Build command: `npm run build` | Publish directory: `dist`
4. Add the same environment variables as above under **Site settings → Environment variables**
5. Click **Deploy site**

---

## Step 6 — Share with your team

Once deployed, share the URL with colleagues. They:
1. Visit the URL
2. Sign up with their `@yourcompany.com` email
3. Confirm their email
4. Start offering or finding rides immediately

**To install as a mobile app (PWA):**
- **iPhone/iPad**: Open in Safari → Share button → "Add to Home Screen"
- **Android**: Open in Chrome → three-dot menu → "Add to Home Screen" or "Install app"

---

## Customisation

| What to change          | Where                              |
|-------------------------|------------------------------------|
| Company domain          | `.env` → `VITE_COMPANY_DOMAIN`     |
| App name                | `.env` → `VITE_APP_NAME`           |
| Email sender address    | `supabase/functions/send-email/index.ts` → `FROM_EMAIL` |
| Brand colour            | `src/styles/globals.css` → `--green` |
| Currency (AED)          | Search for `AED` in `src/pages/`   |

---

## Project structure

```
poolride/
├── src/
│   ├── components/
│   │   ├── Layout.jsx      # App shell, nav, protected routes
│   │   └── UI.jsx          # Shared: Avatar, Modal, Toast, RouteDisplay…
│   ├── hooks/
│   │   ├── useAuth.jsx     # Auth context + profile
│   │   └── useRealtime.js  # Supabase realtime subscriptions
│   ├── lib/
│   │   └── supabase.js     # All DB queries + auth helpers
│   ├── pages/
│   │   ├── AuthPage.jsx    # Login / signup / forgot password
│   │   ├── FindRidePage.jsx
│   │   ├── OfferRidePage.jsx
│   │   ├── MyRidesPage.jsx
│   │   ├── ChatPage.jsx
│   │   ├── ProfilePage.jsx
│   │   └── AdminPage.jsx
│   ├── styles/
│   │   └── globals.css
│   ├── App.jsx
│   └── main.jsx
├── supabase/
│   ├── migrations/
│   │   └── 001_schema.sql  # Full DB schema — run this first
│   └── functions/
│       └── send-email/
│           └── index.ts    # Edge function for email notifications
├── public/
│   └── icons/              # Add icon-192.png and icon-512.png for PWA
├── index.html
├── vite.config.js
├── vercel.json
├── netlify.toml
├── .env.example
└── package.json
```

---

## PWA Icons

Add two icon files to `public/icons/` before deploying:
- `icon-192.png` — 192×192 px
- `icon-512.png` — 512×512 px

You can use any free icon generator (e.g. [favicon.io](https://favicon.io)) to make these from text or an image.

---

## Support

Built with:
- [Supabase docs](https://supabase.com/docs)
- [Vite docs](https://vitejs.dev)
- [Resend docs](https://resend.com/docs)
