# USDA Food Diary

A simple daily food diary for nutrition coaching clients. They log food name + grams,
the app maps each entry against the USDA FoodData Central API, lets them pick the
best match from the top 5, then shows daily totals (calories + macros + fiber).
Includes a daily weight tracker with a 30-day chart.

## Stack

- Next.js 14 (App Router) + TypeScript
- SQLite via libSQL/Turso (`@libsql/client`) — local file in dev, Turso in prod
- Drizzle ORM + drizzle-kit migrations
- Auth.js v5 (credentials provider + bcrypt)
- Tailwind CSS, recharts, lucide-react
- USDA FoodData Central API (server-side; key never exposed to client)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Get a free USDA API key at https://fdc.nal.usda.gov/api-key-signup.html

3. Copy the env template and fill it in:

   ```bash
   cp .env.example .env.local
   ```

   - `USDA_API_KEY` — from step 2
   - `AUTH_SECRET` — generate with `openssl rand -base64 32`
   - `DATABASE_URL` — defaults to `file:./local.db` (good for local dev)

4. Run migrations to create the SQLite database:

   ```bash
   npm run db:migrate
   ```

5. Start the dev server:

   ```bash
   npm run dev
   ```

6. Open http://localhost:3000, click "Create one" to make an account, then start logging.

## Production deploy (Vercel + Turso)

1. Create a Turso DB: `turso db create food-diary` then `turso db show food-diary --url`
2. Get an auth token: `turso db tokens create food-diary`
3. In Vercel, set env vars:
   - `USDA_API_KEY`
   - `AUTH_SECRET`
   - `AUTH_TRUST_HOST=true`
   - `DATABASE_URL` — the `libsql://...` URL
   - `DATABASE_AUTH_TOKEN` — the token
4. Run `npm run db:migrate` once locally pointed at Turso (or use `drizzle-kit push`).
5. Deploy.

## Data model

- `users` — `id`, `email`, `password_hash`, `name`, `created_at`
- `food_entries` — `id`, `user_id`, `date`, `description`, `grams`, `fdc_id`,
  `food_name`, and `kcal/protein/carbs/fat/fiber_per_100g` snapshotted at log time
  so historical totals don't change if USDA updates the entry.
- `weight_entries` — `id`, `user_id`, `date`, `kg` (unique per user per day)

## Notes

- We query USDA with `dataType=Foundation,SR Legacy,Survey (FNDDS)`. Branded foods
  are skipped because they're per-serving rather than per-100g.
- Dates are stored as `YYYY-MM-DD` in the server's local timezone. For multi-region
  clients, switch the diary index page to a client-side redirect using the browser's
  local date.
- For UI/feature testing, log in, search "chicken breast", set grams to 150, and pick
  a match — the totals card should update immediately.
