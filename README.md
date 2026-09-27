# Baaqoon Platform (باقون)

This is a monolithic monorepo containing both the backend (NestJS) and frontend (React/Vite) for the Baaqoon educational platform.

## Deployment Guide

### 1. Backend (Render / Railway)
The backend is located in `packages/backend`.

**Build Command:**
```bash
npm install
npm run build --workspace=packages/backend
npx prisma generate --schema=packages/backend/prisma/schema.prisma
npx prisma migrate deploy --schema=packages/backend/prisma/schema.prisma
```

**Start Command:**
```bash
npm run start:prod --workspace=packages/backend
```

**Required Environment Variables:**
- `DATABASE_URL`: Your PostgreSQL connection string.
- `JWT_SECRET`: A secure random string for JWT signing.
- `FRONTEND_URL`: The URL of your deployed frontend (e.g. `https://baaqoon.vercel.app`) to allow CORS.
- `PORT`: (Render/Railway will inject this automatically, default 4000).

---

### 2. Frontend (Vercel / Netlify)
The frontend is located in `packages/frontend`.

**Build Command:**
```bash
npm install
npm run build --workspace=packages/frontend
```
*Note: If deploying on Vercel, set the Root Directory to `packages/frontend` in the project settings.*

**Required Environment Variables:**
- `VITE_API_URL`: The public URL of your deployed backend (e.g. `https://baaqoon-api.onrender.com/api/v1`).

*Note: A `vercel.json` file is already included in the frontend folder to handle React Router SPA routing.*
