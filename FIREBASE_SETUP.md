# Firebase Setup Guide

Follow these steps to configure Firebase for the Notebook Studio app.

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter a project name (e.g., "notebook-studio")
4. Disable Google Analytics (optional for this project)
5. Click "Create project"

## 2. Enable Email Link Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Click **Email/Password**
3. Toggle **Enable** the "Email link (passwordless sign-in)" option
4. Click **Save**

## 3. Configure Authorized Domains

1. In **Authentication** → **Settings** → **Authorized domains**
2. Add your domains:
   - `localhost` (should already be there for development)
   - Your production domain when you deploy (e.g., `your-app.vercel.app`)

## 4. Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps" section
3. Click the **Web app** icon (`</>`)
4. Register your app with a nickname (e.g., "notebook-studio-web")
5. Copy the `firebaseConfig` object values

## 5. Update .env.local

Open `/home/engra/notebook/notebook-studio/.env.local` and replace the placeholder values:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Copy these values from Firebase Console → Project Settings → Your apps
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Important:** After updating `.env.local`, restart your dev server:
```bash
# Stop the current server (Ctrl+C), then:
npm run dev
```

## 6. Create Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode**
4. Select a location close to your users
5. Click **Enable**

## 7. Deploy Firestore Security Rules

1. In Firebase Console, go to **Firestore Database** → **Rules**
2. Replace the default rules with the content from `firestore.rules`:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /users/{userId}/works/{workId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /admins/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false;
    }
  }
}
```

3. Click **Publish**

## 8. Create Admin Users (Optional)

To access the `/admin` page with the CSV Notebook Builder:

1. First, sign in to the app normally to create your user account
2. Note your user UID from the dashboard at `/dashboard`
3. In Firebase Console, go to **Firestore Database**
4. Click **Start collection**
5. Collection ID: `admins`
6. Document ID: (paste your UID here)
7. Add any field (e.g., `role: "admin"`)
8. Click **Save**

Now you can access `/admin` with that user account.

## 9. Test the App

1. Start the dev server: `npm run dev`
2. Open `http://localhost:3000`
3. Enter your email and click "Continue"
4. Check your email inbox for the sign-in link
5. Click the link to complete sign-in
6. You should be redirected to `/dashboard`

## Troubleshooting

### "Firebase env vars contain placeholder values" error
- Make sure you've replaced ALL placeholder values in `.env.local`
- Restart the dev server after updating `.env.local`

### Email not received
- Check your spam folder
- Verify the email is correct
- Check Firebase Console → Authentication → Sign-in method → Email link is enabled
- Verify your domain is in the authorized domains list

### "You do not have admin access" on /admin page
- Make sure you created a document in the `admins` collection with your UID
- The document ID must exactly match your user UID (visible on the dashboard)

### "This sign-in link is invalid or expired"
- Email links expire after a certain time
- Request a new link
- Make sure you're opening the link in the same browser (or enter your email manually)

## Production Deployment

When deploying to production (e.g., Vercel, Netlify):

1. Add your production domain to Firebase authorized domains
2. Update `NEXT_PUBLIC_APP_URL` to your production URL
3. Add all environment variables to your hosting platform
4. Deploy the app
5. Test the email link flow on production

## Security Notes

- All `NEXT_PUBLIC_*` variables are safe to expose on the client side
- Firebase security is enforced through Firestore Rules, not config secrecy
- Never commit `.env.local` to version control (it's already in `.gitignore`)
- Keep your Firebase Admin SDK credentials server-side only (not used in this app)
