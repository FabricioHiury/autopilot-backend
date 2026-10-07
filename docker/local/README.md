# Desenvolvimento local com Colima

O `docker-compose.local.yml` na raiz sobe PostgreSQL, Redis, Evolution e Ollama.
Os volumes são exclusivos do projeto `autopilot-local`. As aplicações rodam no
host com `npm run dev`. O Compose original permanece disponível.

Na raiz de `autopilot-backend`, use o `.env.local` já criado (ignorado pelo Git),
com `MICROSERVICE_TOKEN`, `EVOLUTION_API_KEY`, `EVOLUTION_WEBHOOK_TOKEN` e
`ENCRYPTION_KEY`. As chaves de Evolution e de webhook devem ser diferentes.

```bash
colima start
docker-compose --context colima --env-file .env.local -f docker-compose.local.yml up -d
```

| Serviço | Endereço no host |
| --- | --- |
| PostgreSQL | `127.0.0.1:55432` |
| Redis | `127.0.0.1:56379` |
| Evolution | `http://localhost:8080` |
| Ollama | `http://localhost:11434` |

PostgreSQL usa usuário/senha `autopilot`/`autopilot` e cria os bancos `autopilot`,
`autopilot_micro` e `evolution` na primeira inicialização do volume.

Para gerar o Prisma e preparar o banco, execute diretamente em cada projeto:

```bash
# autopilot-backend
npx --no-install prisma generate
DATABASE_URL='postgresql://autopilot:autopilot@127.0.0.1:55432/autopilot?schema=public' npx --no-install prisma migrate deploy

# autopilot-microservice
npx --no-install prisma generate
DATABASE_URL='postgresql://autopilot:autopilot@127.0.0.1:55432/autopilot_micro?schema=public' npx --no-install prisma db push --skip-generate
```

Para iniciar cada API, abra um terminal na pasta do projeto e carregue os segredos
locais antes de `npm run dev`:

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
npm run dev
```

Microservice:

```bash
export DATABASE_URL='postgresql://autopilot:autopilot@127.0.0.1:55432/autopilot_micro?schema=public'
export PORT=3005 AUTOPILOT_URL=http://localhost:3003 APP_BASE_URL=http://localhost:3005
export EVOLUTION_API_URL=http://localhost:8080
export EVOLUTION_WEBHOOK_URL=http://host.docker.internal:3005/whatsapp/webhook/evolution
npm run dev
```

Frontend, em seu próprio terminal:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3003 NEXT_PUBLIC_SOCKET_URL=http://localhost:3003 npm run dev
```

Os processos iniciados nesta sessão estão em segundo plano e gravam os logs em
`autopilot-backend/logs/local`. Acompanhe a partir da raiz do backend:

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
