# AutoPilot CRM - Backend (Core API)

API principal do sistema AutoPilot CRM, responsável por toda a lógica de negócio do CRM para concessionárias e lojistas de veículos. Construída com NestJS, Prisma ORM e PostgreSQL.

## Sobre o Projeto

O AutoPilot é um CRM omnichannel especializado no mercado automotivo. Este repositório contém a API Core que gerencia:

- **Autenticação e Autorização**: JWT, roles/perfis de usuário, permissões granulares, guard de assinatura ativa
- **Gestão de Lojas**: Cadastro de lojas, dados da loja, configurações
- **Gestão de Usuários/Colaboradores**: Cadastro de colaboradores, cargos, permissões de acesso
- **Atendimentos e Chat**: Gestão de funis de atendimento, comentários, anexos, tags, tarefas, visitas, suspensões, compartilhamento, distribuição automática
- **Clientes**: Cadastro completo de leads e clientes, histórico, qualificação
- **Integrações**: Status de integrações com canais omnichannel
- **Backoffice Administrativo**: Gestão de assinantes, planos, FAQs, tickets de suporte, dashboard administrativo, usuários admin
- **Dashboard e Relatórios**: Métricas de atendimentos, origem de leads, relatórios por vendedor/geral, exportação
- **Planos e Assinaturas**: Integração com Stripe para planos e gestão de assinaturas
- **Notificações**: Sistema de notificações via Novu
- **Suporte/Tickets**: Sistema de tickets para lojistas e backoffice
- **Mensagens Padrão**: Templates de mensagens para atendimento

## Stack Tecnológica

- **Framework**: NestJS 10 (Node.js)
- **ORM**: Prisma 5
- **Banco de Dados**: PostgreSQL
- **Cache**: Redis (cache-manager)
- **Autenticação**: JWT + Passport
- **Pagamentos**: Stripe
- **Notificações**: Novu
- **Armazenamento**: AWS S3 / Google Cloud Storage
- **Email**: Nodemailer + Handlebars
- **Documentação API**: Swagger + Scalar
- **Outros**: Firebase Admin, Event Emitter, Schedule (cron jobs), Bull (filas - no microsserviço)

## Pré-requisitos

- Node.js 18+
- PostgreSQL
- Redis
- npm ou pnpm

## Instalação

```bash
$ npm install
```

## Configuração

Copie o arquivo `.env.example` para `.env` e preencha as variáveis de ambiente:

```bash
cp .env.example .env
```

Variáveis principais:
- `DATABASE_URL`: Conexão PostgreSQL
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`: Conexão Redis
- `JWT_SECRET`, `JWT_EXPIRES_IN`: Configurações JWT
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`: Integração Stripe
- `NOVU_API_KEY`: Integração Novu
- `AWS_S3_*` ou `GCS_*`: Armazenamento de arquivos
- `FIREBASE_*`: Configurações Firebase

Execute as migrações do banco:

```bash
$ npm run migrate:dev
```

## Execução

```bash
# Desenvolvimento com watch
$ npm run dev

# Modo produção
$ npm run start:prod
```

A API estará disponível em `http://localhost:3000` (ou porta configurada).
Documentação Swagger: `/api` ou `/reference`.

## Docker

```bash
docker-compose up -d
```

## Testes

```bash
# Unitários
$ npm run test

# E2E
$ npm run test:e2e

# Cobertura
$ npm run test:cov
```

## Estrutura Principal

```
src/
├── auth/                 # Autenticação, guards, roles, permissões
├── core/
│   ├── backoffice/       # Módulos administrativos (assinantes, planos, etc)
│   ├── integracao/       # Controle de integrações
│   ├── loja/             # Módulos da loja (atendimento, chat, cliente, etc)
│   ├── notificacoes/     # Notificações
│   ├── suporte/          # Sistema de tickets
│   └── usuario/          # Gestão de usuários
├── config/               # Configs (Firebase, etc)
└── prisma/               # Schema.prisma e migrações
```
