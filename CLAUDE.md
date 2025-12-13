# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Aprende y Aplica** is a full-stack educational platform built with a monorepo architecture using Next.js for the frontend and Express for the backend, with Supabase as the database.

**Tech Stack:**
- Frontend: Next.js 15.5.4, React 19.1.0, TypeScript 5.9.3, TailwindCSS 3.4.18
- Backend: Express 4.18.2, TypeScript 5.3.3, Node.js 18+
- Database: Supabase (PostgreSQL)
- Authentication: Supabase Auth
- State Management: Zustand 5.0.2
- UI Components: Radix UI, Headless UI, custom components with Framer Motion
- Data Visualization: Nivo charts, Recharts, Tremor
- AI Integration: OpenAI GPT-4o-mini (Chat-Bot-LIA)
- Internationalization: next-i18next, react-i18next (Spanish, English, Portuguese)
- Additional Libraries: FullCalendar, React Grid Layout, React Window, Session Recording (rrweb)

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

### Development
```bash
# Start both frontend and backend concurrently
npm run dev

# Start frontend only (runs on :3000)
npm run dev:web

# Start backend only (runs on :4000)
npm run dev:api
```

### Building
```bash
# Build all workspaces
npm run build

# Build specific workspace
npm run build:web
npm run build:api
npm run build:packages
```

### Type Checking
```bash
# Type check all workspaces
npm run type-check
```

### Linting
```bash
# Lint all workspaces
npm run lint
```

### Bundle Analysis (Frontend)
```bash
# Analyze both client and server bundles
npm run analyze --workspace=apps/web

# Analyze server bundle only
npm run analyze:server --workspace=apps/web

# Analyze browser bundle only
npm run analyze:browser --workspace=apps/web
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

### Frontend Organization

**app/** - Next.js App Router (Server Components by default)
- Use `'use client'` directive for Client Components
- Server Components for SEO and initial data fetching

**features/** - Business domain features
- Each feature is self-contained
- Follow the feature structure pattern above

**core/** - Cross-cutting business logic
- `components/` - Core reusable components (layout, navigation, etc.)
- `hooks/` - Core custom hooks
- `i18n/` - Internationalization configuration (i18next setup)
- `lib/` - Core libraries and utilities
- `middleware/` - Request middleware
- `providers/` - Context providers (theme, auth, i18n, etc.)
- `services/api.ts` - Configured Axios client with interceptors
- `stores/` - Zustand state management (authStore, themeStore, shoppingCartStore)
- `types/` - Shared TypeScript types
- `utils/` - Core utility functions

**lib/** - Infrastructure libraries and utilities
- `ai-moderation.ts` - AI content moderation
- `analytics/` - Analytics integration
- `auth/` - Authentication utilities
- `cache/` - Caching mechanisms
- `lia/` - LIA chatbot integration (OpenAI)
- `logger/` - Logging utilities
- `openai/` - OpenAI client configuration
- `rate-limit/` - Rate limiting utilities
- `rrweb/` - Session recording utilities
- `sanitize/` - Input sanitization
- `schemas/` - Zod validation schemas
- `supabase/` - Supabase client and types
- `upload/` - File upload utilities
- `validation/` - Input validation

**shared/** - Infrastructure components (no business logic)
- `hooks/` - Generic hooks (useDebounce, useParallax, etc.)
- `utils/` - Pure utility functions

### Backend Organization (API)

**Note:** Backend API routes are currently placeholder endpoints (returning "Coming soon" messages). The API structure is prepared for future implementation.

**features/** - Business domain features (to be implemented)
- `[feature].controller.ts` - HTTP request handlers
- `[feature].service.ts` - Business logic
- `[feature].routes.ts` - Route definitions
- `[feature].types.ts` - DTOs and Zod validation schemas

**Current structure:**
- `config/` - Environment configuration
- `middlewares/` - Error handling middleware
- `shared/` - Shared types and constants
- `index.ts` - Express server entry point with placeholder routes

## Important Patterns

### Supabase Integration
- Use `createClient()` from `lib/supabase/client.ts` for browser
- Use `createServerClient()` from `lib/supabase/server.ts` for Server Components
- All database operations go through Supabase client

### API Communication
- Frontend uses `core/services/api.ts` for HTTP requests
- API base URL: `http://localhost:4000/api/v1`
- **Do NOT use webhooks** - Always use REST API endpoints

### Authentication Flow
1. Supabase Auth handles authentication
2. Tokens stored in localStorage (frontend)
3. Protected routes use middleware in `lib/supabase/middleware.ts`
4. Server-side auth check in `lib/supabase/server.ts`

### Path Aliases
```typescript
@/features/*  → apps/web/src/features/*
@/core/*      → apps/web/src/core/*
@/app/*       → apps/web/src/app/*
@/lib/*       → apps/web/src/lib/*
@/utils/*     → apps/web/src/shared/utils/*
@/hooks/*     → apps/web/src/shared/hooks/*
@/components/*→ apps/web/src/shared/components/*
@shared/*     → packages/shared/src/*
@ui/*         → packages/ui/src/*
```

Note: Both `@/features/*` and `@features/*` work for importing features.

## Internationalization (i18n)

The frontend integrates `next-i18next` + `react-i18next` to support **Spanish (default)**, **English**, and **Portuguese**.

### Translation Files
- Located in `apps/web/public/locales/{es,en,pt}/common.json`
- Keep the same keys across all three languages for consistency

### Usage in Components
```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation('common');
  return <h1>{t('welcome.title')}</h1>;
}
```

### Language Switching
```typescript
import { useLanguage } from '@/core/i18n/I18nProvider';

function LanguageSelector() {
  const { language, changeLanguage } = useLanguage();
  // language: 'es' | 'en' | 'pt'
  // changeLanguage(newLang)
}
```

### Important Notes
- The `I18nProvider` is already mounted in `src/app/layout.tsx`
- After changing translation files, restart dev server or clear cache
- User menu includes a language selector example

## Styling & Design System

### TailwindCSS Configuration
- Mobile-first responsive design
- Custom color tokens in `tailwind.config.js`
- CSS variables in `globals.css` for theming

### Design Tokens
```css
--primary-600: #1F5AF6
--neutral-900: #0A1633
--accent-orange: #FF7A45
--radius-base: 0.75rem
--shadow-base: 0 2px 8px rgba(10, 22, 51, 0.08)
```

### Responsive Breakpoints
```
sm:  640px   (Mobile landscape)
md:  768px   (Tablet)
lg:  1024px  (Desktop)
xl:  1280px  (Large desktop)
```

### Component Patterns
- Use `cn()` utility from `shared/utils/cn.ts` for className merging
- Framer Motion for animations (12.23.24)
- Radix UI and Headless UI for accessible components

## Data Visualization & Charts

The platform uses multiple charting libraries for different use cases:

### Nivo Charts (@nivo/*)
Comprehensive suite of data visualization components:
- `@nivo/bar` - Bar charts
- `@nivo/line` - Line charts
- `@nivo/pie` - Pie and donut charts
- `@nivo/calendar` - Calendar heatmaps
- `@nivo/heatmap` - Heatmaps
- `@nivo/radar` - Radar charts
- `@nivo/sankey` - Sankey diagrams
- `@nivo/sunburst` - Sunburst charts
- `@nivo/treemap` - Treemap visualizations
- Plus many more specialized chart types

### Recharts
Alternative charting library for simpler visualizations and better performance in some cases.

### Tremor (@tremor/react)
Business dashboard components and charts with built-in styling and responsive design.

### When to Use Each
- **Nivo**: Complex, customizable visualizations with rich interactions
- **Recharts**: Simple, performant charts with straightforward API
- **Tremor**: Business metrics dashboards with consistent design

## Database Schema (Supabase)

Key tables:
- `usuarios` - User profiles and data
- `comunidades` - Community information
- `comunidad_posts` - Community posts
- `ai_aplicaciones` - AI applications directory
- `noticias` - News articles
- `cursos` - Course catalog

Always check `lib/supabase/types.ts` for the full database schema types.

## Development Guidelines

### TypeScript
- Always use strict typing
- Avoid `any`, prefer `unknown` if needed
- Define interfaces for all props and data structures
- Strict mode enabled: `strict: true`

### Component Creation
- One component = one responsibility
- Props should have TypeScript interfaces
- Use Server Components by default, add `'use client'` only when needed
- Client Components required for:
  - Event handlers (onClick, onChange, etc.)
  - Browser APIs (localStorage, window, etc.)
  - React hooks (useState, useEffect, etc.)
  - Context consumers

### File Organization
- Use kebab-case for file names (`user-profile.tsx`)
- Use PascalCase for component names (`UserProfile`)
- Use camelCase for variables and functions
- Use UPPER_SNAKE_CASE for constants

### Error Handling
- Always handle loading and error states
- Use try-catch for async operations
- Display user-friendly error messages
- Backend errors handled by `errorHandler` middleware

## Security Considerations

- Next.js config includes comprehensive security headers (CSP, X-Frame-Options, etc.)
- Helmet middleware in Express for backend security
- CORS configured with specific allowed origins
- Rate limiting on API endpoints (1000 requests per 15 minutes)
- Input sanitization and validation with Zod

## Environment Variables

**Frontend (.env.local):**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

**Backend (.env):**
```
# Server Configuration
PORT=4000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000
API_VERSION=v1

# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=

# JWT & Auth
USER_JWT_SECRET=
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=
REFRESH_TOKEN_EXPIRES_IN=30d
SESSION_SECRET=

# OpenAI (for Chat-Bot-LIA)
OPENAI_API_KEY=
CHATBOT_MODEL=gpt-4o-mini
CHATBOT_MAX_TOKENS=700
CHATBOT_TEMPERATURE=0.6
```

See [.env.example](.env.example) for all available environment variables.

## Key Files to Reference

- `.cursorrules` - Project standards and conventions (ALWAYS follow these)
- `next.config.ts` - Next.js configuration with security headers
- `lib/supabase/types.ts` - Database schema types
- `apps/web/src/app/layout.tsx` - Root layout with providers
- `apps/api/src/index.ts` - Express server entry point

## Common Tasks

### Adding a New Feature
1. Create folder in `features/[feature-name]`
2. Add `components/`, `hooks/`, `types.ts`, `index.ts`
3. Export from `index.ts` as barrel export
4. Import using path alias: `@/features/[feature-name]`

### Creating an API Endpoint
1. Create feature folder in `apps/api/src/features/`
2. Add controller, service, routes, types files
3. Register routes in `apps/api/src/index.ts`
4. Use Zod for validation schemas

### Adding a Reusable Component
1. Create in `apps/web/src/shared/components/`
2. Use TypeScript for props interface
3. Apply responsive design (mobile-first)
4. Export from `shared/components/index.ts`

## Testing URLs

- Frontend: http://localhost:3000
- Backend Health Check: http://localhost:4000/health
- API Base: http://localhost:4000/api/v1

## Monorepo Workspace Commands

When working with specific packages, use workspace flags:
```bash
# Install dependency in web app
npm install <package> --workspace=apps/web

# Install dependency in API
npm install <package> --workspace=apps/api

# Run command in specific workspace
npm run <command> --workspace=apps/web
```

## Additional Key Libraries

### FullCalendar (@fullcalendar/*)
Used for scheduling and calendar functionality in study planner and workshop features:
- `@fullcalendar/react` - React wrapper
- `@fullcalendar/daygrid` - Month/week grid views
- `@fullcalendar/timegrid` - Time-based grid views
- `@fullcalendar/interaction` - Drag, drop, and click interactions

### React Grid Layout
Drag-and-drop grid layout system for customizable dashboards and layouts.

### React Window
Virtualized list and grid rendering for performance with large datasets.

### React Hook Form + Zod
Form handling with validation:
- `react-hook-form` - Performant form state management
- `@hookform/resolvers` - Validation resolvers
- `zod` - Schema validation (shared between frontend and backend)

### Session Recording (rrweb)
User session recording for analytics and debugging:
- `rrweb` - Session recorder
- `rrweb-player` - Session playback
- Located in `lib/rrweb/`

## Chat-Bot-LIA (AI Assistant)

The platform includes **LIA**, an AI-powered chatbot using OpenAI's GPT-4o-mini model.

### Configuration
Located in `lib/lia-config.ts` and `lib/openai/`:
- Model: `gpt-4o-mini` (configurable via `CHATBOT_MODEL`)
- Max tokens: 700 (configurable via `CHATBOT_MAX_TOKENS`)
- Temperature: 0.6 (configurable via `CHATBOT_TEMPERATURE`)

### Key Files
- `lib/lia/` - LIA chatbot integration logic
- `lib/openai/` - OpenAI client configuration
- `lib/ai-moderation.ts` - Content moderation using AI

### Usage
The chatbot is integrated throughout the platform for:
- User assistance and guidance
- Content recommendations
- Interactive learning support

## Important Notes

- **NO webhooks** - Use REST API for all backend communication
- Always implement responsive design for all components
- Follow the Screaming Architecture pattern strictly
- Maintain separation between frontend and backend
- Use monorepo workspaces correctly (`--workspace=apps/web`)
- All builds ignore TypeScript and ESLint errors (configured for speed)
- The backend API currently has placeholder endpoints; most backend logic is handled by Supabase directly
- Use Axios interceptors in `core/services/api.ts` for API calls with automatic token refresh
- Translations must be kept in sync across all three language files (es, en, pt)
- Session recording (rrweb) is available for user behavior analytics
