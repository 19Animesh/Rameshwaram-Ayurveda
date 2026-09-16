# Local setup checklist

## 1. Do not nest the folder

The zip contains a folder named `Ayurvedic`. Extracting it *into* a folder also
called `Ayurvedic` gives you:

```
C:\Users\dell\Downloads\Ayurvedic\Ayurvedic\   <- the real project root
```

That is what your stack trace showed. It works, but the project root is the
**inner** folder — everything below must happen there. To confirm you are in the
right place, `package.json` and `next.config.mjs` should be directly inside it.

## 2. Create the `.env` file

It must sit next to `package.json`:

```
Ayurvedic\
├── package.json
├── next.config.mjs
├── .env            <- here
└── src\
```

Copy `.env.example` and fill it in. From PowerShell, inside the project root:

```powershell
Copy-Item .env.example .env
notepad .env
```

**Windows will hide a mistake here.** Notepad often saves as `.env.txt`, which
Next.js ignores. Turn on File Explorer → View → File name extensions and check
the name is exactly `.env`. To verify from PowerShell:

```powershell
Get-ChildItem -Force -Filter ".env*" | Select-Object Name
```

You want a line reading `.env` — not `.env.txt`.

## 3. Restart the dev server

Next.js reads env files **only at startup**. After any change to `.env`, stop the
server (Ctrl+C) and run `npm run dev` again. Saving the file is not enough.

## 4. Give the connection string a database name

A URI ending in `/?` has no database name, so Mongoose quietly uses one called
`test`:

```
...mongodb.net/?appName=Rameshwaram-Ayurveda          <- no name
...mongodb.net/rameshwaram?appName=Rameshwaram-Ayurveda   <- explicit
```

If your data currently lives in `test`, leaving it works but is fragile — a
future change to the string will silently point at an empty database. Check
which database holds your `products` collection in Atlas → Browse Collections,
then name it explicitly. The app now logs a warning when the name is missing.

## 5. Variables you still need

Present in your file and correct: `MONGODB_URI`, `JWT_SECRET`, all three
`CLOUDINARY_*`, all three `FIREBASE_*` admin values, all four
`NEXT_PUBLIC_FIREBASE_*`.

Missing:

- **`NEXT_PUBLIC_APP_URL`** — add `NEXT_PUBLIC_APP_URL="http://localhost:3000"`
  locally and your real domain in Vercel. Without it, `sitemap.xml` and Open
  Graph tags emit wrong absolute URLs.
- **`RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`** — expected, since you have not
  set up payments yet. Checkout now returns a clear "payment not available"
  message rather than a generic error.

Not needed:

- **`DATABASE_URL`** (Neon Postgres) — a leftover from an earlier Prisma setup.
  No file in the project reads it. Delete the line, and delete the Neon database
  if nothing else uses it; an unused database with a live password is only a
  liability.
- **`SMTP_EMAIL` / `SMTP_PASSWORD` / `SMTP_FROM_NAME`** — no code sends email
  yet. Harmless to keep, but they do nothing until you implement the mailer in
  `FUTURE_FEATURES.js` §6, which also needs `SMTP_HOST` and `SMTP_PORT`.

## 6. Never commit `.env`

`.gitignore` already covers it. Confirm nothing slipped in earlier:

```powershell
git log --all --full-history -- .env
```

Any output means the file is in your git history and the secrets in it must be
rotated even after deleting the file — history keeps the old copy.
