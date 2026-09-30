# AutoPilot CRM - Backend (Core API Multi-Tenant White-Label)

> **Projeto**: Boilerplate CRM White-Label + AutoPilot IA  
> **Repositório**: `autopilot-backend` (NestJS + Prisma + PostgreSQL + Redis + Socket.io)  
> **Foco**: Concessionárias e Revendas de Veículos  
> **Domínio Único**: `app.autopilotcrm.com` (Login unificado com injeção dinâmica de branding pós-autenticação por concessionária)

API principal do sistema AutoPilot CRM, responsável por toda a lógica de negócio do CRM. Construída com NestJS, Prisma ORM, PostgreSQL, Redis e WebSockets.

---

## 🏗️ Principais Pilares Arquiteturais

1. **Internacionalização Total** — Código, Banco e Endpoints 100% em Inglês Padronizado (termo **`Deal`** para negociações, eliminando `Attendance` e o legado `Atendimento`).
2. **White-Label Dinâmico em Domínio Único** — Logo, Cores, Regras por Concessionária aplicadas dinamicamente pós-login via `StoreCustomization`, sem necessidade de DNS Wildcard ou subdomínios.
3. **Arquitetura Gateway com `autopilot-microservice`** — Toda comunicação externa (Evolution API v2, Meta Oficial, Instagram, Facebook, OLX) é delegada ao microsserviço.
4. **Comunicação em Tempo Real** — WebSocket Gateway / Socket.io para entrega instantânea de mensagens de chat e notificações do AutoPilot IA.
5. **Módulo AutoPilot IA** — Dossiê Estratégico do Lead (Raio-X da Negociação) e Respostas 1-Click com **controle 100% humano** (nenhuma ação é tomada sem clique explícito do vendedor).
6. **Limpeza e Sanitização** — Remoção total de Stripe, módulos de cobrança e dependências legadas (CRM B2B puro, sem bloqueios de assinatura).

---

## 🌐 Ecossistema Completo

```mermaid
graph TD
    subgraph "Clients"
        A[Frontend Next.js - Single Domain app.autopilotcrm.com]
    end

    subgraph "autopilot-backend (Port 3000 - Core CRM SaaS)"
        AUTH_EP[Auth & Tenant Config /auth/login & /store/customization]
        CORE_API[NestJS Core API - English Standards]
        WS_GATEWAY[WebSocket Gateway / Socket.io]
        AI_SVC[AutoPilot AI Service]
        CORE_DB[(autopilot_main DB / PostgreSQL)]
        REDIS_CACHE[(Redis Pub/Sub & Cache)]
    end

    subgraph "autopilot-microservice (Port 3005 - Omnichannel Gateway)"
        MICRO_GW[Communication Hub & Normalizer]
        EVO_SVC[Evolution API v2 Service / Baileys]
        META_SVC[Meta Cloud API / Instagram / Facebook]
        OLX_SVC[OLX Service]
        MICRO_DB[(autopilot_micro DB / Isolated)]
    end

    subgraph "External Providers"
        EVO_CONTAINER[Evolution API v2 Container]
        META_CLOUD[Meta Graph & Cloud API]
        OLX_API[OLX Chat & Leads API]
    end

    A -->|Login /auth/login| AUTH_EP
    A <-->|REST API + JWT Bearer| CORE_API
    A <-->|WebSocket: message:received, autopilot:analysis-ready| WS_GATEWAY

    CORE_API <--> CORE_DB
    CORE_API <--> REDIS_CACHE
    CORE_API --> AI_SVC

    CORE_API -->|POST /communication/messages| MICRO_GW
    CORE_API -->|GET /integrations/whatsapp/qrcode/:storeId| MICRO_GW
    CORE_API -->|DELETE /integrations/:storeId| MICRO_GW
    CORE_API -->|GET /integrations/:storeId/status| MICRO_GW

    MICRO_GW -->|POST /chat/messages/incoming| CORE_API
    MICRO_GW -->|POST /leads/incoming| CORE_API
    MICRO_GW -->|POST /chat/messages/ack| CORE_API

    MICRO_GW <--> MICRO_DB
    MICRO_GW <--> EVO_SVC <--> EVO_CONTAINER
    MICRO_GW <--> META_SVC <--> META_CLOUD
    MICRO_GW <--> OLX_SVC <--> OLX_API

    CORE_API -->|Trigger Analysis Event| AI_SVC
    AI_SVC -->|Emit autopilot:analysis-ready| WS_GATEWAY
```

---

## 📋 Funcionalidades Principais

### Core CRM (em Inglês Padronizado)
- **Deals (Negociações)** — Kanban, funil de vendas, transições de etapa, tasks, visits, comments, activity logs.
- **Chats & Mensagens** — Histórico, envio, marcação como lido, anexos, templates, WebSocket em tempo real.
- **Customers** — Cadastro completo, histórico, qualificação, temperatura (HOT/WARM/COLD).
- **Employees & Roles** — Gestão de colaboradores, cargos e permissões granulares.
- **Stores (Concessionárias)** — Cadastro multi-tenant com `storeId` como partição.

### White-Label Dinâmico (StoreCustomization)
- `primaryColor`, `secondaryColor`, `accentColor` injetadas via CSS variables no frontend.
- `logoLightUrl`, `logoDarkUrl`, `faviconUrl` carregados dinamicamente após login.
- Horários de atendimento, dias de trabalho e regras de comissão por concessionária.

### Integrações (via autopilot-microservice)
- **WhatsApp (Evolution API v2)** — QR code, conexão/desconexão, envio de mídia e áudio.
- **WhatsApp Oficial (Meta Cloud API)** — Templates HSM.
- **Instagram / Facebook (Meta)** — DMs, stories, leads de anúncios.
- **OLX** — Leads de anúncios, chat direto.

### AutoPilot IA (Dossiê & Quick Replies)
- **LeadDossier**: veículo de interesse, troca, método de pagamento, temperatura, objeção principal.
- **NextBestAction**: recomendação tática direta para avançar o funil.
- **QuickReplies**: sugestões de resposta 1-Click inseridas no campo de texto (o vendedor decide o que enviar).
- Processamento assíncrono via Redis/EventEmitter, com emissão de evento `autopilot:analysis-ready` via WebSocket.

### Dashboard & Relatórios
- Métricas de deals, origem de leads, desempenho por vendedor, tempo médio de resposta, conversão por temperatura.
- Exportação de relatórios.

---

## 🛠️ Stack Tecnológica

| Categoria | Tecnologia |
| :--- | :--- |
| **Framework** | NestJS 10 (Node.js) |
| **ORM** | Prisma 5 |
| **Banco de Dados** | PostgreSQL 15 |
| **Cache / Pub-Sub / Filas** | Redis |
| **Tempo Real** | @nestjs/websockets + Socket.io |
| **Autenticação** | JWT + Passport |
| **Notificações** | Novu |
| **Armazenamento** | AWS S3 / Google Cloud Storage |
| **Email** | Nodemailer + Handlebars |
| **Documentação API** | Swagger + Scalar |
| **Agendamento** | @nestjs/schedule (cron jobs) |
| **Validação** | class-validator + class-transformer |

---

## ✅ Pré-requisitos

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- npm ou pnpm
- `autopilot-microservice` rodando (para integrações omnichannel)

---

## 🚀 Instalação

```bash
npm install
```

---

## ⚙️ Configuração

Copie o arquivo `.env.example` para `.env` e preencha as variáveis de ambiente:

```bash
cp .env.example .env
```

### Variáveis Principais

| Variável | Descrição |
| :--- | :--- |
| `DATABASE_URL` | Conexão PostgreSQL (ex: `postgresql://user:pass@localhost:5432/autopilot_main`) |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` | Conexão Redis |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Configurações de autenticação JWT |
| `MICROSERVICE_URL` | URL do `autopilot-microservice` (ex: `http://localhost:3005`) |
| `MICROSERVICE_TOKEN` | API Key para comunicação com o microsserviço (`x-micro-token`) |
| `NOVU_API_KEY` | Integração Novu (notificações) |
| `AWS_S3_*` ou `GCS_*` | Credenciais de armazenamento de arquivos |
| `FIREBASE_*` | Configurações Firebase Admin |

### Executar Migrações do Banco de Dados

```bash
npm run migrate:dev
```

---

## 🏃 Execução

```bash
# Desenvolvimento com watch
npm run dev

# Build de produção
npm run build

# Modo produção
npm run start:prod
```

- **API REST**: `http://localhost:3000`
- **Documentação Swagger**: `/api` ou `/reference`
- **WebSocket Gateway**: Conecta via Socket.io autenticado por JWT.

### Eventos WebSocket Principais
- `message:received` — Nova mensagem recebida do cliente.
- `message:status` — Atualização de confirmação de leitura/entrega.
- `autopilot:analysis-ready` — Dossiê IA e sugestões atualizados.

---

## 🐳 Docker

```bash
docker-compose up -d
```

O Docker Compose sobe NestJS, PostgreSQL e Redis sem colisão de portas.

---

## 🧪 Testes

```bash
# Unitários
npm run test

# E2E
npm run test:e2e

# Cobertura
npm run test:cov
```

---

## 📂 Estrutura de Diretórios (Padrão Inglês)

```
src/
├── auth/                                 # Autenticação, guards, roles, permissões JWT
├── core/
│   ├── store/
│   │   ├── store.controller.ts           # Dados e customização da concessionária
│   │   ├── store.service.ts
│   │   └── modules/
│   │       ├── deal/                     # Deals (ex-atendimento): kanban, funil, status
│   │       │   ├── deal.controller.ts
│   │       │   ├── deal.service.ts
│   │       │   └── modules/              # deal/task, deal/visit, deal/comment, deal/activity
│   │       ├── chat/
│   │       │   ├── chat.controller.ts
│   │       │   ├── chat.service.ts
│   │       │   ├── chat.gateway.ts       # WebSocket Gateway (Socket.io)
│   │       │   └── chat-webhook.controller.ts  # Webhooks recebidos do autopilot-micro
│   │       ├── customer/                 # Customers (ex-cliente)
│   │       ├── employee/                 # Employees (ex-colaborador)
│   │       ├── role/                     # Roles (ex-cargo)
│   │       ├── dashboard/
│   │       ├── reports/
│   │       └── message-templates/
│   ├── integration/                      # Cliente do autopilot-microservice (ex-integracao)
│   │   ├── integration.controller.ts
│   │   ├── integration.service.ts
│   │   └── microservice.client.ts
│   ├── chat-ai/                          # Módulo AutoPilot IA
│   │   ├── chat-ai.controller.ts
│   │   ├── chat-ai.service.ts
│   │   └── prompts/
│   └── user/
├── config/                               # Configs (Firebase, etc)
└── prisma/                               # schema.prisma e migrações
```

---

## 🔌 Principais Endpoints REST

### Deals (Negociações)
| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `POST` | `/deals` | Criação de negociação |
| `GET` | `/deals` | Listagem e kanban |
| `GET` | `/deals/:id` | Detalhes do deal |
| `PATCH` | `/deals/:id/status` | Transição de etapa do funil |
| `POST` | `/deals/:id/tasks` | Agendamento de tarefa |
| `POST` | `/deals/:id/visits` | Registro de visita/test-drive |
| `POST` | `/deals/:id/comments` | Comentário interno |

### Chats & Mensagens
| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/chats` | Listagem de chats |
| `GET` | `/chats/:chatId/messages` | Histórico de mensagens |
| `POST` | `/chats/:chatId/messages` | Envio de mensagem |
| `PATCH` | `/chats/:chatId/read` | Marcar como lido |

### Webhooks Recebidos do `autopilot-microservice`
| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `POST` | `/chat/messages/incoming` | Nova mensagem recebida (qualquer canal) |
| `POST` | `/leads/incoming` | Novo lead criado externamente (OLX/Campanhas) |
| `POST` | `/chat/messages/ack` | Confirmação de envio/entrega |

### Integrações (Gerenciamento pela Concessionária)
| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/integrations/status` | Status unificado de canais da loja |
| `POST` | `/integrations/whatsapp/connect` | Solicita QR code e sessão WhatsApp |
| `DELETE` | `/integrations/whatsapp` | Desconecta sessão do WhatsApp |
| `POST` | `/integrations/whatsapp/verify-number` | Valida se número tem WhatsApp ativo |

### White-Label / Customização
| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/store/customization` | Cores, logos e horários da loja autenticada |
| `PUT` | `/store/customization` | Atualiza tema, branding e configurações |

### AutoPilot IA
| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/chats/:chatId/copilot` | Dossiê estratégico + Quick Replies (cache/banco) |
| `POST` | `/chats/:chatId/copilot/refresh` | Reanálise imediata pela IA |

---

## 🧠 Modelo de Dados do AutoPilot IA (Schema)

```json
{
  "leadDossier": {
    "vehicleOfInterest": "Jeep Compass Longitude 2021",
    "hasTradeIn": true,
    "tradeInVehicle": "Onix 1.0 Manual 2018 (~60.000 km)",
    "paymentMethod": "Financing (Target down payment of R$ 30k)",
    "perceivedTemperature": "HOT",
    "mainObjection": "Concern about interest rates and trade-in valuation"
  },
  "nextBestAction": "Invite the customer for in-person evaluation of the trade-in vehicle and simulate with lower rate banks.",
  "quickReplies": [
    "Com certeza! O Compass está novíssimo. Para eu já adiantar uma pré-avaliação do seu Onix com o nosso perito, me envia a quilometragem e versão dele?",
    "Excelente escolha! Que tal dar um pulo aqui na loja hoje à tarde para fazer um test-drive e já avaliarmos seu Onix pessoalmente tomando um café?"
  ]
}
```

---

## 🔗 Repositórios Relacionados

- **[autopilot-frontend](../autopilot-frontend)** — Frontend Next.js 14 (App Router) com White-Label Dinâmico e módulo AutoPilot IA.
- **[autopilot-microservice](../autopilot-microservice)** — Gateway Omnichannel (Evolution API v2, Meta, OLX) com banco isolado.
