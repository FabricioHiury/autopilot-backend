# AutoPilot CRM backend

NestJS 10 CRM API with Prisma 5, PostgreSQL, Redis and Socket.io. Code, models and API fields use English; existing source comments remain in Portuguese. Sales negotiations use `Deal`.

## Setup

```sh
cp .env.example .env
npm ci
npm run migrate:deploy
npm run dev
```

Run `npm run migrate:deploy` to apply the versioned migrations in `prisma/migrations/`. Inspect `DATABASE_URL` before running database commands.

The API defaults to port 3003. Swagger is at `/api`, Scalar at `/docs`, and the health endpoint is `/health`. Set `FRONTEND_URL` to the single frontend origin. Configure JWT secrets, PostgreSQL, Redis and the shared microservice token in `.env`. Firebase credentials are needed when using file storage. SMTP and Novu are needed only for their respective integrations.

```sh
npm run build
npm test -- --runInBand
npm run test:migrations
```

Migration tests use isolated embedded PostgreSQL instances and never connect to `DATABASE_URL`.

## Single-domain branding

All companies use the same domain. `POST /auth/login` accepts `email` and `password`, returns `storeId`, and includes `storeId` in the signed access token. Authenticated requests resolve tenant membership from the database. No tenant ID or hostname supplied by the frontend selects the store.

- `GET /store/customization`: current store's branding; creates defaults for an existing store on first access.
- `PUT /store/customization`: owner-only updates to logo URLs, favicon, colors, display name, slug, hours, working days and commission rules.

The frontend loads this configuration after login and applies its CSS variables and images. `workingDays` uses 0 for Sunday through 6 for Saturday. Public slug lookup is not exposed. Slug is metadata, not a separate domain.

## Messaging and realtime

All provider operations go through `MICROSERVICE_URL` using `x-micro-token`. The core does not connect directly to Evolution, Meta or OLX.

| Method | Route                                  | Purpose                           |
| ------ | -------------------------------------- | --------------------------------- |
| GET    | `/chats`                               | List chats                        |
| GET    | `/chats/:chatId/messages`              | Message history                   |
| POST   | `/chats/:chatId/messages`              | Send a human-approved message     |
| PATCH  | `/chats/:chatId/read`                  | Mark chat read                    |
| GET    | `/integrations/status`                 | Current store's channels          |
| POST   | `/integrations/whatsapp/connect`       | Request session/QR code           |
| DELETE | `/integrations/whatsapp`               | Disconnect                        |
| POST   | `/integrations/whatsapp/verify-number` | Verify a number                   |
| POST   | `/chat/messages/incoming`              | Trusted microservice ingress      |
| POST   | `/leads/incoming`                      | Trusted microservice lead ingress |
| POST   | `/chat/messages/ack`                   | Delivery status                   |

Outbound messages use `POST /communication/messages` on the microservice. See [the communication contract](docs/COMMUNICATION.md) for payloads, acknowledgements, retry behavior and Socket.io events.

Set `MICROSERVICE_WS_URL` to the Socket.io namespace exposed by the microservice to enable a reconnecting WebSocket client. Leave it empty to use inbound webhooks. There is no periodic fetch of messages from the microservice. A local worker retries persisted inbound events.

Frontend clients connect to `/chats` with `auth: { token }`. The server joins the authenticated store room and emits `message:received`, `message:status`, `deal:created` and `autopilot:analysis-ready`. Redis Pub/Sub distributes events between API instances. Clients refresh history on reconnect because realtime notifications are not a replay log.

## Chat AI

- `GET /chats/:chatId/copilot`: persisted dossier and suggested replies.
- `POST /chats/:chatId/copilot/refresh`: queue a new analysis; returns HTTP 202.

Configure `CHAT_AI_URL`, `CHAT_AI_MODEL` and `CHAT_AI_API_KEY` for a chat-completions-compatible LLM endpoint. Without these values analysis is disabled and manual refresh returns 503. Requests use the last 15 messages and the external ad identifier. An ad ID does not provide vehicle specifications.

Redis maintains the pending analysis queue, locks and insight cache; PostgreSQL holds the authoritative insight. Malformed provider output is rejected, failures are retried, and stale results are rescheduled. Analysis never sends a message or changes a deal's stage. A seller reviews a suggestion and explicitly sends it through the normal message endpoint.

## CRM and removed modules

Deals, tasks, visits, comments, customers, employees, roles, reports, support, notifications and administration are retained under English paths. Main deal routes are `/deals`, `/deals/:dealId/status`, `/deals/:dealId/tasks`, `/deals/:dealId/visits` and `/deals/:dealId/comments`. The status endpoint uses the existing deal-edit validation and permission checks. Swagger lists the complete contract.

Stripe, billing webhooks, plans, subscriptions, subscription guards and the subscription revenue dashboard were removed. No subscription check blocks CRM use.

## Local containers

```sh
docker compose up --build
```

Compose creates an isolated PostgreSQL database and Redis with persistent volumes and exposes only API port 3003. Its database credentials are for local development. It deploys migrations automatically to that isolated database. Configure `MICROSERVICE_URL` with a hostname reachable from the API container (for a host service on Docker Desktop, usually `host.docker.internal`).

The frontend, microservice and LLM provider are separate deployments and must implement the documented contracts. End-to-end provider validation requires those services and credentials.
