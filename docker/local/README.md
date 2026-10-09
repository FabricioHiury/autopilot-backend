# Local development with Colima

The root `docker-compose.local.yml` starts PostgreSQL, Redis, Evolution, and Ollama.
Volumes belong exclusively to the `autopilot-local` project. Applications run on
the host with `pnpm dev`. The original Compose file remains available.

Use Node.js 22 and pnpm 10.25.0. These examples assume the backend, microservice,
and frontend are sibling directories. Configure each API's `.env` from its
`.env.example` and install dependencies with `pnpm install --frozen-lockfile`.
Preserve environment files that are already configured.

In the `autopilot-backend` root, create `.env.local` (ignored by Git) with the
shared secrets. Example structure with values to replace:

```dotenv
MICROSERVICE_TOKEN=replace-with-a-shared-secret
EVOLUTION_API_KEY=replace-with-an-evolution-api-key
EVOLUTION_WEBHOOK_TOKEN=replace-with-a-different-webhook-secret
ENCRYPTION_KEY=replace-with-32-base64-encoded-bytes
```

The Evolution API and webhook keys must differ. Generate a secret with
`openssl rand -hex 32`; for `ENCRYPTION_KEY`, use `openssl rand -base64 32`.

```bash
colima start
docker-compose --context colima --env-file .env.local -f docker-compose.local.yml up -d
```

| Service    | Host address             |
| ---------- | ------------------------ |
| PostgreSQL | `127.0.0.1:55432`        |
| Redis      | `127.0.0.1:56379`        |
| Evolution  | `http://localhost:8080`  |
| Ollama     | `http://localhost:11434` |

PostgreSQL uses `autopilot`/`autopilot` as its username/password and creates the
`autopilot`, `autopilot_micro`, and `evolution` databases when the volume is first initialized.

To generate Prisma clients and prepare databases, run directly in each project:

```bash
# autopilot-backend
pnpm exec prisma generate
DATABASE_URL='postgresql://autopilot:autopilot@127.0.0.1:55432/autopilot?schema=public' pnpm exec prisma migrate deploy

# autopilot-microservice
pnpm exec prisma generate
DATABASE_URL='postgresql://autopilot:autopilot@127.0.0.1:55432/autopilot_micro?schema=public' pnpm exec prisma db push --skip-generate
```

To start each API, open a terminal in its project directory and load the local
secrets before running `pnpm dev`:

```bash
set -a
source ../autopilot-backend/.env.local
set +a
export REDIS_HOST=127.0.0.1 REDIS_PORT=56379 REDIS_USERNAME='' REDIS_PASSWORD=''
export FRONTEND_URL=http://localhost:3001 FRONT_URL=http://localhost:3001
```

Backend:

```bash
export DATABASE_URL='postgresql://autopilot:autopilot@127.0.0.1:55432/autopilot?schema=public'
export PORT=3003 MICROSERVICE_URL=http://localhost:3005 MICROSERVICE_WS_URL=http://localhost:3005/crm
pnpm dev
```

Microservice:

```bash
export DATABASE_URL='postgresql://autopilot:autopilot@127.0.0.1:55432/autopilot_micro?schema=public'
export PORT=3005 AUTOPILOT_URL=http://localhost:3003 APP_BASE_URL=http://localhost:3005
export EVOLUTION_API_URL=http://localhost:8080
export EVOLUTION_WEBHOOK_URL=http://host.docker.internal:3005/whatsapp/webhook/evolution
pnpm dev
```

Frontend, in its own terminal:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3003 NEXT_PUBLIC_SOCKET_URL=http://localhost:3003 pnpm dev
```

When running `pnpm dev` in terminals, logs appear directly in each terminal.
In the local environment started in the background, logs were redirected to
`autopilot-backend/logs/local`. Follow them from the backend root:

```bash
tail -f logs/local/backend.log logs/local/microservice.log logs/local/frontend.log
```

Before starting another instance, stop existing processes; their PIDs are in
`logs/local/*.pid`. To stop only infrastructure while preserving data:

```bash
docker-compose --context colima --env-file .env.local -f docker-compose.local.yml stop
```

The local database starts empty, without test users. WhatsApp pairing and other
external integrations depend on the respective accounts and configuration.

## Local AI with Ollama

Download the model once; it stays in the `ollama_data` volume:

```bash
docker-compose --context colima --env-file .env.local -f docker-compose.local.yml up -d ollama
docker-compose --context colima --env-file .env.local -f docker-compose.local.yml exec -T ollama ollama pull gemma3:1b
```

Add these variables to `.env.local` and restart the backend with that file loaded:

```dotenv
CHAT_AI_URL=http://127.0.0.1:11434/v1/chat/completions
CHAT_AI_MODEL=gemma3:1b
CHAT_AI_API_KEY=ollama
```

The `ollama` value is local and does not require an account: the server ignores
the key, but the backend requires a value to enable AI. The model runs on the CPU
under Colima on Mac. Larger models require more memory; the 1B model is intended
for testing, and its suggestions must be reviewed. The copilot analyzes
conversations and suggests replies; sending still requires a user action.
The provider must support `response_format` with `json_schema`; the backend
continues to validate analysis before saving it.

```bash
docker-compose --context colima --env-file .env.local -f docker-compose.local.yml logs -f ollama
```
