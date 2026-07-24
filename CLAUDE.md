# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

This is the frontend for GymTracker, a workout-tracking app. React 19 + TypeScript + Vite, styled with Tailwind CSS v4, using React Router v7, TanStack Query for server state, Zustand for client state, and Supabase for auth.

There is a separate backend (not in this repo) that exposes a REST API under `/api`. In dev, Vite proxies `/api` and `/health` to `http://localhost:4000` (see `vite.config.ts`).

## Commands

- `npm run dev` — start the Vite dev server (port 5173, proxies API calls to `localhost:4000`)
- `npm run build` — type-check (`tsc -b`) then production build
- `npm run lint` — run oxlint
- `npm run preview` — preview the production build

There is no test runner configured in this project.

## Environment

Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (same Supabase project as the backend).

## Architecture

**Auth**: `src/stores/auth.ts` is a Zustand store wrapping Supabase auth (`src/lib/supabase.ts`). `AppLayout` reads `session`/`loading` from this store and redirects to `/login` when unauthenticated; `App.tsx` calls `init()` once on mount to hydrate the session and subscribe to auth state changes.

**API access pattern**: All backend calls go through `src/lib/api.ts`, a thin fetch wrapper (`api.get/post/patch/delete`) that pulls the Supabase access token via `getToken()` and attaches it as a Bearer token on every request. Requests hit relative paths like `/api/routines`, relying on the Vite proxy in dev and same-origin deployment in prod.

**Data fetching**: `src/hooks/useApi.ts` is the single file defining all TanStack Query hooks (`useProfile`, `useDashboard`, `useRoutines`, `useRoutineDetail`, `useStartSession`, `useFinishSession`, `useSessionDetail`, `useSessions`, `useLogSet`, `useUpdateSet`, `useExerciseProgress`, `useBodyMeasurements`, `useUpsertMeasurement`) plus all API response/request TypeScript interfaces (`Profile`, `Routine`, `RoutineDetail`, `WorkoutSession`, `SessionDetail`, etc.). When adding a new API endpoint, add both the hook and its types here rather than creating new files — this is the established convention. Mutations invalidate related query keys on success (e.g. finishing a session invalidates both `sessions` and `dashboard`).

**Active workout session**: `src/stores/session.ts` is a separate Zustand store tracking the *currently in-progress* workout (routine id/name, start time, current exercise index) as lightweight client state, distinct from the server-persisted `WorkoutSession`/`SessionDetail` fetched via TanStack Query. `ActiveSessionPage` coordinates both: local UI state from the store, server data via `useSessionDetail`/`useLogSet`/`useUpdateSet`.

**Routing**: All authenticated routes are nested under a single `AppLayout` route in `App.tsx`, which renders `<Outlet />` plus a persistent `BottomNav`. `/login` is outside that layout. Unknown paths redirect to `/`.

**Styling**: Tailwind v4 with the theme defined via `@theme` in `src/index.css` (custom color tokens: `bg`, `surface`, `surface-alt`, `accent`, `text`, `text-secondary`, `border`, plus semantic colors `blue`/`green`/`red`/`orange`, and radius tokens `radius-sm..xl`). Use these theme tokens (e.g. `bg-surface`, `text-text-secondary`, `rounded-lg`) instead of raw Tailwind palette colors to stay consistent with the app's dark theme. No component library — pages compose Tailwind utility classes directly.

**Icons**: `lucide-react` and a custom `public/icons.svg` sprite are both present.
