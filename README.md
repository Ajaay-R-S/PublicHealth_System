# Aarogya Ai MH — SIH 26133 Prototype

A clickable, browser-based prototype for **PS 26133 — Accessibility and quality of public
healthcare services in rural/underserved areas** (Government of Maharashtra). Built to reuse
the Aarogya AI triage logic and demo the continuity-of-care journey across facility tiers.

## Run it
No build step, no server required.
1. Unzip the folder.
2. Double-click `index.html` — it opens in any browser (Chrome recommended for voice input).
3. For the mic feature, allow microphone access when prompted.

To host it live for judges (optional): drag the folder into
[Netlify Drop](https://app.netlify.com/drop) or push it to a GitHub repo and enable GitHub Pages.
Either gives you a public URL in under a minute.

## Folder structure
```
sih-aarogya-setu-mh/
├── index.html        # App shell, header, tabs
├── css/
│   └── style.css      # All styling, incl. large-text / elder-friendly mode
├── js/
│   ├── strings.js      # EN / HI / MR text — edit here to correct wording
│   ├── data.js          # Mock facilities, symptoms, medicines, follow-ups, voice keyword map
│   └── app.js            # State, screens, voice input, read-aloud, all interactions
└── README.md
```

## What's implemented (demo, in-memory — no backend yet)
- **Trilingual UI** — English / Hindi / Marathi toggle in the header, applied everywhere.
- **Voice input for triage** — tap the mic and describe the problem in Marathi, Hindi, or
  English (`js/app.js` → `startVoiceInput`, uses the browser's Web Speech API). The transcript
  is matched against a keyword map (`js/data.js` → `VOICE_KEYWORDS`) to auto-select likely
  symptoms — built for low health-literacy / low-typing-comfort users.
- **Elder-friendly design** — large tap targets (52–60px), bigger base font, high-contrast
  chips and buttons, an "A+ Large text" toggle, and a "🔊 Read result aloud" button using
  speech synthesis so a result doesn't require reading small text.
- **Digital triage** — symptom chips + duration + severity + age group → Low / Medium / High
  risk with a plain-language explanation and a next action (book teleconsult / escalate).
- **Appointment & queue** — book a facility + department + slot, returns a token + live
  estimated wait (mocked).
- **Referral tracker** — a stepper showing the patient's journey Sub-Centre → PHC → Rural
  Hospital → District Hospital, so no record is "lost in transit" (the PS's core ask).
- **Facility map** — Leaflet + OpenStreetMap view of every mocked health centre, colour-coded
  by tier (Sub-Centre / PHC / Rural Hospital / District Hospital), with a popup per marker
  showing name, district, coordinates, and quick links to book a queue slot or check medicine
  stock at that facility. Needs internet the first time it loads (fetches map tiles + the
  Leaflet library from a CDN) — swap in an offline tile cache for a true rural deployment.
- **Medicine & diagnostics availability** — searchable stock status per facility.
- **Facility dashboard** — today's triage count, high-risk follow-ups pending, referral
  completion rate, and a maternal/child/chronic follow-up list staff can mark as contacted.
- **Emergency SOS** — floating button, simulates an alert to the nearest facility + ambulance
  (108) call.

## Known gaps to call out honestly in your demo
- No real backend / database — state resets on refresh (by design, for a fast prototype).
- Voice recognition depends on the browser's Web Speech API (best in Chrome; needs internet
  for the recognition service itself, which is a real constraint worth naming for offline
  rural use — your architecture doc already proposes an offline-first sync layer for this).
- ABDM/FHIR, e-Sanjeevani, and Bhashini integrations are represented as UI hooks only, not
  live integrations.
- The 36-district facility list is mocked with 6 representative entries (with approximate,
  not surveyed, lat/lng) — swap in your real HMIS/NHM dataset with true GPS coordinates in
  `js/data.js` → `FACILITIES` once you have it loaded. The map will pick up any number of
  facilities automatically.

## Editing text or adding a language
Everything user-facing lives in `js/strings.js`, keyed by `en` / `hi` / `mr`. To add a new
language, copy one language block, translate it, and add a button in `index.html`'s `#langsel`.
