# 🚀 Solvex AI — Complete Deployment Guide

## What's included
- ✅ Next.js 14 app with TypeScript + Tailwind
- ✅ Supabase authentication (email + Google OAuth)
- ✅ Usage counter with free tier enforcement (20 msgs/day)
- ✅ Razorpay payment integration (one-click upgrade to Pro)
- ✅ Anthropic AI brain (Claude Sonnet under the hood)
- ✅ Chat history stored in Supabase
- ✅ Row-level security (users see only their data)
- ✅ Subscription management

---

## Step 1 — Set up Supabase (Free)

1. Go to https://supabase.com → Create account → New project
2. Note your **Project URL** and **Anon Key** (Settings → API)
3. Go to **SQL Editor** → paste the entire contents of:
   `supabase/migrations/001_initial_schema.sql`
   → Click **Run**
4. Enable Google OAuth (optional but recommended):
   - Settings → Authentication → Providers → Google
   - Add your Google OAuth credentials

---

## Step 2 — Set up Razorpay (Free account)

1. Go to https://razorpay.com → Create account
2. Complete KYC (required to receive payments)
3. Settings → API Keys → Generate Key
4. Note your **Key ID** and **Key Secret**
5. For testing, use Test Mode keys (prefix: `rzp_test_`)

---

## Step 3 — Get Anthropic API Key

1. Go to https://console.anthropic.com
2. API Keys → Create Key
3. Add credits (minimum $5 — lasts thousands of messages)

---

## Step 4 — Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_...
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## Step 5 — Run locally

```bash
npm install
npm run dev
```

Visit http://localhost:3000 → sign up → start chatting!

---

## Step 6 — Deploy to Vercel (Free)

```bash
npm install -g vercel
vercel
```

Or deploy via GitHub:
1. Push this repo to GitHub
2. Go to https://vercel.com → New Project → Import your repo
3. Add all environment variables in Vercel dashboard
4. Click Deploy

**That's it — your AI is live on the internet!**

---

## How the money flows

```
User signs up (free)
    ↓
Uses 20 messages → hits limit
    ↓
Upgrade modal appears
    ↓
Clicks "Upgrade to Pro — ₹499/mo"
    ↓
Razorpay checkout opens (UPI, cards, netbanking)
    ↓
Payment succeeds → backend verifies signature
    ↓
User's plan → 'pro' in Supabase
    ↓
Unlimited messages forever (until cancelled)
```

---

## Revenue projections

| Free users | Conversion rate | Monthly revenue |
|-----------|----------------|----------------|
| 1,000     | 5%             | ₹24,950        |
| 5,000     | 5%             | ₹1,24,750      |
| 10,000    | 5%             | ₹2,49,500      |

Cost per user (API): ~₹2-5/month for heavy users.

---

## Folder structure

```
solvex/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/route.ts          ← AI endpoint
│   │   │   └── payment/
│   │   │       ├── create-order/      ← Razorpay order
│   │   │       └── verify/            ← Payment verification
│   │   ├── auth/callback/route.ts     ← OAuth callback
│   │   ├── dashboard/page.tsx         ← Main app
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── components/
│   │   └── Dashboard.tsx              ← Chat UI + upgrade flow
│   ├── hooks/
│   │   └── useRazorpay.ts             ← Payment hook
│   └── lib/
│       ├── auth/actions.ts            ← Login/signup/logout
│       ├── plans.ts                   ← Tier limits
│       └── supabase/                  ← DB clients
├── supabase/migrations/               ← Database schema
├── .env.example                       ← Environment template
└── README.md                          ← This file
```

---

## Next features to add
- [ ] Admin dashboard (see all users + revenue)
- [ ] Annual plan discount (₹3,999/year = 33% off)
- [ ] Referral system (give 5 free days per referral)
- [ ] File/image upload (Pro feature)
- [ ] API access for developers (Enterprise)
- [ ] Email notifications (subscription renewal etc.)
