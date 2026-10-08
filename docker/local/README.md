# Desenvolvimento local com Colima

O `docker-compose.local.yml` na raiz sobe PostgreSQL, Redis, Evolution e Ollama.
Os volumes são exclusivos do projeto `autopilot-local`. As aplicações rodam no
host com `pnpm dev`. O Compose original permanece disponível.

Use Node.js 22 e pnpm 10.25.0. Os exemplos assumem backend, microservice e frontend
em pastas irmãs. Configure o `.env` de cada API a partir de seu `.env.example` e
instale as dependências com `pnpm install --frozen-lockfile`. Preserve arquivos
de ambiente que já estejam configurados.

Na raiz de `autopilot-backend`, crie o `.env.local` (ignorado pelo Git) com os
segredos compartilhados. Um exemplo de estrutura, com valores a substituir:

```dotenv
MICROSERVICE_TOKEN=substitua-por-um-segredo-compartilhado
EVOLUTION_API_KEY=substitua-por-uma-chave-da-api-evolution
EVOLUTION_WEBHOOK_TOKEN=substitua-por-um-segredo-diferente-para-o-webhook
ENCRYPTION_KEY=substitua-por-32-bytes-em-base64
```

As chaves de Evolution e de webhook devem ser diferentes. Para gerar um segredo,
use `openssl rand -hex 32`; para `ENCRYPTION_KEY`, use `openssl rand -base64 32`.

```bash
colima start
docker-compose --context colima --env-file .env.local -f docker-compose.local.yml up -d
```

| Serviço    | Endereço no host         |
| ---------- | ------------------------ |
| PostgreSQL | `127.0.0.1:55432`        |
| Redis      | `127.0.0.1:56379`        |
| Evolution  | `http://localhost:8080`  |
| Ollama     | `http://localhost:11434` |

PostgreSQL usa usuário/senha `autopilot`/`autopilot` e cria os bancos `autopilot`,
`autopilot_micro` e `evolution` na primeira inicialização do volume.

Para gerar o Prisma e preparar o banco, execute diretamente em cada projeto:

```bash
# autopilot-backend
pnpm exec prisma generate
DATABASE_URL='postgresql://autopilot:autopilot@127.0.0.1:55432/autopilot?schema=public' pnpm exec prisma migrate deploy

# autopilot-microservice
pnpm exec prisma generate
DATABASE_URL='postgresql://autopilot:autopilot@127.0.0.1:55432/autopilot_micro?schema=public' pnpm exec prisma db push --skip-generate
```

Para iniciar cada API, abra um terminal na pasta do projeto e carregue os segredos
locais antes de `pnpm dev`:

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

Frontend, em seu próprio terminal:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3003 NEXT_PUBLIC_SOCKET_URL=http://localhost:3003 pnpm dev
```

Ao executar `pnpm dev` nos terminais, os logs aparecem diretamente em cada um.
No ambiente local que foi iniciado em segundo plano, os logs foram redirecionados
para `autopilot-backend/logs/local`. Acompanhe a partir da raiz do backend:

```bash
tail -f logs/local/backend.log logs/local/microservice.log logs/local/frontend.log
```

Antes de iniciar outra instância, encerre os processos existentes; seus PIDs estão
em `logs/local/*.pid`. Para parar apenas a infraestrutura, preservando os dados:

```bash
docker-compose --context colima --env-file .env.local -f docker-compose.local.yml stop
```

O banco local começa vazio, sem usuários de teste. Pareamento WhatsApp e demais
integrações externas dependem das respectivas contas e configurações.

## IA local com Ollama

Baixe o modelo uma vez; ele permanece no volume `ollama_data`:

```bash
docker-compose --context colima --env-file .env.local -f docker-compose.local.yml up -d ollama
docker-compose --context colima --env-file .env.local -f docker-compose.local.yml exec -T ollama ollama pull gemma3:1b
```

Adicione ao `.env.local` e reinicie o backend carregando esse arquivo:

```dotenv
CHAT_AI_URL=http://127.0.0.1:11434/v1/chat/completions
CHAT_AI_MODEL=gemma3:1b
CHAT_AI_API_KEY=ollama
```

O valor `ollama` é local e não exige cadastro: o servidor ignora a chave, mas o
backend exige um valor para habilitar a IA. O modelo roda pela CPU no Colima do
Mac. Modelos maiores precisam de mais memória; o 1B serve para testes, e suas
sugestões devem ser revisadas. O copiloto analisa conversas e sugere respostas;
o envio continua dependendo da ação do usuário.
O provedor deve aceitar `response_format` com `json_schema`; o backend continua
validando a análise antes de salvá-la.

```bash
docker-compose --context colima --env-file .env.local -f docker-compose.local.yml logs -f ollama
```
