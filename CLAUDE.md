# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Aprende y Aplica** is a B2B educational platform for enterprise AI training, built with a monorepo architecture using Next.js for the frontend and Express for the backend, with Supabase as the database.

**Tech Stack:**
- Frontend: Next.js 14.2.15, React 18.3.1, TypeScript 5.9.3, TailwindCSS 3.4.18
- Backend: Express 4.18.2, TypeScript 5.3.3, Node.js 22+
- Database: Supabase (PostgreSQL)
- Authentication: Supabase Auth
- State Management: Zustand 5.0.2
- UI Components: Radix UI, Headless UI, custom components with Framer Motion 12.23.24
- Data Visualization: Nivo charts, Recharts, Tremor
- AI Integration: OpenAI GPT-4o-mini (Chat-Bot-LIA)
- Internationalization: next-i18next, react-i18next (Spanish, English, Portuguese)

## Repository Structure

```
Aprende-y-Aplica/
├── apps/
│   ├── web/              # Frontend (Next.js)
│   │   └── src/
│   │       ├── app/      # Next.js App Router
│   │       ├── features/ # Business domain features
│   │       ├── core/     # Core services & stores
│   │       └── shared/   # Reusable components & utilities
│   └── api/              # Backend (Express)
│       └── src/
│           ├── features/ # Business domain features
│           ├── core/     # Middleware & config
│           └── shared/   # Shared types & constants
├── packages/
│   ├── shared/          # Shared code between frontend & backend
│   └── ui/              # Shared UI components
└── docs/                # Documentation
```

## Commands

```bash
# Development
npm run dev          # Start both frontend (:3000) and backend (:4000) concurrently
npm run dev:web      # Start frontend only
npm run dev:api      # Start backend only

# Building
npm run build        # Build all workspaces
npm run build:web    # Build frontend only
npm run build:api    # Build backend only
npm run build:packages  # Build shared packages

# Code Quality
npm run type-check   # Type check all workspaces
npm run lint         # Lint all workspaces

# Bundle Analysis (Frontend)
npm run analyze --workspace=apps/web           # Analyze all bundles
npm run analyze:server --workspace=apps/web    # Server bundle only
npm run analyze:browser --workspace=apps/web   # Browser bundle only

# Workspace-specific operations
npm install <package> --workspace=apps/web     # Install in web app
npm install <package> --workspace=apps/api     # Install in API
npm run <command> --workspace=apps/web         # Run command in specific workspace

# Clean build (Windows)
npm run clean --workspace=apps/web && npm run build --workspace=apps/web
```

## Architecture

### Screaming Architecture
The codebase follows "Screaming Architecture" principles - organized by business features, not technical layers.

**Feature Structure:**
```
features/[feature-name]/
├── components/     # Feature-specific components
├── hooks/          # Feature-specific hooks
├── services/       # Feature-specific services
├── types.ts        # Feature-specific types
└── index.ts        # Barrel exports
```

**Main Features:**
- `auth/` - Authentication and user registration
- `admin/` - Admin panel for user and community management
- `ai-directory/` - AI applications catalog
- `business-panel/` - Business administration panel
- `communities/` - Community management, posts, and interactions
- `courses/` - Course management and learning content
- `instructor/` - Instructor-specific features and content
- `landing/` - Landing page components
- `news/` - News articles and reading statistics
- `notifications/` - User notification system
- `profile/` - User profile management
- `purchases/` - Purchase history and management
- `reels/` - Short-form video content (Reels)
- `study-planner/` - Study planning and scheduling
- `subscriptions/` - Subscription and payment management

### Dependency Rules
```
features/  → Can import from core/ and shared/
core/      → Can import from shared/
shared/    → Cannot import from anywhere (pure infrastructure)
```

### Frontend Organization (apps/web/src/)

| Directory | Purpose |
|-----------|---------|
| `app/` | Next.js App Router pages (Server Components by default) |
| `features/` | Business domain features (self-contained) |
| `core/` | Cross-cutting logic: stores (Zustand), providers, services/api.ts (Axios), i18n |
| `lib/` | Infrastructure: supabase/, openai/, lia/, schemas/, auth/, rate-limit/ |
| `shared/` | Pure infrastructure: generic hooks (useDebounce), utility functions |

### Backend Organization (apps/api/src/)

**Note:** Backend API routes are currently placeholder endpoints. Most backend logic is handled by Supabase directly via Next.js API routes.

| File Pattern | Purpose |
|--------------|---------|
| `[feature].controller.ts` | HTTP request handlers |
| `[feature].service.ts` | Business logic |
| `[feature].routes.ts` | Route definitions |
| `[feature].types.ts` | DTOs and Zod validation schemas |

## Important Patterns

### Supabase Integration
- Browser: `createClient()` from `lib/supabase/client.ts`
- Server Components: `createServerClient()` from `lib/supabase/server.ts`
- Protected routes: middleware in `lib/supabase/middleware.ts`
- Database types: `lib/supabase/types.ts`

### API Communication
- Frontend uses `core/services/api.ts` (Axios with interceptors and token refresh)
- API base URL: `http://localhost:4000/api/v1`
- **Do NOT use webhooks** - Always use REST API endpoints

### Path Aliases
```typescript
@/*           → apps/web/src/*
@/features/*  → apps/web/src/features/*
@/core/*      → apps/web/src/core/*
@/lib/*       → apps/web/src/lib/*
@/components/*→ apps/web/src/shared/components/*
@/utils/*     → apps/web/src/shared/utils/*
@/hooks/*     → apps/web/src/shared/hooks/*
@shared/*     → packages/shared/src/*
```

## Internationalization (i18n)

Supports **Spanish (default)**, **English**, and **Portuguese** via `next-i18next` + `react-i18next`.

- Translation files: `apps/web/public/locales/{es,en,pt}/common.json`
- Keep keys consistent across all three languages
- `I18nProvider` is mounted in `src/app/layout.tsx`

```typescript
// In components
import { useTranslation } from 'react-i18next';
const { t } = useTranslation('common');

// Language switching
import { useLanguage } from '@/core/i18n/I18nProvider';
const { language, changeLanguage } = useLanguage(); // 'es' | 'en' | 'pt'
```

## Styling & Design System

### Design Tokens
```css
--primary-600: #1F5AF6    /* Primary blue */
--neutral-900: #0A1633    /* Dark background */
--accent-orange: #FF7A45  /* Accent color */
```

### Component Patterns
- Mobile-first responsive design (sm: 640px, md: 768px, lg: 1024px, xl: 1280px)
- Use `cn()` from `shared/utils/cn.ts` for className merging
- Framer Motion for animations
- Radix UI and Headless UI for accessible components
- Light/dark theme via `useTheme` from `@/core/stores/themeStore`

### Data Visualization
- **Nivo** (@nivo/*): Complex, customizable visualizations
- **Recharts**: Simple, performant charts
- **Tremor** (@tremor/react): Business dashboards

## Database Schema (Supabase)

Key tables: `usuarios`, `organizations`, `cursos`, `user_lesson_progress`, `study_plans`, `study_sessions`, `certificates`, `lia_conversations`

Full schema types in `lib/supabase/types.ts`.

## Development Guidelines

### TypeScript
- Strict typing enabled (`strict: true`)
- Avoid `any`, prefer `unknown` if needed
- Define interfaces for all props and data structures

### Component Guidelines
- Use Server Components by default, add `'use client'` only when needed
- Client Components required for: event handlers, browser APIs, React hooks, context consumers
- One component = one responsibility

### Naming Conventions
- Files: kebab-case (`user-profile.tsx`)
- Components: PascalCase (`UserProfile`)
- Variables/functions: camelCase
- Constants: UPPER_SNAKE_CASE

### User Roles
| Role | Description | Routes |
|------|-------------|--------|
| `Admin` | Platform super admin | `/admin/*` |
| `Business` | Organization admin | `/business-panel/*` |
| `BusinessUser` | Organization employee | `/business-user/*` |

## Environment Variables

See [.env.example](.env.example) for all available variables. Key ones:

```bash
# Frontend (.env.local)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Backend (.env)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
USER_JWT_SECRET=
```

## Key Files

- `.cursorrules` - Project standards (ALWAYS follow these)
- `lib/supabase/types.ts` - Database schema types
- `apps/web/src/app/layout.tsx` - Root layout with providers
- `core/services/api.ts` - Axios client with interceptors

## Common Tasks

### Adding a New Feature
1. Create `features/[feature-name]/` with `components/`, `hooks/`, `types.ts`, `index.ts`
2. Export from `index.ts` as barrel export
3. Import via `@/features/[feature-name]`

### Adding a Next.js API Route
1. Create in `apps/web/src/app/api/[route]/route.ts`
2. Use Zod for validation schemas
3. Use Supabase client for database operations

## Testing URLs

- Frontend: http://localhost:3000
- Backend Health: http://localhost:4000/health
- API Base: http://localhost:4000/api/v1

## LIA (AI Assistant)

AI-powered chatbot using OpenAI GPT-4o-mini:
- Config: `lib/lia/`, `lib/openai/`
- Model settings: `CHATBOT_MODEL`, `CHATBOT_MAX_TOKENS`, `CHATBOT_TEMPERATURE`
- Multilingual (ES, EN, PT) with automatic language detection
- Context-aware help (course content, study planner, dashboard)

```typescript
import { useLIAChat } from '@/features/lia/hooks/useLIAChat';
const { sendMessage, messages, isLoading } = useLIAChat({ context: 'course_lesson' });
```

## Critical Rules

- **NO webhooks** - Always use REST API endpoints
- **Responsive design** - Mobile-first for all components
- **Screaming Architecture** - Organize by features, not technical layers
- **Monorepo workspaces** - Use `--workspace=apps/web` for package operations
- **Translations** - Keep es/en/pt files in sync
- **Builds** - Ignore TypeScript/ESLint errors (configured for speed)
