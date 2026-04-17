# BIFA Football Club Management System

A full-stack club management system with a public registration portal, backend API, and mobile admin panel.

## Folder Structure
- `/backend`: Node.js, Express, MongoDB (Mongoose)
- `/player-web`: React.js (Vite) Registration site
- `/admin-app`: React Native (Expo) Admin Mobile App

## 1. Backend Setup
1. CD into the backend `cd backend`
2. Ensure you have MongoDB running locally.
3. Update `.env` with your actual email credentials to utilize Nodemailer. Default is localhost MongoDB.
4. Run the seed script to create your first admin:
   `node seedAdmin.js`
   (This creates an admin with username `admin`, password `password123`)
5. Start the backend: `npx nodemon`

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
