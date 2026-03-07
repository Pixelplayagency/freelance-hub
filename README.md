# FreelanceHub — Task Management Platform

A clean, minimal task management web app for managing freelancers. Built with Next.js 15, Supabase, and Tailwind CSS.

## Features

- **Two roles:** Admin (creates/assigns work) and Freelancer (views/updates tasks)
- **Kanban board** with drag-and-drop across To Do / In Progress / Review / Completed
- **Task references:** image uploads, links, YouTube/Vimeo video embeds, rich concept notes
- **Real-time updates** via Supabase Realtime — move a card and all viewers see it instantly
- **In-app notifications** — task assigned, task updated, due-soon reminders
- **Role-based access** enforced at the database level via PostgreSQL Row Level Security

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Database / Auth / Storage | Supabase |
| UI | Tailwind CSS + shadcn/ui |
| Drag & Drop | @dnd-kit |
| Client state | Zustand (optimistic Kanban) |
| Forms | react-hook-form + Zod |
| Rich text | TipTap |

---

## Setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com) and create a new project.

### 2. Run the SQL migrations

In your Supabase Dashboard, open **SQL Editor** and run these files in order:

```
supabase/migrations/00001_init_schema.sql
supabase/migrations/00002_rls_policies.sql
supabase/migrations/00003_storage_policies.sql
supabase/migrations/00004_functions_triggers.sql
```

### 3. Configure Supabase

**Authentication → Providers:**
- Enable **Email** (with email confirmation for production)
- Enable **Google** (requires Google Cloud Console OAuth2 credentials)
- Set Redirect URL: `https://your-domain.com/auth/callback` (and `http://localhost:3000/auth/callback` for dev)

**Storage:**
- Create a private bucket named `task-attachments`

**Database → Replication (Realtime):**
- Enable Realtime for: `tasks`, `notifications`

**Optional — Due-soon notifications (pg_cron):**
- Enable `pg_cron` extension in Database → Extensions
- Run: `SELECT cron.schedule('notify-due-soon', '0 8 * * *', 'SELECT public.notify_due_soon()');`

### 4. Set environment variables

Copy `.env.example` to `.env.local` and fill in your real values:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Your keys are in Supabase Dashboard → Settings → API.

### 5. Create your admin account

Sign up at `/signup`. Then in Supabase SQL Editor, promote yourself to admin:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your@email.com';
```

### 6. Run the development server

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to login.

---

## Inviting Freelancers

As an admin, go to **Freelancers → Invite**. An email is sent via Supabase Auth. Freelancers sign up through the invite link and are automatically given the `freelancer` role.

---

## Deployment (Vercel)

```bash
npx vercel deploy
```

Add the environment variables in Vercel Dashboard → Settings → Environment Variables.

Update Supabase Auth redirect URLs to your production domain.

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, signup, OAuth callback
│   ├── (dashboard)/
│   │   ├── admin/       # Projects, tasks, freelancers, notifications
│   │   └── freelancer/  # My tasks, notifications
│   └── api/             # Invite endpoint
├── components/
│   ├── kanban/          # KanbanBoard, KanbanColumn, KanbanCard
│   ├── tasks/           # TaskForm, TaskDetail, ImageUpload, VideoEmbed, etc.
│   ├── projects/        # ProjectCard, ProjectForm
│   ├── dashboard/       # AdminOverview, FreelancerOverview, NotificationList
│   └── layout/          # Sidebar, TopBar, MobileNav
├── lib/
│   ├── actions/         # Server Actions (create/update/delete)
│   ├── hooks/           # useNotifications, useTaskRealtime
│   ├── supabase/        # Server + browser client factories
│   ├── types/           # TypeScript types
│   └── validations/     # Zod schemas
supabase/
└── migrations/          # All SQL files — run these in order
```
