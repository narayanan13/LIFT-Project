LIFT Backend

Prereqs: Node 18+, PostgreSQL, npm

Setup:

1. Copy env: cp .env.example .env and edit DATABASE_URL and JWT_SECRET.
2. Install deps: npm install
3. Generate Prisma client: npx prisma generate
4. Create DB/migrations (optional): npx prisma migrate dev --name init

Seeding an admin user (manual):
- Use a small script or psql to insert a user. Passwords are salted PBKDF2 hashes. You can create a hash using node REPL:

  node -e "const { hashPassword } = require('./src/utils/auth'); console.log(hashPassword(process.argv[1]));" mypassword

  Then insert into users (id, name, email, password_hash, role) with the generated hash.

Run:
- npm run dev

API:
- POST /api/auth/login { email, password }
- Admin routes under /api/admin (protected, require ADMIN JWT)
- Alumni routes under /api/alumni (protected)
