Create a componet in @/components that allows the user to upload a raw csv file and create a jupyter notebook that will clean the raw csv and output the clean csv file for download.

The component is mounted in app/admin/page.js
cd ..

create the jupyter notebook in app/ipynb

You are a senior full-stack engineer. Build a production-ready web app that supports “one-click account creation” using passwordless email link sign-in.

GOAL
Create a web app where a user enters an email, clicks “Send me a login link”, then confirms by clicking the link in their email. If the user is new, they are automatically created as an account. If they already exist, they are signed in. No passwords.

TECH STACK (choose this exactly)
- Frontend: Next.js (App Router) + TypeScript + Tailwind CSS
- Auth: Firebase Authentication (Email Link / Passwordless)
- Database: Firestore (store user profile: uid, email, createdAt, lastLoginAt)
- Hosting: Firebase Hosting (or Vercel is acceptable, but keep Firebase-first)

FEATURES
1) Landing page
- Minimal UI: email input + “Continue” button
- Explain: “We’ll email you a secure sign-in link.”
- Validate email format and show friendly errors

2) Passwordless flow (Email Link)
- On submit: sendSignInLinkToEmail(email, actionCodeSettings)
- Save email to localStorage for completing sign-in on same device
- Create a /finish route that completes sign-in:
  - Check isSignInWithEmailLink(window.location.href)
  - Use signInWithEmailLink(email, window.location.href)
  - If email not in localStorage (user opened on another device), prompt for email once

3) Account creation + persistence
- On first login: create a Firestore document users/{uid}
- On subsequent logins: update lastLoginAt
- Use server timestamps

4) Protected dashboard
- Route: /dashboard
- Only accessible when authenticated
- Show: user email + uid + createdAt + lastLoginAt
- Provide “Sign out” button

5) Security and best practices
- Firebase Security Rules: users can read/write only their own document
- Do not expose secrets in client
- Use environment variables for Firebase config
- Add loading states and error handling
- Clean folder structure and clear comments

DELIVERABLES
A) Provide the full project structure with file paths
B) Provide complete code for every file needed
C) Provide step-by-step setup instructions:
   - Create Firebase project
   - Enable Email Link sign-in
   - Configure authorized domains
   - Set actionCodeSettings redirect URL for local + production
   - Create Firestore + rules
   - Add env vars
   - Run locally and deploy

UI REQUIREMENTS
- Clean, modern layout
- Mobile responsive
- Use Tailwind (no external UI kits required)

IMPORTANT
- Keep code minimal but complete.
- Do not skip any essential file.
- Ensure the email link flow actually works end-to-end.
