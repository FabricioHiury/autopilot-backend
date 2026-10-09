# AutoPilot — CRM Backend

AutoPilot is a CRM for vehicle retailers and dealerships. It brings together contacts, sales deals, conversations across multiple channels, tasks, visits, and team activity. AutoPilot AI assists salespeople with analysis and suggestions that require human review.

This repository contains the main API: authentication, CRM business rules, store isolation, permissions, platform administration, and business data persistence.

## Architecture

| Project                                                                           | Responsibility                                         | Local port |
| --------------------------------------------------------------------------------- | ------------------------------------------------------ | ---------- |
| [autopilot-frontend](https://github.com/FabricioHiury/autopilot-frontend)         | Store interface and platform backoffice, in Portuguese | 3001       |
| [autopilot-backend](https://github.com/FabricioHiury/autopilot-backend)           | CRM API, authentication, events, and AI copilot        | 3003       |
| [autopilot-microservice](https://github.com/FabricioHiury/autopilot-microservice) | WhatsApp, Instagram, Facebook, and OLX integrations    | 3005       |

The browser connects to the backend. The backend calls the microservice for channel operations; the microservice receives provider callbacks and delivers events to the CRM. The backend queries the AI provider separately. Each API has its own PostgreSQL database.

Stack: NestJS 10, TypeScript, Prisma 6.19.3, PostgreSQL, Redis, and Socket.io. `Deal` is the codebase term for a sales interaction or negotiation.

## Current features

- Purchase, sale, and consignment deals, pipelines, stages, lead temperature, loss reasons, and assignee distribution.
- Customers, teams, roles, permissions, tags, tasks, visits, comments, and history.
- Conversations, attachments, predefined messages, read state, and delivery tracking.
- Store dashboard and reports on channels, deals, and sales performance.
- Backoffice for dealerships, platform administrators, FAQs, and support tickets.
- Store branding: name, colors, logos, favicon, business hours, and commission rules.
- AI copilot with a contact dossier, next action, and suggested replies.

Access depends on authentication, store membership, and permissions. The current system does not enforce billing or subscription restrictions.

## Local development

Use Node.js 22 and pnpm 10.25.0 to keep the environment aligned with the other projects. These examples assume all three repositories are sibling directories.

For the initial setup, copy `.env.example` to `.env` and configure the variables. Preserve existing environment files if they are already configured.

```bash
cp .env.example .env
pnpm install --frozen-lockfile
```

The `postinstall` script generates the Prisma client and builds the backend. The pnpm configuration allows the installation scripts required by bcrypt and Prisma.

The integrated environment uses [docker-compose.local.yml](docker-compose.local.yml), running PostgreSQL, Redis, Evolution, and Ollama through Colima. The backend, microservice, and frontend run on the host with their own logs:

```bash
colima start
docker-compose --context colima --env-file .env.local -f docker-compose.local.yml up -d
```

Before running this command, configure `.env.local` following the [local environment guide](docker/local/README.md). It covers shared secrets, databases, Prisma generation, application startup, and logs.

| Resource              | Local address                                                                    |
| --------------------- | -------------------------------------------------------------------------------- |
| CRM database          | `postgresql://autopilot:autopilot@127.0.0.1:55432/autopilot?schema=public`       |
| Microservice database | `postgresql://autopilot:autopilot@127.0.0.1:55432/autopilot_micro?schema=public` |
| Redis                 | `127.0.0.1:56379`                                                                |
| Evolution             | `http://localhost:8080`                                                          |
| Ollama                | `http://localhost:11434`                                                         |

The database credentials above apply only to the local Compose stack. PostgreSQL also creates the `evolution` database when the volume is first initialized.

To prepare the backend database, check the connection before applying migrations:

```bash
DATABASE_URL='postgresql://autopilot:autopilot@127.0.0.1:55432/autopilot?schema=public' pnpm exec prisma migrate deploy
```

In a backend terminal:

```bash
set -a
source .env.local
set +a
export DATABASE_URL='postgresql://autopilot:autopilot@127.0.0.1:55432/autopilot?schema=public'
export REDIS_HOST=127.0.0.1 REDIS_PORT=56379 REDIS_USERNAME='' REDIS_PASSWORD=''
export PORT=3003 FRONTEND_URL=http://localhost:3001 FRONT_URL=http://localhost:3001
export MICROSERVICE_URL=http://localhost:3005 MICROSERVICE_WS_URL=http://localhost:3005/crm
pnpm dev
```

Nest loads `.env`; the terminal explicitly loads `.env.local`. Installation does not create demo users: the first platform administrator must be provisioned before creating stores through the backoffice.

## AutoPilot AI

The copilot analyzes the latest 15 messages and the external listing identifier. It returns known contact information, inferred lead temperature, a next action, and one to three suggested replies. The listing identifier does not provide inventory details or vehicle specifications.

AI is enabled when these three variables are set in the backend environment:

```dotenv
CHAT_AI_URL=http://127.0.0.1:11434/v1/chat/completions
CHAT_AI_MODEL=gemma3:1b
CHAT_AI_API_KEY=ollama
```

The provider must support Chat Completions with `response_format: json_schema`. Locally, Ollama ignores the `ollama` key; the backend requires a value to enable analysis.

```bash
docker-compose --context colima --env-file .env.local -f docker-compose.local.yml exec -T ollama ollama pull gemma3:1b
```

To switch models, download the new model in Ollama, update `CHAT_AI_MODEL`, and restart the backend with `.env.local` loaded. Models are stored in the `ollama_data` volume. Inference uses the CPU under Colima on Mac; larger models require more memory. The 1B model is lightweight for testing and has quality limitations.

Redis handles the queue, locks, and cache; PostgreSQL stores validated analysis. Failures are rescheduled, and analysis is recalculated when a conversation receives new messages. AI does not automatically send messages or change deals. The salesperson confirms sending and reviews any data applied to a deal.

## API, authentication, and events

- Swagger: `http://localhost:3003/api`; Scalar: `http://localhost:3003/docs`.
- Process health: `GET /health`.
- Login: `POST /auth/login`; the JWT and database membership determine the store.
- Conversations: `/chats`, `/chats/:chatId/messages`, and `/chats/:chatId/read`.
- Copilot: `GET /chats/:chatId/copilot`; `POST /chats/:chatId/copilot/refresh` returns HTTP 202.
- Deals: `/deals` and subroutes for status, tasks, visits, and comments.
- Store branding: `GET /store/customization`; `PUT` updates require the owner.

Responses follow `{ message, statusCode, data }`. The frontend connects to the Socket.io `/chats` namespace with `auth.token`. Events include `message:received`, `message:status`, `deal:created`, and `autopilot:analysis-ready`; the authenticated store determines the room. Reconnection requires fetching history again.

The backend and microservice share `MICROSERVICE_TOKEN` for internal requests. `MICROSERVICE_WS_URL` enables Socket.io transport through `/crm`; when absent, delivery uses HTTP. Incoming events are persisted and deduplicated. See the [communication contract](docs/COMMUNICATION.md) and [integration guide](docs/INTEGRATION_GUIDE.md).

## Organization and verification

`src/core/` contains business modules; `src/auth/`, authentication; `src/persistence/`, database and file adapters; and `src/utils/`, utilities and email templates. The schema and migrations are in `prisma/`. Jest tests live alongside the code in `*.spec.ts` files.

```bash
pnpm exec tsc --noEmit
pnpm exec jest --runInBand
pnpm build
pnpm test:migrations
```

Migration tests use isolated embedded PostgreSQL. SMTP supports email workflows; Firebase handles files; Novu supports integrated notifications. Provider accounts and credentials are required to validate these real integrations.

The original `docker-compose.yml` remains available to run the backend in a container. Use the alternative Compose file for integrated development with Colima. Contribution guidelines are in [AGENTS.md](AGENTS.md).
