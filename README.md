# IELTS 90-Day Planner

A personal IELTS Academic study planner. It has the full 90-day plan, progress tracking, a score tracker with charts, a mistake journal, resources, and JSON backup/restore.

It is plain HTML, CSS and JavaScript modules, so there is nothing to build. It is hosted on GitHub Pages and syncs to Firebase (Google sign-in + Firestore). If Firebase is not configured, it saves to the browser only.

## Run locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

(Opening `index.html` directly from disk will not work because ES modules need a web server.)

## Set up Firebase (cloud sync)

1. Go to <https://console.firebase.google.com>, create a project, then go to **Project settings → Your apps → Web** and register an app.
2. Copy the `firebaseConfig` values into `src/firebase-config.js`. They are not secrets; your data is protected by the security rules and sign-in.
3. Go to **Build → Authentication → Sign-in method** and enable **Google**.
4. Under **Authentication → Settings → Authorized domains**, add `<your-github-username>.github.io`. `localhost` is already allowed.
5. Go to **Build → Firestore Database**, create a database, and open **Rules**. Paste the contents of `firestore.rules`, then click **Publish**.

Each user's data is stored in `users/{uid}`. If two devices change data, the most recent change wins.

## Publish on GitHub Pages

```sh
git init && git add . && git commit -m "IELTS planner"
git branch -M main
git remote add origin https://github.com/<you>/ielts-planner.git
git push -u origin main
```

Then, in the GitHub repo, go to **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, and select `main` / `(root)`. The site will be at `https://<you>.github.io/ielts-planner/`.

## Files

- `index.html`: app shell
- `src/plan.js`: the 90-day plan (typed data)
- `src/store.js`: local persistence, validation and progress calculations
- `src/sync.js`: Firebase sign-in and Firestore sync
- `src/planner.js`: the views and event handling
- `styles.css`: styles (light and dark)
