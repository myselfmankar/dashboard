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
3. **Run the mock server (Background):**
   ```bash
   npm run server
   ```
4. **Start the development server:**
   ```bash
   npm run dev
   ```
5. **Access the app:** Open `http://localhost:5173` in your browser.
6. **Login:** Use `admin@notivo.edu` / `Notivo@2026`.
