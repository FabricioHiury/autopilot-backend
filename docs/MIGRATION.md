# Migration to the English CRM contract

This is a breaking release. Deploy the frontend and microservice against the new API contract together with the backend. The migration preserves CRM IDs, foreign keys, messages and user-entered content. Physical table and column renames are listed in [database-renames.json](database-renames.json).

## Existing database

1. Back up the complete database, including billing history, and verify restoration in staging.
2. Stop old API instances and inbound consumers. The old binary cannot use the renamed tables.
3. Compare the existing schema with `prisma/migrations/20261001000000_baseline/migration.sql`. The repository previously had no migration history. Resolve any drift before adopting this baseline.
4. For a database that already contains this legacy schema, **record** the baseline without running its CREATE statements:

   ```sh
   npx prisma migrate resolve --applied 20261001000000_baseline
   npx prisma migrate deploy
   npx prisma generate
   npm run build
   ```

5. Start the new API, validate login/branding, CRM records, file access and inbound/outbound messages, and then enable traffic.

The English migration runs inside a transaction. It uses `ALTER ... RENAME` rather than recreating CRM tables. The implicit employee/role join table swaps its A/B column names because Prisma orders the renamed models alphabetically. Structured enum values and comma-separated role permissions are converted as well.

**The tables `plano`, `assinatura` and `historico_pagamento` are intentionally dropped.** Restoring their contents requires the backup. Do not point an old binary at the migrated schema. Rollback requires restoring the backup and deploying the matching old clients.

Stored customer conversations, free-text notes and historical JSON are preserved as originally entered. Historic JSON snapshots are not rewritten as API DTOs. Existing image URLs remain intact. Store customization defaults are created lazily from each store's name.

## New database

```sh
npx prisma migrate deploy
```

This runs both the baseline and the English migration. No `db push` or `migrate reset` is required.

## Client changes

Examples: `senha` → `password`, `idLoja` → `storeId`, `idAtendimento` → `dealId`, `criadoEm` → `createdAt`. Models use `User`, `Store`, `Employee`, `Customer`, `TemporaryCustomer`, `Deal`, `DealTask`, `DealVisit`, `DealComment` and `DealActivityLog`.

Temperatures are `HOT`, `WARM`, `COLD`; deal modes are `BUY`, `SELL`, `CONSIGNMENT`; message senders are `CUSTOMER`, `STORE`, `SYSTEM`. Channel values remain lowercase (`whatsapp`, `instagram`, `facebook`, `olx`). Deal status values are `chat`, `preDeal`, `dealInitial`, `visit`, `atNegotiation`, `recovery`, `success`, `lost`.

Authentication returns the current `storeId`. Load branding after login and clear the previous tenant's cached branding on logout. Unknown DTO fields are rejected by validation. Read the generated Swagger before updating less common endpoints.

## Verification

```sh
npm run test:migrations
npm test -- --runInBand
npm run build
```

The migration test applies the baseline, inserts linked sample records, migrates them and compares the resulting columns, defaults, indexes and foreign keys against a fresh Prisma schema. It also asserts preservation of message content, role membership and translated permissions. It does not verify the state or schema drift of a live database.
