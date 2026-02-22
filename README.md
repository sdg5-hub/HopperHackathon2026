# MedTrack

MedTrack is a local-first medication adherence app built for hackathon demo use.  
It helps users stay on schedule with reminders, log dose outcomes, review adherence, and access safety-focused guidance.

## Live Repository
- GitHub: https://github.com/sdg5-hub/HopperHackathon2026

## What MedTrack Does
- Medication management (add/edit/delete/deactivate)
- Flexible schedules (fixed times, every X hours, days of week, PRN)
- Local reminder notifications with snooze options
- Due-dose action flow: **Taken / Snooze / Skip**
- History + filters + status chips
- Safety Check + Missed Dose Guidance
- Emergency Card with one-tap share text
- Demo mode for judge walkthrough

## Important Safety Note
MedTrack is a prototype and **not medical advice**.  
Guidance is **not exhaustive**. Always confirm medication decisions with licensed professionals.

---

## Built With
- TypeScript
- React Native + Expo
- Expo Router
- SQLite (`expo-sqlite`)
- Expo Notifications (`expo-notifications`)
- Expo Camera (`expo-camera`)
- `@expo/vector-icons`
- `react-native-safe-area-context`
- `date-fns`

No backend required (local-first).

---

## Project Structure
txt
MedTrack/
  app/
  components/
  lib/
    app/
    db/
    notifications/
  theme/
  assets/

## How to Run Locally (Expo Go)
Prerequisites
Node.js 18+ (or 20+)
npm
Expo Go app on your phone (iOS/Android)
Phone and laptop on same Wi-Fi
Steps
git clone https://github.com/sdg5-hub/HopperHackathon2026.git
cd HopperHackathon2026/MedTrack
npm install
npx expo start --lan --clear

Then:

1.Open Expo Go on your phone.
2.Scan the QR code shown in terminal.

## Features in Detail
Onboarding
Welcome + disclaimer
Notification permission step
Profile setup step
Finish step
Medication Management
CRUD for medications
Schedule configuration
Warning tags
Optional barcode scan to prefill fields
Reminder Engine
Local scheduled notifications
Resync on updates
Snooze support
Due-dose modal integration
Adherence + History
7-day adherence %
Streak
Dose status timeline
Filters and status chips
Safety + Emergency
Safety rules overview
Missed-dose guidance
Emergency info card and share action

## Demo Mode
From Profile:

Load demo data + schedule near-future reminder
Clear demo data (removes only demo records)

## Data & Privacy
Data is stored locally on device (SQLite/local settings)
No remote server required
No third-party medical data API used in prototype mode

## Troubleshooting
Expo won’t start / hangs
pkill -f "expo|metro|react-native|node" || true
rm -rf .expo .expo-shared
npx expo start --lan --clear --port 8081
iOS Expo Go cannot connect
Ensure same Wi-Fi
Disable VPN
Fully close/reopen Expo Go
Rescan latest QR

## Team Notes
If you’re collaborating:

git checkout main
git pull origin main
