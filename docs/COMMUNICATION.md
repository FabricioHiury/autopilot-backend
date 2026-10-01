# Communication contract

## Trusted ingress

The microservice authenticates HTTP requests with `x-micro-token: <MICROSERVICE_TOKEN>` (`x-api-key` is also accepted). These credentials authorize the trusted gateway to deliver events for its stores; never expose this secret to the frontend.

Both `POST /chat/messages/incoming` and `POST /leads/incoming` use this normalized payload:

```json
{
  "storeId": "2e18bdb9-512d-4415-99e5-daa9b446ab10",
  "eventId": "provider-event-123",
  "externalMessageId": "provider-message-123",
  "externalContactId": "5511999999999",
  "channel": "whatsapp",
  "timestamp": "2026-10-01T10:00:00Z",
  "text": "I am interested in the advertised vehicle",
  "name": "Customer name",
  "externalAdId": "ad-123",
  "sentByStore": false
}
```

`storeId`, `eventId`, `externalMessageId`, `externalContactId`, `channel` and `timestamp` are required. `text` or `attachmentUrl` is required for message events. Optional fields: `name`, `externalAdId`, `sentByStore`, `attachmentUrl`, `attachmentType`, `quotedMessageId`. Channels are `whatsapp`, `instagram`, `facebook`, `olx`. Provider-specific contact cards, locations and reactions must be normalized into this contract by the microservice.

For a lead without a provider message ID, the microservice must assign a stable synthetic `externalMessageId` (for example `lead:<provider lead id>`). Retries must reuse both IDs. Do not generate a new ID on each delivery.

HTTP 202 means the event was durably stored, **not** that processing has finished. Standard HTTP responses are wrapped as `{ "message": "...", "statusCode": 202, "data": { "accepted": true, "eventId": "..." } }`. Retries with the same tenant/event/kind are safe. Message-level deduplication also checks provider message ID, tenant and channel.

The worker creates or finds the tenant's contact and chat, creates a deal if needed, persists the message and marks the inbox event complete in one serializable transaction. Failed jobs are retried with bounded exponential backoff. Monitor `inbound_events.status`, `attempts`, `available_at` and application logs for persistent failures. Existing deal stages are preserved.

## Microservice WebSocket

Configure `MICROSERVICE_WS_URL` with the microservice's Socket.io namespace, for example `http://localhost:3005/crm`. This is a **new contract the microservice must implement**; this repository does not change that separate service.

The backend connects with:

```js
io(MICROSERVICE_WS_URL, {
  transports: ['websocket'],
  auth: { token: MICROSERVICE_TOKEN },
  extraHeaders: { 'x-micro-token': MICROSERVICE_TOKEN },
});
```

The microservice emits `message:incoming` or `lead:incoming` with the normalized payload above and an acknowledgement callback. The backend calls the callback with `{ accepted: true, eventId }` after persisting the inbox event. Validation/persistence failures return `{ accepted: false }`.

The microservice must retain unacknowledged events and replay them after reconnect, or fall back to the HTTP endpoints. Socket.io reconnection alone does not recover missing provider events. There is no periodic message fetch by the core.

## Delivery acknowledgements

Use HTTP `POST /chat/messages/ack` or microservice Socket.io event `message:ack`:

```json
{
  "storeId": "2e18bdb9-512d-4415-99e5-daa9b446ab10",
  "messageId": "748ac386-857a-4889-9759-110b66a7c9e7",
  "externalMessageId": "provider-message-456",
  "status": "DELIVERED"
}
```

Status is `SENT`, `DELIVERED`, `READ` or `FAILED`. Updates require the local message to belong to the supplied tenant. Out-of-order acknowledgements cannot downgrade a successful delivery state. A socket acknowledgement returns `{ accepted: true }` after the update commits. Retry rejected acknowledgements.

`deliveryStatus` describes provider delivery/read state. `isRead` describes the CRM user's reading state; they are separate fields.

## Outbound calls

`POST /chats/:chatId/messages` requires the user's JWT and accepts `recipient`, `channel`, `text`, optional `attachmentUrl`, `attachmentType`, `quotedMessageId`, `type`, and location fields. Recipient and channel must match the selected chat. The core derives `storeId`, `messageId` and `wppApiType` itself and calls:

```http
POST /communication/messages
x-micro-token: <shared secret>
```

The forwarded payload includes the fields above plus those server-derived IDs. The microservice can return `{ "externalMessageId": "..." }` or its existing wrapped `{ "data": { "response": "..." }, "message": "..." }` response. It should use the local `messageId` as an outbound idempotency key. Outbound failures remain visible as `FAILED` locally; automatic resend is not performed.

Other required microservice routes are `GET /integrations/whatsapp/qrcode/:storeId`, `GET /integrations/:storeId/status` and `DELETE /integrations/:storeId`. Other retained integration operations use the existing proxy routes documented by Swagger.

## Frontend Socket.io

```js
const socket = io(`${API_URL}/chats`, {
  auth: { token: accessToken },
});
socket.on('message:received', ({ storeId, chatId, message }) => {});
socket.on('message:status', ({ storeId, chatId, message }) => {});
socket.on('deal:created', ({ storeId, deal }) => {});
socket.on(
  'autopilot:analysis-ready',
  ({ storeId, chatId, insight, analyzedAt }) => {},
);
```

Rooms are assigned from authenticated database membership. Clients cannot join arbitrary store or chat rooms. Tokens are required to have an expiration; expired/reset/invalid tokens are rejected. The connection closes when its token expires.

Events are scoped to a store and shared with its connected users. Existing REST permissions remain applicable to CRM operations. The frontend should deduplicate messages by local ID and fetch current history/insight after reconnect. Redis Pub/Sub is a live notification channel, not a durable frontend replay stream.
