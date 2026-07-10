# Developer Setup Guide

## Prerequisites

- Node.js 22+
- npm 10+
- A Supabase account (free tier)
- (Optional) OpenAI API key for AI features
- (Optional) Stripe account for billing features

## Getting Started

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd BudgetOS
   ```

2. Install dependencies:
   ```bash
   npm ci
   ```

3. Set up environment variables:
   ```bash
   cp apps/web/.env.example apps/web/.env
   ```
   Edit `apps/web/.env` with your Supabase credentials.

4. Start the development server:
   ```bash
   npm run dev
   ```

The app will be available at http://localhost:5173.

## Project Structure

- `apps/web/` — React single-page application
- `packages/database/` — Shared database types and queries
- `packages/engine/` — Shared business logic engine

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | TypeScript type-check |

## Key Technologies

- **React 18** — UI framework
- **TypeScript** — Type safety
- **Vite** — Build tool
- **Tailwind CSS** — Styling
- **Supabase** — Backend (auth, database, realtime)
- **Zustand** — State management
- **React Query** — Server state management
- **Zod** — Schema validation
- **Recharts** — Charts
- **Stripe** — Payment processing

## Environment Variables

See `.env.example` for all required environment variables.

## Testing

Run tests with:
```bash
npm run test
```

Tests use Vitest with jsdom environment. Test files follow the pattern `*.test.ts` or `*.test.tsx`.

## Architecture

The application follows a layered architecture:

1. **Pages** — Route-level components
2. **Features** — Feature-specific components and logic
3. **Engine** — Pure business logic functions
4. **Services** — API calls and external integrations
5. **Stores** — Zustand state management
6. **Hooks** — React Query data fetching hooks
7. **Components** — Shared UI components

## Building for Production

```bash
npm run build
```

Output is in `apps/web/dist/`. The build includes:
- TypeScript type checking
- Vite production bundle
- PWA service worker
- Code splitting
