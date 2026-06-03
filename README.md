<<<<<<< HEAD
# SmartAttend - Enterprise Attendance Management System

A production-ready, enterprise-grade web-based Attendance Management System inspired by Microsoft Forms, built with React, Supabase, and Clerk.

## Features

- **Authenticated Attendance Submission**: Forms-inspired UI for quick and secure attendance marking.
- **Enterprise Security**:
  - Clerk Authentication with Supabase JWT integration.
  - Role-Based Access Control (RBAC): Super Admin, Department Supervisor, User.
  - Row Level Security (RLS) on all database tables.
  - Device fingerprinting and Wi-Fi network validation.
- **Real-time Analytics**:
  - Live dashboard metrics using Supabase Realtime.
  - Department-wise performance tracking.
  - Attendance trends and heatmaps (via SQL views).
- **Advanced Export**:
  - CSV and PDF reports generated via Supabase Edge Functions.
  - Automated audit logging for every submission and export.
- **Modern Tech Stack**:
  - Frontend: React 18, Vite, TypeScript, Tailwind CSS, Shadcn/UI.
  - Backend: Supabase (PostgreSQL, Edge Functions, Realtime, RLS).
  - Auth: Clerk.

## Setup Instructions

### Prerequisites

- Node.js (v18+)
- Supabase Project
- Clerk Project

### Environment Variables

Create a `.env.local` file in the root directory:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_pub_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Setup

1. Run the SQL provided in `supabase_schema.sql` in your Supabase SQL Editor.
2. Enable JWT integration in Supabase using your Clerk JWT template secret.

### Edge Functions Deployment

```bash
supabase functions deploy submit-attendance
supabase functions deploy generate-report
```

### Running Locally

```bash
npm install
npm run dev
```

## Production Deployment

### 1. Clerk Production Keys
The warning about "development keys" appears because you are currently using a `pk_test_...` key. To move to production:
1. Go to your **Clerk Dashboard**.
2. Select your application and go to **Configure > API Keys**.
3. Toggle the switch to **Production**.
4. Copy the production `Publishable Key` (`pk_live_...`) and `Secret Key`.
5. Update your environment variables in your hosting provider (Vercel, Netlify, etc.).

### 2. Supabase Production Setup
1. Ensure all RLS policies are active and tested.
2. Update the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to your production project values.
3. Secure your Edge Functions by setting up secrets:
   ```bash
   supabase secrets set CLERK_SECRET_KEY=sk_live_...
   ```

### 3. Environment Variables Strategy
Use a `.env.production` file for production-specific keys:
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

## Architecture

- **Frontend**: Single Page Application (SPA) with protected routes.
- **Backend Logic**: Heavy lifting (validation, processing) is offloaded to Supabase Edge Functions for security and performance.
- **Database**: PostgreSQL with strict RLS policies to ensure data isolation between departments.
- **Logging**: Every action is recorded in the `audit_logs` table via database triggers.
=======
# Smart-Attendance
>>>>>>> 35589d71b57ab6959ccd038a2cc6d44549f35690
