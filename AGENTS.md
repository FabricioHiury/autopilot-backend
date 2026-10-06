# Repository Guidelines

## Project Structure & Module Organization

This repository contains the NestJS 10 CRM API; the frontend and integrations microservice are separate projects. `src/main.ts` bootstraps HTTP, validation, CORS, and documentation. Organize business features under `src/core/`, authentication under `src/auth/`, and database/file adapters under `src/persistence/`. Shared helpers, error handling, and Handlebars email templates live in `src/utils/`.

`prisma/schema.prisma` defines database models; `prisma/migrations/` contains versioned SQL. Unit tests sit beside their implementations. `docs/` documents migrations and communication contracts; `scripts/` contains migration verification, and `k8s/` contains deployment manifests.

## Build, Test, and Development Commands

- `npm ci`: install locked dependencies; postinstall generates Prisma and builds the API.
- `npm run dev`: start the local server with compilation/watch mode, normally on port 3003.
- `npm run build`: compile into `dist/`.
- `npm test -- --runInBand`: run Jest tests sequentially.
- `npm run test:cov`: generate coverage in `coverage/`.
- `npm run test:migrations`: verify migrations using isolated embedded PostgreSQL.
- `npm run format`: format TypeScript source with Prettier.

For Colima infrastructure, run `docker-compose --context colima --env-file .env.local -f docker-compose.local.yml up -d`. Follow `docker/local/README.md` for host server configuration. Health is at `/health`; API documentation is at `/api` and `/docs`.

## Coding Style & Naming Conventions

Use TypeScript, two-space indentation, single quotes, and trailing commas. Use PascalCase for classes, camelCase for methods, and descriptive dotted filenames such as `backoffice-store.service.ts` and `login.dto.ts`. Keep modules, controllers, services, DTOs, and API fields in English. Use `Deal` for sales negotiations. Validate request DTOs and preserve the shared response/error conventions. The lint script invokes ESLint with automatic fixes; no ESLint configuration is currently checked in.

## Testing Guidelines

Use Jest and ts-jest with colocated `*.spec.ts` files. Cover authorization, tenant isolation, provider failures, and retry behavior when changing these flows. Run focused tests during development, then the full suite and build before review. No numeric coverage threshold is configured. The e2e script references a currently absent test configuration.

## Commit & Pull Request Guidelines

Recent history uses prefixes such as `feat:`, `refactor:`, and `docs:`. Keep commits focused and summarize the resulting behavior. PRs should describe the problem, implementation, verification commands, related issues, and any schema or environment changes. Update contract documentation when API behavior changes.

## Security & Configuration

Never commit secrets, credential JSON, logs, or generated builds. Use `.env.example` as the configuration reference. Match `MICROSERVICE_TOKEN` across services. Read `docs/MIGRATION.md` before migrating existing databases; inspect the target database before executing migration commands.
