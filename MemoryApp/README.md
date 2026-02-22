# RxShield (MemoryApp)

RxShield is a local-first Expo app for medication reminders, dose tracking, and safety-first workflows.

## Stack
- Expo + React Native + TypeScript
- Expo Router (tabs + stack flows)
- SQLite (`expo-sqlite`) for all local data
- Local notifications (`expo-notifications`)

## Run
```bash
cd "/Users/osamahgilani/Documents/New project/HopperHackathon2026/MemoryApp"
npm install
npx expo start --lan --clear
```

If LAN fails:
```bash
npx expo start --tunnel --clear
```

## Product Surfaces
- First-launch onboarding flow (`/app/(onboarding)/*`)
- Tabs: Home, Meds, History, Profile (`/app/(tabs)/*`)
- Medication CRUD + schedule editing (`/app/meds/*`)
- Safety Check (`/app/safety-check.tsx`)
- Missed Dose Guidance (`/app/missed-dose-guidance.tsx`)
- Emergency Card (`/app/emergency-card.tsx`)

## Safety Check
- Launch-gated unless acknowledged.
- Includes local rules, severity legend, and “not exhaustive” disclaimer.
- Settings supports:
  - Re-show Safety Check on launch
  - Reset Safety Check acknowledgement

## Auto-Miss Reliability
- Old `due` doses auto-mark `missed` after configurable window.
- Options: 1h / 2h / 4h / Never.
- Sweep runs on app launch, app foreground, and periodic interval.

## Demo Mode for Judges
- Profile → **Load demo data + schedule near-future reminder**
- Inserts demo meds + schedules + historical events (`is_demo=1`)
- Schedules near-future reminder for live walkthrough
- Profile → **Clear demo data** removes demo records only

## Demo Script
1. Open Profile tab and run **Load demo data + schedule near-future reminder**.
2. Open Home: show streak, 7-day adherence, and timeline.
3. Open History: switch date ranges + medication filter chips.
4. Tap a notification: due modal opens.
5. Snooze then mark Taken.
6. Open Missed Dose Guidance from History for a missed/skipped row.
7. Open Safety Check and Emergency Card for clinical-safety walkthrough.

## Safety Notes
- RxShield is **not medical advice**.
- Guidance is **not exhaustive**.
- Always confirm medication decisions with a pharmacist or clinician.
