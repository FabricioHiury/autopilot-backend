-- CreateTable
CREATE TABLE "usuario" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "senha" VARCHAR(200) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "perfil" TEXT NOT NULL DEFAULT 'usuario',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "nome" TEXT,
    "url_foto" TEXT,
    "email_confirmado" BOOLEAN NOT NULL DEFAULT false,
    "token_confirmacao_email" TEXT,
    "token_expira_em" TIMESTAMP(3),
    "expo_push_token" TEXT,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loja" (
    "id" TEXT NOT NULL,
    "id_lojista" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "nome_empresa" TEXT NOT NULL,
    "inscricao_municipal" TEXT,
    "inscricao_estadual" TEXT,
    "regime_tributario" TEXT,
    "portal_da_empresa" TEXT,
    "atividade_principal" TEXT,
    "descricao_atividade" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "url_foto" TEXT,
    "wpp_configurado" BOOLEAN NOT NULL DEFAULT false,
    "wpp_instancia" TEXT,
    "wpp_api_type" TEXT DEFAULT 'unofficial',
    "wpp_official_waba_id" TEXT,
    "wpp_official_phone_number_id" TEXT,
    "wpp_official_access_token" TEXT,
    "wpp_official_verify_token" TEXT,
    "wpp_official_phone" TEXT,
    "distribuicao_automatica" BOOLEAN NOT NULL DEFAULT false,
    "integracoes_liberadas" BOOLEAN DEFAULT false,

    CONSTRAINT "loja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cargo" (
    "id" TEXT NOT NULL,
    "id_loja" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "funcionalidades" TEXT NOT NULL,

    CONSTRAINT "cargo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historico_loja" (
    "id" TEXT NOT NULL,
    "id_loja" TEXT NOT NULL,
    "tipo_evento" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historico_loja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plano" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "descricao" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_preco_stripe" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "periodo" TEXT NOT NULL DEFAULT 'mensal',
    "recursos" JSONB,

    CONSTRAINT "plano_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assinatura" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3),
    "data_aquisicao" TIMESTAMP(3) NOT NULL,
    "data_cancelamento" TIMESTAMP(3),
    "data_renovacao" TIMESTAMP(3),
    "data_fim_carencia" TIMESTAMP(3),
    "forma_pagamento" TEXT NOT NULL,
    "id_loja" TEXT NOT NULL,
    "duracao_plano" INTEGER NOT NULL,
    "id_plano" TEXT NOT NULL,
    "id_assinatura_stripe" TEXT,
    "id_cliente_stripe" TEXT,

    CONSTRAINT "assinatura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historico_pagamento" (
    "id" TEXT NOT NULL,
    "id_assinatura" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valor" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "historico_pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lojista" (
    "id" TEXT NOT NULL,
    "id_usuario" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "device_token" TEXT,
    "token_cliente_meta" TEXT,
    "token_cliente_olx" TEXT,

    CONSTRAINT "lojista_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "endereco_loja" (
    "id" TEXT NOT NULL,
    "id_loja" TEXT NOT NULL,
    "cep" TEXT,
    "uf" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "rua" TEXT,
    "numero" TEXT,
    "bairro" TEXT,
    "complemento" TEXT,
    "filial" BOOLEAN NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "endereco_loja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contato_loja" (
    "id" TEXT NOT NULL,
    "id_loja" TEXT NOT NULL,
    "nome" TEXT,
    "celular" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "site" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contato_loja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colaborador" (
    "id" TEXT NOT NULL,
    "id_loja" TEXT NOT NULL,
    "id_usuario" TEXT NOT NULL,
    "url_foto" TEXT,
    "nome" TEXT,
    "documento_fiscal" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "telefone_complementar" TEXT,
    "whatsapp" TEXT,

    CONSTRAINT "colaborador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cliente" (
    "id" TEXT NOT NULL,
    "id_loja" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo_pessoa" TEXT NOT NULL,
    "documento_fiscal" TEXT NOT NULL,
    "rg" TEXT,
    "estrangeiro" BOOLEAN NOT NULL,
    "genero" TEXT NOT NULL,
    "data_nascimento" TIMESTAMP(3) NOT NULL,
    "observacoes" TEXT,
    "telefone" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "versao" INTEGER NOT NULL,
    "url_avatar" TEXT,

    CONSTRAINT "cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anexo_cliente" (
    "id" TEXT NOT NULL,
    "id_arquivo" TEXT NOT NULL,
    "id_cliente" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3),

    CONSTRAINT "anexo_cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historico_dados_cadastrais_cliente" (
    "id" TEXT NOT NULL,
    "id_cliente" TEXT NOT NULL,
    "versao" INTEGER NOT NULL,
    "atualizacao" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_usuario_editor" TEXT,

    CONSTRAINT "historico_dados_cadastrais_cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cliente_colaborador" (
    "id" TEXT NOT NULL,
    "id_cliente" TEXT NOT NULL,
    "id_colaborador" TEXT NOT NULL,
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cliente_colaborador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "endereco_cliente" (
    "id" TEXT NOT NULL,
    "id_cliente" TEXT NOT NULL,
    "cep" TEXT NOT NULL,
    "uf" TEXT NOT NULL,
    "municipio" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "bairro" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "complemento" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "endereco_cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atendimento" (
    "id" TEXT NOT NULL,
    "id_cliente" TEXT,
    "id_cliente_temporario" TEXT,
    "origem_atendimento" TEXT NOT NULL,
    "temperatura" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "descricao_atendimento" TEXT,
    "observacao" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "id_loja" TEXT,
    "titulo" TEXT,
    "modo_atendimento" TEXT,
    "atendimento_manual" BOOLEAN DEFAULT false,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "atendimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anexo_atendimento" (
    "id" TEXT NOT NULL,
    "id_atendimento" TEXT NOT NULL,
    "id_arquivo" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3),
    "nome_original" TEXT,

    CONSTRAINT "anexo_atendimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cliente_temporario" (
    "id" TEXT NOT NULL,
    "nome" TEXT,
    "email" TEXT,
    "whatsapp" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "id_contato_api_externa" TEXT NOT NULL,
    "canal" TEXT NOT NULL,
    "avatar" TEXT,
    "id_loja" TEXT,

    CONSTRAINT "cliente_temporario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compartilhamento_atendimento" (
    "id" TEXT NOT NULL,
    "id_atendimento" TEXT NOT NULL,
    "id_colaborador" TEXT NOT NULL,
    "id_loja" TEXT NOT NULL,
    "compartilhado_por" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compartilhamento_atendimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atendimento_responsaveis" (
    "id" TEXT NOT NULL,
    "id_atendimento" TEXT NOT NULL,
    "id_colaborador" TEXT NOT NULL,
    "id_loja" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "atendimento_responsaveis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarefas_atendimento" (
    "id" TEXT NOT NULL,
    "id_atendimento" TEXT NOT NULL,
    "id_responsavel" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "concluida" BOOLEAN NOT NULL DEFAULT false,
    "hora_fim" TEXT,
    "hora_inicio" TEXT,
    "observacoes" TEXT,

    CONSTRAINT "tarefas_atendimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitas_atendimento" (
    "id" TEXT NOT NULL,
    "id_atendimento" TEXT NOT NULL,
    "observacoes" TEXT,
    "tipo" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "hora_inicio" TEXT NOT NULL,
    "hora_fim" TEXT,
    "concluida" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visitas_atendimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comentarios_atendimento" (
    "id" TEXT NOT NULL,
    "id_atendimento" TEXT NOT NULL,
    "comentario" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "id_usuario" TEXT NOT NULL,
    "motivo_perdido" TEXT,
    "sub_motivo_perdido" TEXT,

    CONSTRAINT "comentarios_atendimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suspensao_atendimento" (
    "id" TEXT NOT NULL,
    "id_usuario" TEXT NOT NULL,
    "descricao" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "atendimentoId" TEXT,

    CONSTRAINT "suspensao_atendimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_atividades_atendimento" (
    "id" TEXT NOT NULL,
    "id_atendimento" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dados_antigos" JSONB,
    "dados_novos" JSONB,
    "id_usuario" TEXT,
    "tipo_evento" TEXT NOT NULL,

    CONSTRAINT "log_atividades_atendimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arquivos" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "entidade_id" TEXT NOT NULL,
    "entidade" VARCHAR(100) NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "validade" TIMESTAMP(3) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editado_em" TIMESTAMP(3),
    "versao" INTEGER NOT NULL DEFAULT 0,
    "tamanho" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "arquivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arquivos_uuid" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "validade" TIMESTAMP(3) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editado_em" TIMESTAMP(3),
    "versao" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "arquivos_uuid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissoes" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "funcionalidade" TEXT NOT NULL,

    CONSTRAINT "permissoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacao" (
    "id" TEXT NOT NULL,
    "id_usuario" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_referencia" TEXT,

    CONSTRAINT "notificacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat" (
    "id" TEXT NOT NULL,
    "id_loja" TEXT NOT NULL,
    "id_cliente" TEXT,
    "id_cliente_temporario" TEXT,
    "idAtendimento" TEXT,
    "id_destinario_api_externa" TEXT NOT NULL,
    "canal" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "id_anuncio_externo" TEXT,
    "arquivado" BOOLEAN NOT NULL DEFAULT false,
    "ultima_mensagem_cliente_em" TIMESTAMP(3),

    CONSTRAINT "chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_responsaveis" (
    "id" TEXT NOT NULL,
    "id_chat" TEXT NOT NULL,
    "id_colaborador" TEXT NOT NULL,
    "id_loja" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_responsaveis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anexo_chat" (
    "id" TEXT NOT NULL,
    "id_chat" TEXT NOT NULL,
    "id_arquivo" TEXT NOT NULL,
    "tipo_anexo" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3),

    CONSTRAINT "anexo_chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensagem" (
    "id" TEXT NOT NULL,
    "idUsuario" TEXT,
    "id_chat" TEXT NOT NULL,
    "id_destinario_api_externa" TEXT,
    "id_mensagem_externa" TEXT,
    "id_msg_ref_ext" TEXT,
    "anexo_mensagem" TEXT,
    "tipo_anexo" TEXT,
    "tipo" TEXT,
    "reaction" TEXT,
    "conteudo" TEXT,
    "canal" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remetente" TEXT NOT NULL,
    "lido" BOOLEAN NOT NULL DEFAULT true,
    "origemInstagram" TEXT,
    "metadados" JSONB,

    CONSTRAINT "mensagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensagem_padrao" (
    "id" TEXT NOT NULL,
    "id_loja" TEXT NOT NULL,
    "titulo" VARCHAR(100) NOT NULL,
    "conteudo" VARCHAR(1000) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mensagem_padrao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensagem_pessoa" (
    "id" TEXT NOT NULL,
    "id_mensagem" TEXT NOT NULL,
    "nome" TEXT,
    "avatar" TEXT,

    CONSTRAINT "mensagem_pessoa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faq" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'rascunho',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "resumo" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "faq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags_faq" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tags_faq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_suporte" (
    "id" TEXT NOT NULL,
    "id_usuario" TEXT NOT NULL,
    "id_loja" TEXT,
    "titulo" TEXT NOT NULL,
    "assunto" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "prioridade" TEXT NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'aberto',
    "tipo" TEXT,
    "categoria" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_suporte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_historico" (
    "id" TEXT NOT NULL,
    "evento" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "id_ticket" TEXT NOT NULL,
    "id_usuario" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_historico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resposta_ticket" (
    "id" TEXT NOT NULL,
    "id_ticket" TEXT NOT NULL,
    "id_usuario" TEXT NOT NULL,
    "resposta" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resposta_ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anexo_suporte" (
    "id" TEXT NOT NULL,
    "id_resposta" TEXT,
    "id_arquivo" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3),
    "id_ticket" TEXT NOT NULL,
    "nome_original" TEXT,

    CONSTRAINT "anexo_suporte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imagem_publica" (
    "id" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3),
    "id_arquivo" TEXT,

    CONSTRAINT "imagem_publica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "cor" TEXT,
    "descricao" TEXT,
    "id_loja" TEXT NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atendimento_tag" (
    "id" TEXT NOT NULL,
    "id_atendimento" TEXT NOT NULL,
    "id_tag" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "atendimento_tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_cargo_colaborador" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_faq_tags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "loja_id_lojista_key" ON "loja"("id_lojista");

-- CreateIndex
CREATE UNIQUE INDEX "loja_cnpj_key" ON "loja"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "cargo_id_loja_cargo_key" ON "cargo"("id_loja", "cargo");

-- CreateIndex
CREATE UNIQUE INDEX "plano_nome_key" ON "plano"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "assinatura_id_loja_key" ON "assinatura"("id_loja");

-- CreateIndex
CREATE UNIQUE INDEX "assinatura_id_assinatura_stripe_key" ON "assinatura"("id_assinatura_stripe");

-- CreateIndex
CREATE UNIQUE INDEX "lojista_id_usuario_key" ON "lojista"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "colaborador_id_usuario_key" ON "colaborador"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "colaborador_documento_fiscal_key" ON "colaborador"("documento_fiscal");

-- CreateIndex
CREATE UNIQUE INDEX "colaborador_id_loja_documento_fiscal_key" ON "colaborador"("id_loja", "documento_fiscal");

-- CreateIndex
CREATE UNIQUE INDEX "cliente_documento_fiscal_id_loja_key" ON "cliente"("documento_fiscal", "id_loja");

-- CreateIndex
CREATE UNIQUE INDEX "cliente_email_id_loja_key" ON "cliente"("email", "id_loja");

-- CreateIndex
CREATE UNIQUE INDEX "anexo_cliente_id_arquivo_key" ON "anexo_cliente"("id_arquivo");

-- CreateIndex
CREATE UNIQUE INDEX "endereco_cliente_id_cliente_key" ON "endereco_cliente"("id_cliente");

-- CreateIndex
CREATE INDEX "atendimento_status_idx" ON "atendimento"("status");

-- CreateIndex
CREATE INDEX "atendimento_atualizado_em_idx" ON "atendimento"("atualizado_em");

-- CreateIndex
CREATE INDEX "atendimento_id_loja_criado_em_idx" ON "atendimento"("id_loja", "criado_em");

-- CreateIndex
CREATE INDEX "atendimento_id_loja_status_criado_em_idx" ON "atendimento"("id_loja", "status", "criado_em");

-- CreateIndex
CREATE INDEX "atendimento_id_loja_modo_atendimento_criado_em_idx" ON "atendimento"("id_loja", "modo_atendimento", "criado_em");

-- CreateIndex
CREATE INDEX "atendimento_origem_atendimento_idx" ON "atendimento"("origem_atendimento");

-- CreateIndex
CREATE INDEX "atendimento_temperatura_idx" ON "atendimento"("temperatura");

-- CreateIndex
CREATE UNIQUE INDEX "anexo_atendimento_id_arquivo_key" ON "anexo_atendimento"("id_arquivo");

-- CreateIndex
CREATE INDEX "atendimento_responsaveis_id_colaborador_id_atendimento_idx" ON "atendimento_responsaveis"("id_colaborador", "id_atendimento");

-- CreateIndex
CREATE INDEX "visitas_atendimento_id_atendimento_concluida_idx" ON "visitas_atendimento"("id_atendimento", "concluida");

-- CreateIndex
CREATE INDEX "comentarios_atendimento_id_atendimento_motivo_perdido_idx" ON "comentarios_atendimento"("id_atendimento", "motivo_perdido");

-- CreateIndex
CREATE INDEX "log_atividades_atendimento_id_atendimento_tipo_evento_idx" ON "log_atividades_atendimento"("id_atendimento", "tipo_evento");

-- CreateIndex
CREATE INDEX "log_atividades_atendimento_id_atendimento_criado_em_idx" ON "log_atividades_atendimento"("id_atendimento", "criado_em");

-- CreateIndex
CREATE INDEX "chat_id_loja_canal_id_destinario_api_externa_idx" ON "chat"("id_loja", "canal", "id_destinario_api_externa");

-- CreateIndex
CREATE INDEX "chat_id_loja_canal_id_destinario_api_externa_idAtendimento_idx" ON "chat"("id_loja", "canal", "id_destinario_api_externa", "idAtendimento");

-- CreateIndex
CREATE INDEX "chat_criado_em_idx" ON "chat"("criado_em");

-- CreateIndex
CREATE UNIQUE INDEX "chat_id_cliente_id_loja_canal_key" ON "chat"("id_cliente", "id_loja", "canal");

-- CreateIndex
CREATE UNIQUE INDEX "chat_id_cliente_temporario_id_loja_canal_key" ON "chat"("id_cliente_temporario", "id_loja", "canal");

-- CreateIndex
CREATE UNIQUE INDEX "chat_responsaveis_id_chat_id_colaborador_key" ON "chat_responsaveis"("id_chat", "id_colaborador");

-- CreateIndex
CREATE UNIQUE INDEX "anexo_chat_id_arquivo_key" ON "anexo_chat"("id_arquivo");

-- CreateIndex
CREATE UNIQUE INDEX "mensagem_pessoa_id_mensagem_key" ON "mensagem_pessoa"("id_mensagem");

-- CreateIndex
CREATE UNIQUE INDEX "faq_slug_key" ON "faq"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tags_faq_nome_key" ON "tags_faq"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "anexo_suporte_id_arquivo_key" ON "anexo_suporte"("id_arquivo");

-- CreateIndex
CREATE UNIQUE INDEX "imagem_publica_id_arquivo_key" ON "imagem_publica"("id_arquivo");

-- CreateIndex
CREATE UNIQUE INDEX "tags_nome_id_loja_key" ON "tags"("nome", "id_loja");

-- CreateIndex
CREATE UNIQUE INDEX "atendimento_tag_id_atendimento_id_tag_key" ON "atendimento_tag"("id_atendimento", "id_tag");

-- CreateIndex
CREATE UNIQUE INDEX "_cargo_colaborador_AB_unique" ON "_cargo_colaborador"("A", "B");

-- CreateIndex
CREATE INDEX "_cargo_colaborador_B_index" ON "_cargo_colaborador"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_faq_tags_AB_unique" ON "_faq_tags"("A", "B");

-- CreateIndex
CREATE INDEX "_faq_tags_B_index" ON "_faq_tags"("B");

-- AddForeignKey
ALTER TABLE "loja" ADD CONSTRAINT "loja_id_lojista_fkey" FOREIGN KEY ("id_lojista") REFERENCES "lojista"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargo" ADD CONSTRAINT "cargo_id_loja_fkey" FOREIGN KEY ("id_loja") REFERENCES "loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_loja" ADD CONSTRAINT "historico_loja_id_loja_fkey" FOREIGN KEY ("id_loja") REFERENCES "loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assinatura" ADD CONSTRAINT "assinatura_id_loja_fkey" FOREIGN KEY ("id_loja") REFERENCES "loja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assinatura" ADD CONSTRAINT "assinatura_id_plano_fkey" FOREIGN KEY ("id_plano") REFERENCES "plano"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_pagamento" ADD CONSTRAINT "historico_pagamento_id_assinatura_fkey" FOREIGN KEY ("id_assinatura") REFERENCES "assinatura"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lojista" ADD CONSTRAINT "lojista_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "endereco_loja" ADD CONSTRAINT "endereco_loja_id_loja_fkey" FOREIGN KEY ("id_loja") REFERENCES "loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contato_loja" ADD CONSTRAINT "contato_loja_id_loja_fkey" FOREIGN KEY ("id_loja") REFERENCES "loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colaborador" ADD CONSTRAINT "colaborador_id_loja_fkey" FOREIGN KEY ("id_loja") REFERENCES "loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colaborador" ADD CONSTRAINT "colaborador_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cliente" ADD CONSTRAINT "cliente_id_loja_fkey" FOREIGN KEY ("id_loja") REFERENCES "loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anexo_cliente" ADD CONSTRAINT "anexo_cliente_id_arquivo_fkey" FOREIGN KEY ("id_arquivo") REFERENCES "arquivos_uuid"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anexo_cliente" ADD CONSTRAINT "anexo_cliente_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_dados_cadastrais_cliente" ADD CONSTRAINT "historico_dados_cadastrais_cliente_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cliente_colaborador" ADD CONSTRAINT "cliente_colaborador_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cliente_colaborador" ADD CONSTRAINT "cliente_colaborador_id_colaborador_fkey" FOREIGN KEY ("id_colaborador") REFERENCES "colaborador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "endereco_cliente" ADD CONSTRAINT "endereco_cliente_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atendimento" ADD CONSTRAINT "atendimento_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atendimento" ADD CONSTRAINT "atendimento_id_cliente_temporario_fkey" FOREIGN KEY ("id_cliente_temporario") REFERENCES "cliente_temporario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atendimento" ADD CONSTRAINT "atendimento_id_loja_fkey" FOREIGN KEY ("id_loja") REFERENCES "loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anexo_atendimento" ADD CONSTRAINT "anexo_atendimento_id_arquivo_fkey" FOREIGN KEY ("id_arquivo") REFERENCES "arquivos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anexo_atendimento" ADD CONSTRAINT "anexo_atendimento_id_atendimento_fkey" FOREIGN KEY ("id_atendimento") REFERENCES "atendimento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compartilhamento_atendimento" ADD CONSTRAINT "compartilhamento_atendimento_id_atendimento_fkey" FOREIGN KEY ("id_atendimento") REFERENCES "atendimento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compartilhamento_atendimento" ADD CONSTRAINT "compartilhamento_atendimento_id_colaborador_fkey" FOREIGN KEY ("id_colaborador") REFERENCES "colaborador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compartilhamento_atendimento" ADD CONSTRAINT "compartilhamento_atendimento_id_loja_fkey" FOREIGN KEY ("id_loja") REFERENCES "loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atendimento_responsaveis" ADD CONSTRAINT "atendimento_responsaveis_id_atendimento_fkey" FOREIGN KEY ("id_atendimento") REFERENCES "atendimento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atendimento_responsaveis" ADD CONSTRAINT "atendimento_responsaveis_id_colaborador_fkey" FOREIGN KEY ("id_colaborador") REFERENCES "colaborador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atendimento_responsaveis" ADD CONSTRAINT "atendimento_responsaveis_id_loja_fkey" FOREIGN KEY ("id_loja") REFERENCES "loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefas_atendimento" ADD CONSTRAINT "tarefas_atendimento_id_atendimento_fkey" FOREIGN KEY ("id_atendimento") REFERENCES "atendimento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefas_atendimento" ADD CONSTRAINT "tarefas_atendimento_id_responsavel_fkey" FOREIGN KEY ("id_responsavel") REFERENCES "colaborador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitas_atendimento" ADD CONSTRAINT "visitas_atendimento_id_atendimento_fkey" FOREIGN KEY ("id_atendimento") REFERENCES "atendimento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios_atendimento" ADD CONSTRAINT "comentarios_atendimento_id_atendimento_fkey" FOREIGN KEY ("id_atendimento") REFERENCES "atendimento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios_atendimento" ADD CONSTRAINT "comentarios_atendimento_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suspensao_atendimento" ADD CONSTRAINT "suspensao_atendimento_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suspensao_atendimento" ADD CONSTRAINT "suspensao_atendimento_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_atividades_atendimento" ADD CONSTRAINT "log_atividades_atendimento_id_atendimento_fkey" FOREIGN KEY ("id_atendimento") REFERENCES "atendimento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_atividades_atendimento" ADD CONSTRAINT "log_atividades_atendimento_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissoes" ADD CONSTRAINT "permissoes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacao" ADD CONSTRAINT "notificacao_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat" ADD CONSTRAINT "chat_idAtendimento_fkey" FOREIGN KEY ("idAtendimento") REFERENCES "atendimento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat" ADD CONSTRAINT "chat_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat" ADD CONSTRAINT "chat_id_cliente_temporario_fkey" FOREIGN KEY ("id_cliente_temporario") REFERENCES "cliente_temporario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat" ADD CONSTRAINT "chat_id_loja_fkey" FOREIGN KEY ("id_loja") REFERENCES "loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_responsaveis" ADD CONSTRAINT "chat_responsaveis_id_chat_fkey" FOREIGN KEY ("id_chat") REFERENCES "chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_responsaveis" ADD CONSTRAINT "chat_responsaveis_id_colaborador_fkey" FOREIGN KEY ("id_colaborador") REFERENCES "colaborador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_responsaveis" ADD CONSTRAINT "chat_responsaveis_id_loja_fkey" FOREIGN KEY ("id_loja") REFERENCES "loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anexo_chat" ADD CONSTRAINT "anexo_chat_id_arquivo_fkey" FOREIGN KEY ("id_arquivo") REFERENCES "arquivos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anexo_chat" ADD CONSTRAINT "anexo_chat_id_chat_fkey" FOREIGN KEY ("id_chat") REFERENCES "chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagem" ADD CONSTRAINT "mensagem_idUsuario_fkey" FOREIGN KEY ("idUsuario") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagem" ADD CONSTRAINT "mensagem_id_chat_fkey" FOREIGN KEY ("id_chat") REFERENCES "chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagem_padrao" ADD CONSTRAINT "mensagem_padrao_id_loja_fkey" FOREIGN KEY ("id_loja") REFERENCES "loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagem_pessoa" ADD CONSTRAINT "mensagem_pessoa_id_mensagem_fkey" FOREIGN KEY ("id_mensagem") REFERENCES "mensagem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_suporte" ADD CONSTRAINT "ticket_suporte_id_loja_fkey" FOREIGN KEY ("id_loja") REFERENCES "loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_suporte" ADD CONSTRAINT "ticket_suporte_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_historico" ADD CONSTRAINT "ticket_historico_id_ticket_fkey" FOREIGN KEY ("id_ticket") REFERENCES "ticket_suporte"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_historico" ADD CONSTRAINT "ticket_historico_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resposta_ticket" ADD CONSTRAINT "resposta_ticket_id_ticket_fkey" FOREIGN KEY ("id_ticket") REFERENCES "ticket_suporte"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resposta_ticket" ADD CONSTRAINT "resposta_ticket_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anexo_suporte" ADD CONSTRAINT "anexo_suporte_id_arquivo_fkey" FOREIGN KEY ("id_arquivo") REFERENCES "arquivos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anexo_suporte" ADD CONSTRAINT "anexo_suporte_id_resposta_fkey" FOREIGN KEY ("id_resposta") REFERENCES "resposta_ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anexo_suporte" ADD CONSTRAINT "anexo_suporte_id_ticket_fkey" FOREIGN KEY ("id_ticket") REFERENCES "ticket_suporte"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imagem_publica" ADD CONSTRAINT "imagem_publica_id_arquivo_fkey" FOREIGN KEY ("id_arquivo") REFERENCES "arquivos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_id_loja_fkey" FOREIGN KEY ("id_loja") REFERENCES "loja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atendimento_tag" ADD CONSTRAINT "atendimento_tag_id_atendimento_fkey" FOREIGN KEY ("id_atendimento") REFERENCES "atendimento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atendimento_tag" ADD CONSTRAINT "atendimento_tag_id_tag_fkey" FOREIGN KEY ("id_tag") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_cargo_colaborador" ADD CONSTRAINT "_cargo_colaborador_A_fkey" FOREIGN KEY ("A") REFERENCES "cargo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_cargo_colaborador" ADD CONSTRAINT "_cargo_colaborador_B_fkey" FOREIGN KEY ("B") REFERENCES "colaborador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_faq_tags" ADD CONSTRAINT "_faq_tags_A_fkey" FOREIGN KEY ("A") REFERENCES "faq"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_faq_tags" ADD CONSTRAINT "_faq_tags_B_fkey" FOREIGN KEY ("B") REFERENCES "tags_faq"("id") ON DELETE CASCADE ON UPDATE CASCADE;

