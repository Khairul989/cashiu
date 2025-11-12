# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is an **AdonisJS 6.17.2** full-stack cashback application with:
- **Backend**: AdonisJS (Node.js/TypeScript) with Lucid ORM, MySQL, Redis
- **Frontend**: Vue 3 with Inertia.js for server-side rendering
- **Authentication**: OAuth2 (Google, Apple, Firebase), basic auth, API key auth
- **Background Jobs**: Bull Queue for async processing (conversions, notifications)
- **Database**: MySQL with auditing, soft deletes, and role-based permissions
- **Search**: Elasticsearch for product indexing
- **APIs Integrated**: Shopee GraphQL, Involve.Asia (affiliate conversion tracking), Firebase

## Project Structure

```
src/
├── app/
│   ├── controllers/       # Request handlers (API & Inertia)
│   ├── models/            # Lucid ORM models
│   ├── services/          # Business logic (Shopee, Elasticsearch, conversions)
│   ├── validators/        # Vine validation schemas
│   ├── middleware/        # Auth, ACL, custom middlewares
│   ├── jobs/              # Bull Queue jobs
│   ├── notifications/     # Database & mail notifications
│   ├── exceptions/        # Custom exception handlers
│   ├── helpers/           # Utility functions
│   └── types/             # TypeScript type definitions
├── inertia/               # Vue 3 frontend (pages, components, layouts)
├── database/
│   ├── migrations/        # Schema migrations
│   └── seeders/           # Database seeds
├── start/
│   ├── routes/            # API, web, auth routes (split by concern)
│   ├── kernel.ts          # Middleware stack configuration
│   └── events.ts          # Event listeners
├── commands/              # Ace commands for admin tasks
├── config/                # Config files (database, auth, queue, etc.)
├── tests/                 # Functional & unit tests
└── docker-compose.yml     # Docker setup
```

## Development Commands

```bash
# Setup
npm install

# Development
npm run dev              # Start dev server with HMR
npm run lint            # Run ESLint
npm run format          # Format code with Prettier
npm run typecheck       # Check TypeScript

# Database
node ace migration:run --seed    # Run migrations + seeds
node ace migration:rollback      # Rollback migrations

# Jobs/Queue
node ace queue:listen --queue=process_raw_conversion    # Start job worker

# Building & Deployment
npm run build           # Build production bundle
npm start               # Start production server

# Testing
npm test                # Run all tests
npm test tests/functional/*.spec.ts    # Run specific test file

# Docker
npm run docker:dev              # Start all containers
npm run docker:dev:rebuild      # Rebuild containers
npm run docker:logs             # View app logs
npm run docker:idx:products     # Index products to Elasticsearch

# Commands
node ace index:products         # Index products to Elasticsearch
node ace sync:shopee:products   # Sync Shopee products
node ace sync:shopee:categories # Sync Shopee categories
node ace docs:generate          # Generate Swagger docs
```

## Key Architecture Patterns

### Controllers & Routes

Controllers are split across three main route files for clarity:

- **`start/routes/api.ts`**: RESTful API endpoints (with auth, ACL checks)
- **`start/routes/web.ts`**: Web endpoints (Inertia page rendering)
- **`start/routes/auth.ts`**: OAuth2 and authentication flows

Controllers extend functionality through action methods. Example pattern:
```typescript
async index({ request, inertia }: HttpContext) {
  const data = await Model.query().paginate(...)
  return inertia.render('PageName', { data })
}
```

### Models & Database

- All models extend `BaseModel` from Lucid ORM
- Use **composable mixins**: `Auditable`, `Notifiable`, `hasPermissions()`
- Relationships use decorators: `@hasMany()`, `@hasOne()`, `@belongsTo()`
- Soft deletes enabled via `adonis-lucid-soft-deletes`
- Migrations use fluent schema builder

### Authentication & Authorization

- **Auth Drivers**: OAuth2 (social), API Key, Basic Auth
- **Authorization**: Role-based permissions (via `@holoyan/adonisjs-permissions`)
- **Middleware**: `auth`, `basicAuth`, `isAdmin`, `acl`, `silentAuth`
- Policies in `app/policies/` for resource authorization

### Services

Business logic separated into services in `app/services/`:

- **`ShopeeGraphQL`**: Shopee API integration (product sync)
- **`ElasticsearchService`**: Product search indexing
- **Conversion Services**: Reward processing, affiliate tracking
- **Authentication Services**: OAuth token exchange, JWT validation

### Validators

Use **Vine validation** (not hardcoded in controllers):

```typescript
import vine from '@vinejs/vine'

export const updateValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
    name: vine.string().minLength(2)
  })
)

// In controller
const data = await request.validate({ schema: updateValidator })
```

### Jobs & Queue

Background jobs use **Bull Queue** (`@acidiney/bull-queue`):

- Jobs in `app/jobs/` with `.handle()` method
- Common jobs: `ProcessRawConversionJob`, `PostbackConversionJob`
- Queue listener: `node ace queue:listen --queue=process_raw_conversion`
- Redis backing store for persistence

### Frontend (Inertia + Vue 3)

- Pages in `inertia/pages/` (auto-routed to controller responses)
- Shared components in `inertia/components/`
- Layouts in `inertia/layouts/`
- Tailwind CSS + HeadlessUI for styling
- Vue 3 Composition API preferred

## Database & Caching

- **MySQL**: Primary data store
- **Redis**: Sessions, rate limiting, job queue, caching
- **Elasticsearch**: Product search (new feature in progress)
- Soft deletes via `deleted_models` table for audit trails

## Environment Configuration

Key `.env` variables (see `.env.example`):

```
NODE_ENV=development
PORT=3333
REDIS_HOST=redis      # For sessions, jobs
DB_HOST=mysql         # MySQL
SWAGGER=false         # API docs
API_KEY_AUTH_ENABLED=true

# OAuth
GOOGLE_CLIENT_ID=...
APPLE_CLIENT_ID=...
FIREBASE_PROJECT_ID=...

# External APIs
SHOPEE_MY_GRAPHQL_APP_ID=...
IA_API_KEY=...        # Involve.Asia affiliate tracking
IA_EXTERNAL_API_URL=https://api.involve.page/api

# AWS S3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

## Testing

- **Framework**: Japa with AdonisJS plugin
- **Structure**: `tests/unit/` and `tests/functional/`
- **Setup**: `tests/bootstrap.ts` initializes test environment
- API testing with `@japa/api-client`

Run tests:
```bash
npm test                                    # All tests
npm test tests/functional/auth.spec.ts     # Specific suite
```

## Important Patterns & Conventions

### Import Aliases

Configured in `package.json` for clean imports:

```typescript
#models/*          // app/models/
#controllers/*     // app/controllers/
#services/*        // app/services/
#middleware/*      // app/middleware/
#validators/*      // app/validators/
#start/*           // start/
#config/*          // config/
```

### Error Handling

- Custom exceptions in `app/exceptions/handler.ts`
- HTTP error responses standardized
- Sentry integration for production monitoring

### Soft Deletes & Auditing

- Models can use soft deletes (paranoid mode)
- Audit log tracked via `@stouder-io/adonis-auditing`
- Useful for compliance and data recovery

### Rate Limiting

- Redis-backed limiter via `@adonisjs/limiter`
- Applied to API endpoints for abuse prevention

## Common Development Tasks

### Adding a New API Endpoint

1. Create validator in `app/validators/`
2. Add route in `start/routes/api.ts`
3. Create controller method with proper response formatting
4. Add tests in `tests/functional/`

### Adding a Background Job

1. Create job class in `app/jobs/` with `.handle()` method
2. Dispatch from controller: `await YourJob.dispatch(data)`
3. Start queue listener: `node ace queue:listen`

### Creating a Database Migration

```bash
node ace make:migration create_new_table
# Edit migration file, then:
node ace migration:run
```

### Working with Inertia Pages

1. Create `.vue` file in `inertia/pages/`
2. Controller returns: `inertia.render('PageName', { data })`
3. Props automatically injected into Vue component

## Debugging

VS Code debugger config provided in README. Set breakpoints and:

```bash
npm run dev    # Run with debugger attached
```

Use `node ace repl` for interactive debugging/testing.

## Current Development Focus

- **Elasticsearch Integration** (`feature/recommended-product-with-elastic-search`)
- Product indexing and search optimization
- New command: `node ace index:products`
- Service: `app/services/elasticsearch_service.ts`

## Notes

- API documentation available at `/docs` (set `SWAGGER=true`)
- Webhook testing uses Feistel cipher for parameter encoding
- Conversion tracking: 2-day tracking window, 14-day payment window (configurable)
- Multi-tenant support via seller/shop relationships
