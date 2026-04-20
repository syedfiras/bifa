# BIFA Football Club Management System

A full-stack club management system with a public registration portal, backend API, and mobile admin panel.

## Folder Structure
- `/backend`: Node.js, Express, Supabase (PostgreSQL)
- `/player-web`: React.js (Vite) Registration site
- `/admin-app`: React Native (Expo) Admin Mobile App

## 1. Backend Setup
1. CD into the backend: `cd backend`
2. Install packages: `npm install`
3. Configure `.env` with:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (recommended) or `SUPABASE_KEY`
   - `JWT_SECRET`
   - `EMAIL_USER` and `EMAIL_PASS`
4. In Supabase SQL Editor, run `backend/supabase-schema.sql`.
5. Seed first admin:
   - `npm run seed:admin`
   - This creates `admin / password123` if missing.
6. Start backend:
   - Dev: `npm run dev`
   - Start: `npm start`

## 2. Player Web Setup
1. `cd player-web`
2. Start the app: `npm run dev`
3. Open the localhost URL in browser to view the registration form.

## 3. Admin App Setup
1. `cd admin-app`
2. Test on web: `npm run web`
3. Test on device/emulator: `npm start`
   *(Note: Ensure your device and computer are on the same network. Look inside src/screens/LoginScreen.js to adjust the IP if testing on a physical iPhone/Android).*
   
Login using the seeded admin credentials (`admin` / `password123`).
