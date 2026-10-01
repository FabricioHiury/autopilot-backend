const fs = require('fs');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');
(async () => {
  const db = new PGlite();
  await db.exec(
    fs.readFileSync(
      process.cwd() +
        '/prisma/migrations/20261001000000_baseline/migration.sql',
      'utf8',
    ),
  );
  await db.exec(`INSERT INTO usuario (id,email,senha,status,perfil,atualizado_em) VALUES ('user-1','owner@example.test','hash','ativo','lojista',NOW());
INSERT INTO lojista (id,id_usuario,atualizado_em) VALUES ('owner-1','user-1',NOW());
INSERT INTO loja (id,id_lojista,cnpj,nome_empresa,atualizado_em) VALUES ('store-1','owner-1','tax-1','Test Store',NOW());
INSERT INTO colaborador (id,id_loja,id_usuario,atualizado_em) VALUES ('employee-1','store-1','user-1',NOW());
INSERT INTO cargo (id,id_loja,cargo,funcionalidades) VALUES ('role-1','store-1','Seller','lojaVerAtendimentos,lojaVerChat');
INSERT INTO "_cargo_colaborador" ("A","B") VALUES ('role-1','employee-1');
INSERT INTO atendimento (id,id_loja,origem_atendimento,temperatura,status,atualizado_em) VALUES ('deal-1','store-1','whatsapp','quente','emNegociacao',NOW());
INSERT INTO chat (id,id_loja,"idAtendimento",id_destinario_api_externa,canal,atualizado_em) VALUES ('chat-1','store-1','deal-1','contact-1','whatsapp',NOW());
INSERT INTO mensagem (id,id_chat,canal,remetente,conteudo) VALUES ('message-1','chat-1','whatsapp','cliente','Keep the customer text intact');`);
  await db.exec(
    fs.readFileSync(
      process.cwd() +
        '/prisma/migrations/20261001010000_english_whitelabel_realtime/migration.sql',
      'utf8',
    ),
  );
  assert.deepEqual((await db.query('SELECT profile,status FROM users')).rows, [
    { profile: 'storeOwner', status: 'active' },
  ]);
  assert.deepEqual(
    (await db.query('SELECT temperature,status FROM deals')).rows,
    [{ temperature: 'HOT', status: 'atNegotiation' }],
  );
  assert.deepEqual(
    (await db.query('SELECT sender,content FROM messages')).rows,
    [{ sender: 'CUSTOMER', content: 'Keep the customer text intact' }],
  );
  assert.deepEqual((await db.query('SELECT * FROM "_role_employee"')).rows, [
    { A: 'employee-1', B: 'role-1' },
  ]);
  assert.deepEqual((await db.query('SELECT features FROM roles')).rows, [
    { features: 'storeViewDeals,storeViewChat' },
  ]);
  const fresh = new PGlite();
  await fresh.exec(
    execFileSync(
      process.execPath,
      [
        require.resolve('prisma/build/index.js'),
        'migrate',
        'diff',
        '--from-empty',
        '--to-schema-datamodel',
        'prisma/schema.prisma',
        '--script',
      ],
      { encoding: 'utf8' },
    ),
  );
  const query = `SELECT table_name,column_name,data_type,is_nullable,column_default FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name,column_name`;
  const actual = (await db.query(query)).rows,
    expected = (await fresh.query(query)).rows;
  const a = JSON.stringify(actual),
    e = JSON.stringify(expected);
  if (a !== e) {
    for (let i = 0; i < Math.max(actual.length, expected.length); i++)
      if (JSON.stringify(actual[i]) !== JSON.stringify(expected[i]))
        console.log('COLUMN DIFF', actual[i], expected[i]);
    throw Error('Schema mismatch');
  }
  const constraints = `SELECT c.relname as table_name, con.conname, pg_get_constraintdef(con.oid) AS definition FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND con.contype <> 'n' ORDER BY c.relname, con.conname`;
  const ca = (await db.query(constraints)).rows,
    ce = (await fresh.query(constraints)).rows;
  if (JSON.stringify(ca) !== JSON.stringify(ce)) {
    for (const item of ca)
      if (!ce.some((x) => JSON.stringify(x) === JSON.stringify(item)))
        console.log('CONSTRAINT DIFF', item);
    throw Error('Constraint mismatch');
  }
  const indexes =
    "SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='public' ORDER BY tablename,indexname";
  assert.deepEqual(
    (await db.query(indexes)).rows,
    (await fresh.query(indexes)).rows,
  );
  // Validate raw CRM queries against the migrated schema as Prisma cannot type-check SQL strings.
  const ts = require('typescript');
  let checkedQueries = 0;
  for (const file of [
    'src/core/store/modules/reports/reports-deals.service.ts',
    'src/core/store/modules/dashboard/store-dashboard.service.ts',
    'src/core/store/modules/deal/deal.service.ts',
  ]) {
    const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    const queries = [];
    function visit(node) {
      if (ts.isTaggedTemplateExpression(node) && node.tag.getText(source).includes('$queryRaw')) {
        let sql = '';
        if (ts.isNoSubstitutionTemplateLiteral(node.template)) sql = node.template.text;
        else { sql = node.template.head.text; for (const part of node.template.templateSpans) sql += 'NULL' + part.literal.text; }
        queries.push(sql);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
    for (const sql of queries) { await db.query('EXPLAIN ' + sql); checkedQueries++; }
  }
  console.log(`Validated ${checkedQueries} raw CRM queries against the migrated schema.`);
  console.log(
    'Migration passed: data, tenant links, role membership, columns, defaults, constraints and indexes preserved.',
  );
  await db.close();
  await fresh.close();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
