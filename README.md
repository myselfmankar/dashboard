# Dashboard

## What is this?
Notivo Dashboard is a modernized EdTech administration interface built with React 19, TypeScript, and Vite. It provides a centralized hub for managing students, teachers, parents, and school operations with a premium, high-performance architecture.

## Why using dummy data?
The project currently utilizes a mock backend (`db.json`) for several key reasons:
- **Structural Blueprint:** It mirrors the exact data models and API contracts expected by the production Kotlin backend.
- **Static Demonstrations:** It enables fully functional interactive demos on platforms like GitHub Pages without requiring a live server.
- **Rapid UI Iteration:** It allows for development and testing of complex views (like the teacher heatmap) independently of backend availability.

## How to run
1. **Clone the repository.**
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Create your Firebase env file:** Copy `.env.example` to `.env.local` and replace the placeholder values with your Firebase web app config from Firebase Console.
4. **Enable Email/Password auth in Firebase:** In Firebase Console, go to **Authentication > Sign-in method** and enable **Email/Password**.
5. **Create a Firebase user:** In Firebase Console, go to **Authentication > Users** and create the email/password account you want to use for the dashboard.
6. **Run the mock server (Background):**
   ```bash
   npm run server
   ```
7. **Start the development server:**
   ```bash
   npm run dev
   ```
8. **Access the app:** Open `http://localhost:5173` in your browser.
9. **Login:** Use the Firebase email/password user you created in step 5.

## Firebase credentials you actually need
The dashboard cannot connect to Firebase with only a username and password. Those are only for signing a user in.

You also need the Firebase web app configuration values from **Project settings > General > Your apps > Web app**:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Once those are in `.env.local`, the login screen will authenticate against Firebase instead of the prototype's hard-coded credentials.
