LIFT Frontend

Prereqs: Node 18+, npm

Setup:
1. Install deps: npm install
2. Create env: create a file `.env` with:

VITE_API_BASE=http://localhost:4000/api

Run:
- npm run dev

Notes:
- Tailwind is configured; if you see CSS issues, ensure PostCSS and Tailwind are installed (devDependencies in package.json) and run the dev server.
LIFT Frontend

Prereqs: Node 18+, npm

Setup:
1. Install deps: npm install
2. Dev server: npm run dev

By default the frontend expects the backend at http://localhost:4000. You can set VITE_API_BASE in an .env file at the frontend root to change it.
