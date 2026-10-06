# Chazarah Tracker – Web

React (Vite + TypeScript) web version of the mobile app, hosted on GitHub Pages at https://chazarahtracker.com

Routes: `/login`, `/signup`, `/chazarah`, `/sessions`, `/obligation`, `/profile`, `/chart` (public), `/reset-password` (target of the Supabase reset email).

## Develop
    cp .env.example .env   # fill in Supabase URL + anon key
    npm install
    npm run dev

## One-time setup
1. **Chart data** – run `supabase/chart_data.sql` in the Supabase SQL editor (creates the public `get_chart_data()` function; exposes initials only).
2. **Password reset** – Supabase → Authentication → URL Configuration: add `https://chazarahtracker.com/reset-password` (and `http://localhost:5173/reset-password` for dev) to *Redirect URLs*.
3. **Deploy** – GitHub repo → Settings → Pages → Source: *GitHub Actions*; custom domain `chazarahtracker.com`. Add repo secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Pushes to `main` touching `WebApp/` deploy via `.github/workflows/deploy-web.yml`.
4. **DNS** – apex `A` records to GitHub Pages (185.199.108.153, .109.153, .110.153, .111.153) or follow GitHub's custom-domain docs.

`dist/404.html` is a copy of `index.html` so deep links like `/chart` work on GitHub Pages.
