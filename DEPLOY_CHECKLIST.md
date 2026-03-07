# Deployment Checklist (Cloudflare Pages + Firebase + Subdomain)

This checklist is for deploying this app using:
- GitHub repo
- Cloudflare Pages
- Cloudflare DNS
- Firebase Auth + Firestore

It assumes you will use this subdomain:
- `datamentor.marcbd.site`

If you ever change subdomain later, update all places where this URL is used.

---

## 1) Choose Your Production URL

- Final app URL: `https://datamentor.marcbd.site`
- Keep this same URL in:
  - Cloudflare Pages custom domain
  - `NEXT_PUBLIC_APP_URL`
  - Firebase Authorized Domains

---

## 2) Confirm Local Build (already done once)

Run:

```bash
npm run lint
npm run build
```

Expected:
- No lint errors
- Static output generated in `out/`

---

## 3) Push Code to GitHub

```bash
git add .
git commit -m "Prepare Cloudflare Pages static deployment"
git push origin main
```

If your default branch is not `main`, push to that branch.

---

## 4) Create Cloudflare Pages Project

In Cloudflare Dashboard:
1. Go to `Workers & Pages` -> `Create` -> `Pages` -> `Connect to Git`.
2. Select your GitHub repo.
3. Build settings:
   - Framework preset: `Next.js (Static HTML Export)` or `None` if unavailable
   - Build command: `npm run build`
   - Build output directory: `out`
   - Node version: `20` (recommended)

---

## 5) Add Environment Variables (Cloudflare Pages)

Add these in Pages project settings for Production (and Preview if needed):

- `NEXT_PUBLIC_APP_URL=https://datamentor.marcbd.site`
- `NEXT_PUBLIC_FIREBASE_API_KEY=...`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID=...`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...`
- `NEXT_PUBLIC_FIREBASE_APP_ID=...`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...` (optional)

Then trigger a redeploy.

---

## 6) Attach Subdomain in Cloudflare Pages

In Pages project:
1. `Custom domains` -> `Set up a custom domain`
2. Enter `datamentor.marcbd.site`
3. Save

Cloudflare usually creates DNS automatically.

If not automatic, create this DNS record manually:
- Type: `CNAME`
- Name: `datamentor`
- Target: `<your-pages-project>.pages.dev`
- Proxy status: `Proxied` (orange cloud)
- TTL: `Auto`

Do not use URL (`https://`) in target, only hostname.

---

## 7) Firebase Auth Configuration

In Firebase Console:
1. Authentication -> Sign-in method -> Email/Password
2. Enable `Email link (passwordless sign-in)`
3. Authentication -> Settings -> Authorized domains
4. Add:
   - `datamentor.marcbd.site`
   - `<your-pages-project>.pages.dev`

If you may also use `www` later, add `www.marcbd.site` too.

---

## 8) Firestore Rules

Ensure production rules are published from:
- `firestore.rules`

Current expected rules include:
- users can read/write only their own `/users/{uid}` doc
- admin reads from `/admins/{uid}` with restricted writes

---

## 9) End-to-End Test (Production)

1. Open `https://datamentor.marcbd.site`
2. Upload CSV
3. Confirm cleaned CSV download works
4. Confirm notebook `.ipynb` download works
5. Open `/login` and send sign-in link
6. Click email link and confirm `/finish` -> `/dashboard`
7. Confirm `/admin` only for users in Firestore `admins` collection

---

## 10) Sustainability Checklist

- Keep Cloudflare + Firebase in one region closest to users
- Use `main` branch protected with PR review
- Keep `.env.local` out of git
- Rotate Firebase keys if leaked
- Monthly:
  - test login link flow
  - test CSV and notebook downloads
  - review Cloudflare deploy logs

---

## 11) Rollback Plan

If a deploy breaks:
1. In Cloudflare Pages, open `Deployments`
2. Promote previous successful deployment
3. Keep DNS unchanged

This gives fast rollback without touching Firebase.

---

## 12) Access Needed If You Want Me To Drive Everything With You

I cannot directly log into your external accounts from this coding environment.
Fastest safe approach is live guided execution while you click.

If you want a collaborator/operator to do it fully, grant least-privilege access:
- GitHub:
  - Repo access: `Write` (or `Admin` only if needed)
- Cloudflare:
  - Zone DNS: `Edit`
  - Pages: `Edit`
  - SSL/TLS read access
- Firebase:
  - Project role: `Editor` (or scoped equivalent)
  - Auth config permission
  - Firestore rules publish permission

Never share raw passwords in chat. Use invited member roles instead.
