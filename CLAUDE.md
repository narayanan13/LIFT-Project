# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LIFT is a full-stack alumni contribution management application with separate backend and frontend codebases in a monorepo structure.

- **Backend**: Express.js + Prisma ORM + PostgreSQL
- **Frontend**: Vite + React + TailwindCSS + React Router

## Development Commands

### Backend (from `/backend`)

```bash
# Install dependencies
npm install

# Generate Prisma client after schema changes
npx prisma generate

# Create and apply database migrations
npx prisma migrate dev --name <migration_name>

# Run development server (auto-restarts on changes)
npm run dev

# Run production server
npm start

# Access Prisma Studio (database GUI)
npx prisma studio
```

### Frontend (from `/frontend`)

```bash
# Install dependencies
npm install

# Run development server (with --host flag to expose externally)
npm run dev

# Build for production
npm build

# Preview production build
npm preview
```

## Environment Setup

### Backend `.env` (required)
Copy `backend/.env.example` and configure:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Strong secret for JWT signing
- `PORT`: Backend port (default: 4000)

### Frontend `.env` (optional)
Create `frontend/.env`:
- `VITE_API_BASE`: Backend API URL (default: http://localhost:4000/api)

## Architecture

### Authentication & Authorization

- **Password hashing**: PBKDF2 with salt (100,000 iterations, SHA-512)
  - Hash format: `iterations$salt$derivedKey`
  - See `backend/src/utils/auth.js`
- **JWT tokens**: Signed using `JWT_SECRET`, payload includes `{ id, role, email, name }`
  - See `backend/src/utils/jwt.js`
- **Middleware chain**:
  - `authRequired` validates JWT and loads user from database
  - `requireRole(role)` enforces role-based access (ADMIN or ALUMNI)
  - See `backend/src/middleware/authMiddleware.js`

### Database Schema (Prisma)

Core models in `backend/prisma/schema.prisma`:
- **User**: Authentication + role (ADMIN/ALUMNI)
- **Contribution**: Alumni financial contributions
- **Expense**: Administrative expenses with category/purpose/event fields
- **Announcement**: Admin broadcasts to alumni

All models use `@default(cuid())` for IDs and track `createdAt` timestamps.

### API Routes

Routes are defined in `backend/src/index.js`:
- `/api/auth/*` - Login endpoint (public)
- `/api/admin/*` - Admin-only routes (requires ADMIN role)
- `/api/alumni/*` - Alumni routes (requires ALUMNI role)
- `/api/health` - Health check endpoint

Route handlers in `backend/src/routes/`:
- `auth.js`: Login with email/password
- `admin.js`: User management, contributions, expenses, announcements, reports
- `alumni.js`: View own contributions, announcements, limited reports

### Frontend Routing & Auth

React Router structure in `frontend/src/App.jsx`:
- `/` - Landing page (public)
- `/login` - Login page (public)
- `/admin/*` - Admin dashboard (protected, ADMIN role)
- `/alumni/*` - Alumni dashboard (protected, ALUMNI role)

Authentication state:
- User info + token stored in `localStorage` after login
- `Protected` component checks role and redirects to `/login` if unauthorized
- `useAuth` hook retrieves user from localStorage

### Admin Dashboard Pages

Located in `frontend/src/pages/admin/`:
- `Overview.jsx`: Dashboard summary with stats/charts
- `Users.jsx`: Manage alumni users (create, edit, deactivate)
- `Contributions.jsx`: View/manage all contributions
- `Expenses.jsx`: Add/view expenses with purpose, category, event fields
- `Announcements.jsx`: Create announcements for alumni
- `Reports.jsx`: Generate financial reports

### Alumni Dashboard Pages

Located in `frontend/src/pages/alumni/`:
- `AlumniDashboard.jsx`: Personal contribution summary
- `AlumniContributions.jsx`: View own contribution history

## Manual Admin User Creation

Since there's no signup endpoint, create the first admin manually:

```bash
# Generate password hash
node -e "const { hashPassword } = require('./src/utils/auth'); console.log(hashPassword(process.argv[1]));" yourpassword

# Insert into database via psql or Prisma Studio
# INSERT INTO "User" (id, name, email, password_hash, role, active)
# VALUES ('cuid_here', 'Admin Name', 'admin@example.com', 'hash_here', 'ADMIN', true);
```

## Code Patterns

### Error Handling
- Backend uses Joi for request validation
- Returns JSON errors with appropriate HTTP status codes (400/401/403/500)
- Frontend displays errors via toast notifications

### State Management
- No global state library (Redux/Zustand)
- Local component state with React hooks
- API calls use axios with JWT bearer token from localStorage

### Styling
- TailwindCSS utility classes throughout
- No component library (custom components in `frontend/src/components/`)
- Responsive design with Tailwind breakpoints
