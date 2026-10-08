# AutoPilot — Backend do CRM

O AutoPilot é um CRM para lojas e concessionárias de veículos. Centraliza contatos, atendimentos comerciais, conversas de diferentes canais, tarefas, visitas e acompanhamento da equipe. O AutoPilot IA auxilia o vendedor com análises e sugestões que precisam de revisão humana.

Este repositório contém a API principal: autenticação, regras do CRM, isolamento por loja, permissões, administração da plataforma e persistência dos dados comerciais.

## Arquitetura

| Projeto                  | Responsabilidade                                    | Porta local |
| ------------------------ | --------------------------------------------------- | ----------- |
| `autopilot-frontend`     | Interface da loja e backoffice, em português        | 3001        |
| `autopilot-backend`      | API do CRM, autenticação, eventos e copiloto        | 3003        |
| `autopilot-microservice` | Integrações com WhatsApp, Instagram, Facebook e OLX | 3005        |

O navegador acessa o backend. O backend chama o microservice para operações dos canais; o microservice recebe callbacks dos provedores e entrega eventos ao CRM. O backend consulta o provedor de IA separadamente. Cada API possui seu próprio banco PostgreSQL.

Stack: NestJS 10, TypeScript, Prisma 6.19.3, PostgreSQL, Redis e Socket.io. `Deal` é o nome usado no código para um atendimento/negociação comercial.

## Funcionalidades atuais

- Atendimentos de compra, venda e consignação, pipeline, etapas, temperatura, motivos de perda e distribuição de responsáveis.
- Clientes, equipe, cargos, permissões, etiquetas, tarefas, visitas, comentários e histórico.
- Conversas, anexos, mensagens padrão, leitura e acompanhamento de entrega.
- Painel da loja e relatórios de canais, atendimentos e desempenho comercial.
- Backoffice para concessionárias, administradores da plataforma, FAQ e chamados de suporte.
- Identidade visual por loja: nome, cores, logos, favicon, horários e regras de comissão.
- Copiloto de IA com dossiê, próxima ação e sugestões de resposta.

O acesso depende da autenticação, do vínculo com a loja e das permissões. O sistema atual não aplica cobrança ou bloqueio por assinatura.

## Desenvolvimento local

Use Node.js 22 e pnpm 10.25.0 para manter o ambiente alinhado aos demais projetos. Os exemplos assumem os três repositórios em pastas irmãs.

Na primeira configuração, copie `.env.example` para `.env` e ajuste as variáveis. Preserve os arquivos de ambiente que já estiverem configurados.

```bash
cp .env.example .env
pnpm install --frozen-lockfile
```

O `postinstall` gera o cliente Prisma e compila o backend. A configuração do pnpm libera os scripts de instalação necessários para bcrypt e Prisma.

O ambiente integrado usa [docker-compose.local.yml](docker-compose.local.yml), com PostgreSQL, Redis, Evolution e Ollama no Colima. Backend, microservice e frontend rodam no host, com seus próprios logs:

```bash
colima start
docker-compose --context colima --env-file .env.local -f docker-compose.local.yml up -d
```

Antes desse comando, configure o `.env.local` conforme o [guia do ambiente local](docker/local/README.md). Ele documenta os segredos compartilhados, os bancos, a geração do Prisma, a inicialização de cada projeto e os logs.

| Recurso               | Endereço local                                                                   |
| --------------------- | -------------------------------------------------------------------------------- |
| Banco do CRM          | `postgresql://autopilot:autopilot@127.0.0.1:55432/autopilot?schema=public`       |
| Banco do microservice | `postgresql://autopilot:autopilot@127.0.0.1:55432/autopilot_micro?schema=public` |
| Redis                 | `127.0.0.1:56379`                                                                |
| Evolution             | `http://localhost:8080`                                                          |
| Ollama                | `http://localhost:11434`                                                         |

As credenciais de banco acima pertencem exclusivamente ao Compose local. O PostgreSQL também cria o banco `evolution` na primeira inicialização do volume.

Para preparar o banco do backend, confira a conexão antes de aplicar as migrações:

```bash
DATABASE_URL='postgresql://autopilot:autopilot@127.0.0.1:55432/autopilot?schema=public' pnpm exec prisma migrate deploy
```

Em um terminal do backend:

```bash
set -a
source .env.local
set +a
export DATABASE_URL='postgresql://autopilot:autopilot@127.0.0.1:55432/autopilot?schema=public'
export REDIS_HOST=127.0.0.1 REDIS_PORT=56379 REDIS_USERNAME='' REDIS_PASSWORD=''
export PORT=3003 FRONTEND_URL=http://localhost:3001 FRONT_URL=http://localhost:3001
export MICROSERVICE_URL=http://localhost:3005 MICROSERVICE_WS_URL=http://localhost:3005/crm
pnpm dev
```

Nest carrega `.env`; `.env.local` é carregado explicitamente pelo terminal. A instalação não cria usuários demonstrativos: o primeiro administrador da plataforma precisa ser provisionado para cadastrar as lojas pelo backoffice.

## AutoPilot IA

O copiloto analisa as últimas 15 mensagens e o identificador externo do anúncio. Retorna dados conhecidos do contato, temperatura percebida, próxima ação e de uma a três respostas sugeridas. O identificador do anúncio não fornece informações de estoque ou características do veículo.

A IA é habilitada quando as três variáveis abaixo estão preenchidas no ambiente do backend:

```dotenv
CHAT_AI_URL=http://127.0.0.1:11434/v1/chat/completions
CHAT_AI_MODEL=gemma3:1b
CHAT_AI_API_KEY=ollama
```

O provedor precisa aceitar Chat Completions com `response_format: json_schema`. No ambiente local, o Ollama ignora a chave `ollama`; o backend exige um valor para habilitar a análise.

```bash
docker-compose --context colima --env-file .env.local -f docker-compose.local.yml exec -T ollama ollama pull gemma3:1b
```

Para trocar de modelo, baixe-o no Ollama, altere `CHAT_AI_MODEL` e reinicie o backend carregando o `.env.local`. Os modelos ficam no volume `ollama_data`. No Colima do Mac a inferência usa CPU; modelos maiores precisam de mais memória. O modelo 1B é uma opção leve para testes e tem limitações de qualidade.

Redis mantém fila, locks e cache; PostgreSQL guarda a análise validada. Falhas são reagendadas e resultados de conversas que receberam novas mensagens são recalculados. A IA não envia mensagens nem altera negociações automaticamente. O vendedor confirma o envio e revisa qualquer aplicação de dados ao atendimento.

## API, autenticação e eventos

- Swagger: `http://localhost:3003/api`; Scalar: `http://localhost:3003/docs`.
- Saúde do processo: `GET /health`.
- Login: `POST /auth/login`; o JWT e o vínculo consultado no banco determinam a loja.
- Conversas: `/chats`, `/chats/:chatId/messages` e `/chats/:chatId/read`.
- Copiloto: `GET /chats/:chatId/copilot`; `POST /chats/:chatId/copilot/refresh` retorna HTTP 202.
- Negociações: `/deals` e subrotas de status, tarefas, visitas e comentários.
- Identidade da loja: `GET /store/customization`; alterações por `PUT` exigem o proprietário.

As respostas seguem `{ message, statusCode, data }`. O frontend conecta ao namespace Socket.io `/chats` com `auth.token`. Eventos incluem `message:received`, `message:status`, `deal:created` e `autopilot:analysis-ready`; a sala é definida pela loja autenticada. A reconexão exige consultar novamente o histórico.

Backend e microservice compartilham `MICROSERVICE_TOKEN` nas chamadas internas. `MICROSERVICE_WS_URL` habilita o transporte Socket.io `/crm`; quando ausente, a entrega usa HTTP. Eventos recebidos são persistidos e deduplicados. Veja o [contrato de comunicação](docs/COMMUNICATION.md) e o [guia de integração](docs/INTEGRATION_GUIDE.md).

## Organização e verificação

`src/core/` contém os módulos de negócio; `src/auth/`, autenticação; `src/persistence/`, banco e arquivos; `src/utils/`, utilitários e e-mails. O esquema e as migrações estão em `prisma/`. Os testes Jest ficam junto do código em arquivos `*.spec.ts`.

```bash
pnpm exec tsc --noEmit
pnpm exec jest --runInBand
pnpm build
pnpm test:migrations
```

Os testes de migração usam PostgreSQL embarcado e isolado. SMTP atende aos fluxos de e-mail; Firebase é usado para arquivos; Novu atende às notificações integradas. Credenciais e contas dos provedores são necessárias para validar essas funcionalidades reais.

O `docker-compose.yml` original continua disponível para executar o backend em container. Para o desenvolvimento integrado no Colima, use o Compose alternativo. Orientações para contribuir estão em [AGENTS.md](AGENTS.md).
