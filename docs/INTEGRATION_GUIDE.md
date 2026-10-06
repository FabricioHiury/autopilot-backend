# Integration Guide — Autopilot Backend

> **Base URL padrão:** `http://localhost:3003`
> **Documentação interativa (Swagger/Scalar):** `GET /docs`
> **Health check:** `GET /health`

---

## Sumário

- [Padrão de Resposta](#padrão-de-resposta)
- [Autenticação](#autenticação)
- [Perfis e Permissões](#perfis-e-permissões)
- [Frontend — Guia Completo](#frontend--guia-completo)
- [Microservice — Guia Completo](#microservice--guia-completo)
- [Timeouts e limites](#timeouts-e-limites)
- [Variáveis de ambiente — Referência completa](#variáveis-de-ambiente--referência-completa)

---

## Padrão de Resposta

**Todas** as respostas HTTP são envelopadas pelo `ResponseInterceptor`:

```json
{
  "message": "Operation completed successfully.",
  "statusCode": 200,
  "data": { }
}
```

Erros seguem o mesmo envelope, com `data: null`:

```json
{
  "message": "Mensagem de erro descritiva",
  "statusCode": 400,
  "data": null
}
```

---

## Autenticação

### JWT (Frontend / Usuários)

Todas as rotas protegidas exigem o header:

```
Authorization: Bearer <JWT_TOKEN>
```

O token é obtido via `POST /auth/login`. O token de reset de senha expira em **4 horas**.

### API Key (Microservice)

Rotas do microservice usam:

```
x-micro-token: <MICROSERVICE_TOKEN>
```

> `x-api-key` também é aceito como alias. **Nunca exponha esse token ao frontend.**

---

## Perfis e Permissões

| Perfil | Descrição |
|---|---|
| `autopilot` | Admin do backoffice |
| `storeowner` | Dono da loja |
| `user` | Funcionário da loja (employee) |

O JWT inclui `storeId` no payload para usuários `storeowner` e `user`. O backend valida que o `storeId` do token bate com o store atual a cada requisição.

---

## Frontend — Guia Completo

### Autenticação HTTP

#### `POST /auth/login`

Nenhuma autenticação prévia necessária.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "secret123",
  "expoPushToken": "ExponentPushToken[...]"
}
```

> `expoPushToken` é opcional. Inclua para habilitar notificações push via Novu.

**Resposta (`data`):**
```json
{
  "token": "<JWT>",
  "profile": "storeowner",
  "name": "João Silva",
  "companyName": "Loja XYZ",
  "storeId": "2e18bdb9-512d-4415-99e5-daa9b446ab10",
  "id": "user-uuid"
}
```

#### `POST /auth/validate`

Requer JWT. Retorna o perfil e redireciona para o dashboard correto.

| Perfil | `redirect` |
|---|---|
| `autopilot` | `/backoffice/app/dashboard` |
| `storeowner` / `user` | `/app/dashboard` |

#### `POST /auth/forgot-password/:email`

Dispara e-mail de recuperação. Sem autenticação.

#### `POST /auth/reset-password`

```json
{ "token": "<reset-jwt>", "password": "nova-senha" }
```

---

### Rotas disponíveis

#### Store (`/store`)

| Método | Rota | Perfil | Descrição |
|---|---|---|---|
| `GET` | `/store/` | `storeowner`, `autopilot` | Dados da loja autenticada |
| `POST` | `/store/register` | Público | Cadastro de nova loja/storeowner |
| `POST` | `/store/confirm-email` | Público | Confirmar e-mail com token |
| `PUT` | `/store/address` | `storeowner` | Registrar/editar endereço |
| `DELETE` | `/store/address/:idAddress` | `storeowner` | Remover endereço |
| `PUT` | `/store/contact` | `storeowner` | Editar contato |
| `GET` | `/store/list` | Autenticado | Listar lojas |
| `PUT` | `/store/edit` | `storeowner` | Editar dados da loja |
| `GET` | `/store/meu-access` | Autenticado | Permissões do usuário logado |
| `POST` | `/store/update-logo` | `storeowner` | Upload da logo (multipart/form-data) |

---

#### Chats (`/chats`)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/chats` | Listar chats ativos (com filtros) |
| `GET` | `/chats/list-chats-archived` | Listar chats arquivados |
| `GET` | `/chats/:chatId` | Detalhes de um chat |
| `POST` | `/chats/new-chat` | Criar novo chat outbound |
| `GET` | `/chats/:chatId/messages` | Listar mensagens do chat (paginado) |
| `GET` | `/chats/message/:messageId` | Buscar mensagem por ID |
| `GET` | `/chats/message/:messageId/page` | Buscar mensagem com contexto de página |
| `POST` | `/chats/:chatId/messages` | Enviar mensagem |
| `POST` | `/chats/generate-attachment/:chatId` | Upload de arquivo (multipart) |
| `PUT` | `/chats/message/:messageId/read` | Marcar mensagem como lida |
| `PATCH` | `/chats/:chatId/read` | Marcar todo o chat como lido |
| `PUT` | `/chats/:chatId/archive` | Arquivar chat |
| `PUT` | `/chats/:chatId/unarchive` | Desarquivar chat |
| `PUT` | `/chats/:chatId/update-deal/:dealId` | Associar deal ao chat |
| `GET` | `/chats/number-whatsapp-available` | Verificar disponibilidade de número |
| `GET` | `/chats/find-contact-by-number` | Buscar contato por número |

---

#### Deals (`/deals`)

| Método | Rota | Permissão | Descrição |
|---|---|---|---|
| `POST` | `/deals` | — | Criar deal |
| `GET` | `/deals` | `STORE_VIEW_DEALS` | Listar deals (com filtros) |
| `GET` | `/deals/list-chats` | `STORE_VIEW_CHAT` | Listar deals com chats |
| `GET` | `/deals/history-customer` | `STORE_VIEW_DEALS` | Histórico do cliente |
| `GET` | `/deals/:dealId` | `STORE_VIEW_DEALS` | Detalhes do deal |
| `PATCH` | `/deals/:dealId/status` | `STORE_EDIT_DELETE_DEAL` | Editar status do deal |
| `PATCH` | `/deals/:dealId/update-title` | `STORE_EDIT_DELETE_DEAL` | Atualizar título |
| `PATCH` | `/deals/:dealId/update-description` | `STORE_EDIT_DELETE_DEAL` | Atualizar descrição |
| `PUT` | `/deals/:dealId/update-customer/:customerId` | `STORE_EDIT_DELETE_DEAL` | Trocar cliente do deal |
| `DELETE` | `/deals/:dealId` | `STORE_EDIT_DELETE_DEAL` | Excluir deal (chats preservados) |
| `PATCH` | `/deals/:dealId/archive` | `STORE_EDIT_DELETE_DEAL` | Arquivar deal |
| `PATCH` | `/deals/:dealId/unarchive` | `STORE_EDIT_DELETE_DEAL` | Desarquivar deal |
| `GET` | `/deals/:dealId/attachments` | `STORE_VIEW_DEALS` | Listar anexos do deal |
| `POST` | `/deals/:dealId/attachment` | `STORE_EDIT_DELETE_DEAL` | Adicionar anexo |
| `DELETE` | `/deals/:dealId/attachment/:idAttachment` | `STORE_EDIT_DELETE_DEAL` | Remover anexo |
| `GET` | `/deals/:dealId/attachments-chat` | `STORE_VIEW_CHAT` | Anexos do chat do deal |
| `POST` | `/deals/:dealId/comments` | `STORE_REPLY_CHAT` | Adicionar comentário |
| `GET` | `/deals/:dealId/comments` | `STORE_VIEW_DEALS` | Listar comentários |
| `DELETE` | `/deals/:dealId/assignees` | `STORE_LINK_DEAL_USER` | Remover responsáveis |
| `GET` | `/deals/:dealId/logs` | `STORE_VIEW_DEALS` | Logs de atividades |

---

#### Integrações (`/integrations`)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/integrations/list-integrations` | Listar integrações disponíveis |
| `GET` | `/integrations/status` | Status das integrações da loja |
| `POST` | `/integrations/whatsapp/connect` | Conectar WhatsApp (gera QR) |
| `DELETE` | `/integrations/whatsapp` | Remover integração WhatsApp |
| `PUT` | `/integrations/whatsapp/official` | Configurar WhatsApp Business API |
| `GET` | `/integrations/whatsapp/api-status` | Status da API WhatsApp |
| `GET` | `/integrations/whatsapp/official/phone-numbers` | Listar números WABA |
| `PUT` | `/integrations/whatsapp/api-type` | Definir tipo da API WhatsApp |
| `DELETE` | `/integrations/whatsapp/official` | Remover WhatsApp Oficial |
| `PUT` | `/integrations/olx` | Integrar OLX |
| `DELETE` | `/integrations/olx/remove` | Remover OLX |
| `GET` | `/integrations/olx-link-redirect` | Webhook de autenticação OLX |
| `PUT` | `/integrations/instagram` | Integrar Instagram |
| `PUT` | `/integrations/facebook` | Integrar Facebook |
| `POST` | `/integrations/whatsapp/verify-number` | Verificar número WhatsApp |
| `GET` | `/integrations/health/:channel` | Health check de integração |
| `POST` | `/integrations/refresh/:channel` | Forçar refresh de integração |
| `POST` | `/integrations/clear-cache/:channel` | Limpar cache de canal |
| `POST` | `/integrations/clear-all-cache` | Limpar todo o cache |
| `DELETE` | `/integrations/:channel/remove-with-cache` | Remover integração + cache |
| `GET` | `/integrations/cache-stats` | Estatísticas de cache |

> `channel` aceita: `whatsapp` | `instagram` | `facebook` | `olx` | `other`

A verificação pelo frontend aceita `{ "number": "5561999999999" }` em
`POST /integrations/whatsapp/verify-number`, ou `?number=5561999999999` em
`GET /chats/number-whatsapp-available`. O backend envia `{ storeId, phone }`
ao microservice em `POST /communication/whatsapp/verify-number` e adapta a lista
retornada pelo Evolution para `{ exists, number, numberSearch }`. Quando disponível,
`number` usa o número confirmado pelo provedor, sem o sufixo do JID.

---

### WebSocket (tempo real)

O frontend conecta ao namespace `/chats` do Socket.io, autenticando com o JWT:

```js
import { io } from 'socket.io-client';

const socket = io(`${API_URL}/chats`, {
  auth: { token: accessToken }, // JWT do usuário logado
});
```

> O token **deve** ter campo `exp` (expiração). Conexões com tokens de reset ou sem `exp` são recusadas. A conexão é encerrada automaticamente quando o token expira.

#### Eventos recebidos pelo frontend

| Evento | Payload | Quando dispara |
|---|---|---|
| `message:received` | `{ storeId, chatId, message }` | Nova mensagem chegou no chat |
| `message:status` | `{ storeId, chatId, message }` | Status de entrega de mensagem atualizado |
| `deal:created` | `{ storeId, deal }` | Novo deal criado via ingresso de mensagem |
| `autopilot:analysis-ready` | `{ storeId, chatId, insight, analyzedAt }` | Análise AI finalizada para o chat |

> **Importante:** Eventos são escopados por loja. Após reconectar, o frontend deve rebuscar o histórico via REST. Redis Pub/Sub é canal de notificação em tempo real, não um stream de replay durável.

```js
socket.on('message:received', ({ storeId, chatId, message }) => {
  // Atualizar lista de chats e mensagens
});

socket.on('message:status', ({ storeId, chatId, message }) => {
  // Atualizar status de entrega (SENT / DELIVERED / READ / FAILED)
});

socket.on('deal:created', ({ storeId, deal }) => {
  // Novo deal apareceu no pipeline
});

socket.on('autopilot:analysis-ready', ({ storeId, chatId, insight, analyzedAt }) => {
  // Exibir insights de IA para o chat
});
```

---

## Microservice — Guia Completo

### Variáveis de ambiente necessárias

Configure as variáveis abaixo no `.env` do **backend principal**:

```env
MICROSERVICE_URL=http://localhost:3005           # Base URL HTTP do microservice
MICROSERVICE_TOKEN=replace-with-a-shared-secret  # Segredo compartilhado (NUNCA expor ao frontend)
MICROSERVICE_WS_URL=http://localhost:3005/crm    # Namespace Socket.io do microservice (opcional)
```

> Se `MICROSERVICE_WS_URL` não estiver definido, o backend não tentará conexão WebSocket. Use apenas o ingresso via HTTP nesse caso.

---

### Autenticação do microservice

O microservice deve autenticar chamadas do backend usando:

```
x-micro-token: <MICROSERVICE_TOKEN>
```

O backend envia esse header em todas as chamadas (outbound, qrcode, status, etc.).

---

### Ingresso de mensagens e leads

O microservice pode entregar eventos ao backend de **duas formas**:

#### Opção A — HTTP (mais simples)

**Endpoint:** `POST /chat/messages/incoming`
**Header:** `x-micro-token: <MICROSERVICE_TOKEN>`
**HTTP Status de sucesso:** `202 Accepted`

**Endpoint para leads:** `POST /leads/incoming`
(Mesmo payload, sem exigência de `text` ou `attachmentUrl`)

**Payload normalizado:**

```json
{
  "storeId": "2e18bdb9-512d-4415-99e5-daa9b446ab10",
  "eventId": "provider-event-123",
  "externalMessageId": "provider-message-123",
  "externalContactId": "5511999999999",
  "channel": "whatsapp",
  "timestamp": "2026-10-01T10:00:00Z",
  "text": "Olá, tenho interesse no veículo",
  "name": "Nome do Contato",
  "externalAdId": "ad-123",
  "sentByStore": false
}
```

**Campos obrigatórios:**

| Campo | Tipo | Descrição |
|---|---|---|
| `storeId` | UUID | ID da loja no CRM |
| `eventId` | string (<=200) | ID único do evento no provider |
| `externalMessageId` | string (<=200) | ID da mensagem no provider |
| `externalContactId` | string (<=200) | ID do contato no provider |
| `channel` | enum | `whatsapp` / `instagram` / `facebook` / `olx` |
| `timestamp` | ISO 8601 | Data/hora da mensagem |

**Campos opcionais:**

| Campo | Tipo | Descrição |
|---|---|---|
| `text` | string (<=20000) | Conteúdo textual (obrigatório se sem `attachmentUrl`) |
| `attachmentUrl` | string (<=2000) | URL do anexo |
| `attachmentType` | string | Tipo do anexo (`image`, `video`, etc.) |
| `quotedMessageId` | string | ID interno da mensagem citada |
| `name` | string (<=200) | Nome do contato |
| `externalAdId` | string | ID do anúncio relacionado |
| `sentByStore` | boolean | `true` se enviado pelo atendente (default `false`) |

**Resposta de sucesso:**
```json
{
  "message": "Operation completed successfully.",
  "statusCode": 202,
  "data": { "accepted": true, "eventId": "provider-event-123" }
}
```

> **HTTP 202 significa que o evento foi persistido durável**, não que o processamento foi concluído. O processamento ocorre de forma assíncrona a cada 5 segundos.

**Regras de deduplicação e retry:**
- Retries com o mesmo `storeId + eventId + kind` são seguros (upsert idempotente).
- A deduplicação também verifica `externalMessageId + channel + storeId` na tabela de mensagens.
- Para leads sem ID de mensagem do provider, use um ID sintético estável como `lead:<provider_lead_id>`. **Não gere novo ID a cada retry.**
- Falhas são reprocessadas com backoff exponencial limitado (máx. 5 minutos).

---

#### Opção B — WebSocket Socket.io (recomendado para tempo real)

Configure `MICROSERVICE_WS_URL` no backend. O backend se conecta **ao microservice** (não o contrário):

```js
// Como o backend se conecta ao seu microservice:
io(MICROSERVICE_WS_URL, {
  transports: ['websocket'],
  auth: { token: MICROSERVICE_TOKEN },
  extraHeaders: { 'x-micro-token': MICROSERVICE_TOKEN },
  reconnection: true,
  reconnectionDelayMax: 10000,
});
```

**O microservice deve emitir:**

| Evento | Payload | Callback retorna |
|---|---|---|
| `message:incoming` | Payload normalizado (ver acima) | `{ accepted: true, eventId }` ou `{ accepted: false }` |
| `lead:incoming` | Payload normalizado | `{ accepted: true, eventId }` ou `{ accepted: false }` |
| `message:ack` | Payload de ACK (ver abaixo) | `{ accepted: true }` ou `{ accepted: false }` |

```js
// Exemplo de como o microservice deve emitir:
socket.emit('message:incoming', payload, (ack) => {
  if (!ack?.accepted) {
    // Guardar para retry manual
  }
});
```

> **Atenção:** O Socket.io **não garante replay de eventos** após reconexão. O microservice deve persistir eventos não-acknowledados e reenviar após reconectar, ou usar o fallback HTTP.

---

### Confirmação de entrega (ACK)

Use quando souber que uma mensagem foi entregue/lida pelo destinatário no canal externo.

**HTTP:** `POST /chat/messages/ack`
**Header:** `x-micro-token: <MICROSERVICE_TOKEN>`
**Ou WebSocket:** emitir `message:ack`

```json
{
  "storeId": "2e18bdb9-512d-4415-99e5-daa9b446ab10",
  "messageId": "748ac386-857a-4889-9759-110b66a7c9e7",
  "externalMessageId": "provider-message-456",
  "status": "DELIVERED"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `storeId` | UUID | Sim | ID da loja |
| `messageId` | UUID | Sim | ID interno da mensagem no CRM |
| `externalMessageId` | string | Não | ID do provider (atualiza se fornecido) |
| `status` | enum | Sim | `SENT` / `DELIVERED` / `READ` / `FAILED` |

> ACKs fora de ordem **não fazem downgrade** do status (ex: `READ` -> `DELIVERED` é ignorado). O campo `deliveryStatus` é o status de entrega no canal externo; `isRead` é o status de leitura pelo atendente no CRM — são campos independentes.

---

### Rotas que o microservice deve expor

O backend consome as seguintes rotas do microservice via HTTP com `x-micro-token`:

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/communication/messages` | Enviar mensagem outbound |
| `GET` | `/integrations/whatsapp/qrcode/:storeId` | Obter QR Code para conexão |
| `GET` | `/integrations/:storeId/status` | Status da integração |
| `DELETE` | `/integrations/:storeId` | Desconectar integração |

> Demais operações de integração são proxiadas pelo backend via rotas de integração documentadas no Swagger.

---

### Envio de mensagens pelo store (outbound)

Quando um atendente envia uma mensagem pelo frontend (`POST /chats/:chatId/messages`), o backend:

1. Valida permissões e parâmetros
2. Persiste a mensagem localmente como `PENDING`
3. Encaminha para o microservice:

```http
POST <MICROSERVICE_URL>/communication/messages
x-micro-token: <MICROSERVICE_TOKEN>
Content-Type: application/json
```

**Payload enviado ao microservice:**
```json
{
  "recipient": "5511999999999",
  "channel": "whatsapp",
  "text": "Olá! Como posso ajudar?",
  "messageId": "uuid-interno-da-mensagem",
  "storeId": "uuid-da-loja",
  "wppApiType": "baileys",
  "attachmentUrl": null,
  "attachmentType": null,
  "quotedMessageId": null
}
```

> Use `messageId` como **chave de idempotência** no microservice para evitar envio duplicado em caso de retry.

**O microservice pode responder:**
```json
{ "externalMessageId": "provider-message-789" }
```

Se a chamada falhar, a mensagem permanece com status `FAILED` localmente. Não há reenvio automático pelo backend.

---

## Timeouts e limites

| Contexto | Timeout |
|---|---|
| Rotas gerais | 15 segundos |
| `POST /chat/messages/incoming` | 30 segundos |
| `POST /chat/messages/reply` (legado) | 30 segundos |
| Análise de IA (`CHAT_AI_URL`) | 45 segundos |
| Body máximo | 10 MB |

---

## Variáveis de ambiente — Referência completa

```env
# Servidor
PORT=3003
BASE_URL=http://localhost:3003
FRONTEND_URL=http://localhost:3000

# Banco de dados
DATABASE_URL=postgresql://user:pass@localhost:5432/autopilot

# Microservice
MICROSERVICE_URL=http://localhost:3005
MICROSERVICE_TOKEN=shared-secret
MICROSERVICE_WS_URL=                       # Opcional; deixe vazio para usar só HTTP

# JWT
JWT_SECRET=seu-jwt-secret
JWT_RESET_SECRET=seu-jwt-reset-secret

# SMTP
DEFAULT_EMAIL_FROM=no-reply@example.com
SMTP_EMAIL=email@example.com
SMTP_PASSWORD=senha
SMTP_PORT=465
SMTP_SERVER=smtp.example.com

# AWS S3
AWS_ACCESS_KEY_ID=...
AWS_BUCKET_NAME=...
AWS_REGION=sa-east-1
AWS_SECRET_ACCESS_KEY=...

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=autopilot
REDIS_PASSWORD=...

# Novu (notificações push)
NOVU_API_KEY=...

# Chat AI (opcional — desabilitado se qualquer uma das três estiver ausente)
CHAT_AI_URL=https://api.openai.com/v1/chat/completions
CHAT_AI_API_KEY=sk-...
CHAT_AI_MODEL=gpt-4o-mini

# Firebase Storage
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```
