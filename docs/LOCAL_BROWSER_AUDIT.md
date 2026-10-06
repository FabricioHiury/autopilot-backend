# Auditoria local pelo navegador

Data: 2026-10-06. Ambiente: frontend `localhost:3001`, backend `localhost:3003`,
microservice `localhost:3005`; PostgreSQL, Redis e Evolution no Colima.
Navegação e interações executadas com MCP Playwright, usando
`admin@autopilot.local` e `admin.loja@autopilot.local`.

## Cobertura e resultados

| Área | Verificação |
| --- | --- |
| Autenticação | Login dos dois perfis, redirecionamento e logout |
| Backoffice | Dashboard, concessionárias, administradores, filtros, formulário de convite, lista de tickets e FAQs |
| Autorização | Token da loja recebe 403 em `/backoffice/support`, `/backoffice/stores` e `/backoffice/admin`; administrador recebe 200 |
| Navegação móvel | Menus dos dois perfis em 390 × 844; logo do backoffice aponta ao dashboard correto |
| Clientes | Cadastro, detalhes, aniversário, edição e atualização da lista sem recarregar |
| Atendimentos | Pipeline, criação manual, abertura, comentários, tarefa, visita, histórico e listagem de anexos |
| Relatórios | Painel geral, pré-venda, canal e vendedor, incluindo loja sem vendedores |
| Configuração | Dados da loja, gravação do contato, acessos e criação de colaborador |
| Marca | Prévia, cancelamento e gravação da identidade visual |
| Distribuição | Carregamento da configuração e listagem de suspensões |
| Integrações | Estados de configuração e geração do QR Code WhatsApp pela cadeia backend → microservice → Evolution |
| Suporte | Ticket criado pela loja, resposta do backoffice, mudança para Em resolução e leitura pela loja |
| FAQs | Publicação pelo backoffice e leitura do HTML pela loja |
| Chat | Carregamento e estado vazio; nenhum envio a destinatário real |

## Correções realizadas nesta auditoria

- ProfileGuard agora respeita restrições de controller e retorna 403 para perfil incompatível.
- Relatórios vazios retornam dados vazios; gráficos toleram carregamento sem dados e usam o ano atual.
- Parâmetros de administradores, origem dos atendimentos, suspensões e anexos alinhados aos DTOs.
- Criação de atendimento envia `nameComplete`; criação de FAQ usa identificador vazio e enums corretos.
- Leitura de FAQ utiliza o renderizador HTML da publicação, eliminando a tela branca.
- Loja sem contato recebe formulário inicial; gravação usa `idContact` e preserva o identificador retornado.
- Cliente mantém evento de atualização ao fechar o modal, preserva datas de calendário e usa o ID correto para anexos.
- Avatar vazio encerra a resposta HTTP; usuário inexistente retorna 404; avatares de clientes usam a URL do cliente.
- Contexto de eventos compartilhado entre layouts, sem exports inválidos de rota Next.js.
- Integração não configurada preserva `not_configured`; ajustes nos links móveis, rótulos e chaves React.

## Validação automatizada

- Backend: **29 testes**, 9 suítes; `npm run build` passou.
- Frontend: **30 testes**, 10 suítes; `npm run typecheck` passou.
- Microservice: **52 testes**, 11 suítes, incluindo concorrência PostgreSQL e cache Redis; build passou.
- Banco isolado: `autopilot_browser_test`, porta 55432; Redis de teste usa database 15.
- Frontend: `npm run build` bloqueado pelo lint, que aponta muitas pendências em arquivos existentes.
  `npx --no-install next build --no-lint` passou, incluindo tipos e geração de 40 páginas.
  Nenhuma regra de lint foi desativada na configuração do projeto.
- Logs do build: `logs/local/frontend-build.log` e `logs/local/frontend-build-no-lint.log`.

## Limites e dados de teste

Não houve pareamento com celular, envio real de mensagens, autorização Meta/OLX,
upload para armazenamento externo ou envio de recuperação/convite por e-mail.
Esses fluxos precisam das contas e provedores correspondentes. O Novu retornou
422 ao tentar notificar usuários locais; o fluxo CRM permaneceu funcional.
Esta auditoria cobre os fluxos acima e não certifica todas as combinações de dados.

Foram mantidos registros identificados como testes no banco local: cliente
“Cliente Teste Navegador Atualizado”, atendimento “Atendimento Teste Navegador”
com comentário/tarefa/visita, colaborador `usuario.teste@autopilot.local`,
“Ticket Teste Navegador” e “FAQ de validação local”.

Os três servidores continuam locais com logs em `logs/local/`; a infraestrutura
continua no Compose alternativo. Nenhum commit ou deploy foi realizado.
