# Flourish HR Panel Developer Guide

This project is the Corporate Admin/HR Portal for the Flourish platform. It allows corporate HR managers to monitor their organization's overall wellness, check stress thermometer statistics, and manage user enrollment programs.

## Commands

* **Start Development Server:** `npm start` (serves on `http://localhost:4200`)
* **Build App Bundle:** `npm run build` (outputs to `dist/`)
* **Run Unit Tests (Karma):** `npm test`
* **Deploy to Firebase Hosting:** `firebase deploy --only hosting`
* **Deploy to GCP App Engine:** `gcloud app deploy` (uses `app.yaml`)

---

## Project Structure

```
flourish_hrpanel/
├── firebase.json          # Firebase Hosting configuration
├── app.yaml               # GCP App Engine config
├── package.json           # Scripts and dependency declarations
├── src/
│   ├── index.html         # Application entry page
│   ├── styles.scss        # Global styles and themes
│   ├── environments/      # Environment endpoints configuration
│   └── app/
│       ├── app.module.ts  # Main application module
│       ├── _helpers/      # Interceptors for JWT auth and errors
│       ├── models/        # Shared models/interfaces
│       ├── services/      # Angular services talking to backend
│       └── pages/         # Page components
│           ├── auth/      # HR auth (Login, password reset)
│           └── dashboard/ # HR metrics panel (stress-thermometer, programs, profile, users)
```

---

## Code Guidelines & Standards

1. **Angular Components:**
   * Build pages inside `src/app/pages/dashboard/`.
   * Standard Angular component modularity: template HTML, style SCSS, and TypeScript controller.

2. **Data & APIs:**
   * All REST communications with the backend must happen through Angular Injectable Services in `src/app/services/`.
   * Maintain clean models mapping organization details, survey records, and users.

3. **GCP vs Firebase:**
   * This project is structured with both `firebase.json` and `app.yaml`, allowing it to run either as a GCP App Engine app or a Firebase Hosting SPA. Check config variables in `src/environments/` depending on deploy targets.
