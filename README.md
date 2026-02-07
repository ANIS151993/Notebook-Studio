## Notebook Studio

Next.js app for passwordless email-link auth with Firebase Auth and Firestore-backed user profiles.

## Local Setup

1. Create your local env file from the template:

```bash
cp .env.local.example .env.local
```

2. Fill `.env.local` with your Firebase web app config values from Firebase Console:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` (optional for analytics)
- `NEXT_PUBLIC_APP_URL` (use `http://localhost:3000` for local dev)

3. Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

4. Open `http://localhost:3000`.

If env vars are missing, the app renders a clear in-app configuration error instead of crashing at module import time.

## Scripts

- `npm run dev` - Start local dev server
- `npm run build` - Create production build
- `npm run start` - Run production server
- `npm run lint` - Run ESLint

## Notes

- Firebase client config values are safe to expose as `NEXT_PUBLIC_*`.
- Sensitive admin credentials should only be used server-side (not in `NEXT_PUBLIC_*` vars).
