# API Monitoring MVP

A functional, reliable API monitoring system with real-time alerts and performance tracking.

## Architecture

This is a modular monorepo with clear separation between frontend and backend:

```
api-monitoring/
├── backend/          # Node.js + Express API server
│   ├── src/
│   │   ├── modules/  # Feature modules (auth, monitoring, alerts, etc.)
│   │   ├── shared/   # Shared utilities, middleware
│   │   ├── types/    # Backend-specific types
│   │   └── config/   # Configuration and environment setup
│   └── package.json
└── frontend/         # Next.js + ShadCN UI dashboard
    ├── src/
    │   ├── app/      # App router pages
    │   ├── components/ # Reusable UI components
    │   ├── modules/  # Feature-specific components
    │   ├── types/    # Frontend-specific types
    │   └── lib/      # Utilities and API clients
    └── package.json
```

## Tech Stack

- **Frontend**: Next.js 14 (App Router), ShadCN UI, Tailwind CSS, TypeScript
- **Backend**: Node.js, Express, TypeScript, Zod validation
- **Database**: Supabase (Postgres + Auth)
- **Monitoring**: Node-cron for scheduling
- **Alerts**: Nodemailer for email notifications

## Quick Start

```bash
# Install all dependencies
npm run setup

# Start development servers (backend + frontend)
npm run dev

# Build for production
npm run build

# Start production servers
npm start
```

## Core Features

### ✅ MVP Features

- API endpoint monitoring with customizable checks
- Real-time uptime and latency tracking
- Email alerting with failure detection
- User authentication and multi-tenancy
- Clean dashboard with historical data

### 🚀 Easy Extensions Ready

- Keyword validation in responses
- Multi-step API checks with chaining
- Webhook notifications
- CSV export functionality
- REST API for monitor management

## Modular Design

Each feature is built as a separate module with clear interfaces, making it easy to:

- Add new monitoring types
- Integrate additional alert channels
- Extend the dashboard with new views
- Add new authentication providers
- Scale individual components

## Environment Setup

1. **Configure Backend Environment**:

   ```bash
   cp backend/env.example backend/.env
   # Edit backend/.env with your Supabase and SMTP credentials
   ```

2. **Set up Database**:

   ```bash
   # First, run the bootstrap SQL in Supabase SQL editor:
   # Copy from backend/src/config/database.ts -> bootstrapSQL

   # Then run migrations:
   cd backend
   npm run migrate:up
   ```

3. **Configure Frontend Environment**:
   ```bash
   # frontend/.env.local is auto-created during setup
   ```

## Database Migrations

This system uses a modular migration approach:

```bash
# Run all pending migrations
npm run migrate:up

# Check migration status
npm run migrate:status

# Get help
npm run migrate
```

### Adding New Migrations

Create migration files in each module:

```
backend/src/modules/[module]/migrations/
├── 001_description.sql
├── 002_another_change.sql
└── ...
```

Migrations are automatically discovered and run in chronological order across all modules.
