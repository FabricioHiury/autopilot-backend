import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { USUARIO_PERFIL } from '../usuario/enum/perfil.enum';
import {
  AppErrorBadRequest,
  AppErrorConflict,
  AppErrorInternal,
  AppErrorNotFound,
} from 'src/utils/errors/app-errors';
import {
  CadastroEnderecoDto,
  CadastroLojistaDto,
  EditarContatoDto,
  EditarLojaDto,
  ListarLojaDto,
} from './dto/loja.dto';
import { Prisma } from '@prisma/client';
import { STATUS_CLIENTE } from './modules/cliente/enum/cliente.enum';
import { PERMISSOES_LOJA } from '../usuario/enum/permissoes_funcionalidades.enum';
import axios from 'axios';
import * as bcrypt from 'bcrypt';
import { MailService } from 'src/utils/mail/mail.service';
import { FileService } from 'src/persistence/files/file/file.service';

@Injectable()
export class LojaService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly emailService: MailService,
    private readonly fileService: FileService,
  ) { }

  private instanciaAxios() {
    return axios.create({
      baseURL: process.env.API_BASE_URL.trim(),
      headers: {
        'x-micro-token': process.env.API_KEY,
      },
    });
  }

  async deletarEndereco(idLoja: string, idEndereco: string) {
    const enderecoLoja = await this.pegarEnderecoPorId(idEndereco);
    if (!enderecoLoja) {
      throw new AppErrorNotFound('Endereço com este ID não existe');
    }
    return await this.prismaService.enderecoLoja.delete({
      where: {
        id: idEndereco,
        idLoja: idLoja,
      },
    });
  }

  async cadastrarLojista(dto: CadastroLojistaDto) {
    try {
      const hash = await bcrypt.hash(dto.senha, 10);
      const confirmationToken = this.emailService.generateEmailConfirmationToken();
      const expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + 24);

      const name = dto.responsavel ? dto.responsavel : dto.nome;

      const result = await this.prismaService.$transaction(async (prisma) => {
        const usuario = await prisma.usuario.create({
          data: {
            email: dto.email,
            senha: hash,
            nome: name,
            perfil: USUARIO_PERFIL.LOJISTA,
            status: 'pendente',
            emailConfirmado: false,
            tokenConfirmacaoEmail: confirmationToken,
            tokenExpiraEm: expirationDate,
          },
          select: {
            id: true,
            email: true,
            nome: true,
            status: true,
            perfil: true,
            criadoEm: true,
            atualizadoEm: true
          }
        });

        const lojista = await prisma.lojista.create({
          data: {
            idUsuario: usuario.id,
            status: 'pendente',
          },
          select: {
            id: true,
          },
        });

        const loja = await prisma.loja.create({
          data: {
            idLojista: lojista.id,
            cnpj: dto.documentoFiscal,
            nomeEmpresa: dto.nome,
          },
        });

        await prisma.enderecoLoja.create({
          data: {
            idLoja: loja.id,
            cidade: dto.cidade,
            uf: dto.uf,
            rua: dto.rua || '',
            bairro: dto.bairro || '',
            numero: dto.numero || null,
            complemento: dto.complemento || null,
            cep: dto.cep || null,
            filial: false,
          },
        });

        await prisma.contatoLoja.create({
          data: {
            idLoja: loja.id,
            nome: dto.responsavel || null,
            celular: dto.telefone || null,
            telefone: dto.telefone || null,
            email: dto.email,
          },
        });

        return {
          usuario,
          confirmationToken
        };
      }, {
        timeout: 120000
      });

      await this.emailService.sendEmailConfirmation(
        dto.nome,
        dto.email,
        result.confirmationToken,
      );

      return {
        message: 'Cadastro realizado com sucesso! Verifique seu email para confirmar a conta.',
        email: dto.email,
      };
    } catch (error) {
      console.log(error);
      if (error instanceof AppErrorConflict || error instanceof AppErrorNotFound) {
        throw error;
      }

      if (error instanceof AppErrorInternal) {
        throw error;
      }

      throw new AppErrorInternal('Falha no cadastro do lojista. Por favor, verifique os dados e tente novamente.');
    }
  }

  async confirmarEmail(token: string) {
    try {
      const usuarioComRelacionamentos = await this.prismaService.usuario.findFirst({
        where: {
          tokenConfirmacaoEmail: token,
          tokenExpiraEm: { gte: new Date() },
        },
        include: {
          lojista: {
            include: {
              loja: true,
            },
          },
        },
      });

      if (!usuarioComRelacionamentos) {
        throw new AppErrorNotFound('Token inválido ou expirado.');
      }

      const lojista = usuarioComRelacionamentos.lojista;
      const loja = lojista?.loja;
      if (!lojista || !loja) {
        throw new AppErrorNotFound('Loja não encontrada para este usuário.');
      }

      const result = await this.prismaService.$transaction(async (prisma) => {
        const usuario = await prisma.usuario.findUnique({
          where: { id: usuarioComRelacionamentos.id },
        });
        if (!usuario) {
          throw new AppErrorNotFound('Usuário não encontrado.');
        }

        if (usuario.status !== 'ativo' || !usuario.emailConfirmado) {
          await prisma.usuario.update({
            where: { id: usuario.id },
            data: {
              status: 'ativo',
              emailConfirmado: true,
              tokenConfirmacaoEmail: null,
              tokenExpiraEm: null,
            },
          });
        } else {
          if (usuario.tokenConfirmacaoEmail || usuario.tokenExpiraEm) {
            await prisma.usuario.update({
              where: { id: usuario.id },
              data: {
                tokenConfirmacaoEmail: null,
                tokenExpiraEm: null,
              },
            });
          }
        }

        if (lojista.status === 'pendente') {
          await prisma.lojista.update({
            where: { id: lojista.id },
            data: { status: 'ativo' },
          });
        }

        const funcionalidades = Object.values(PERMISSOES_LOJA);
        await prisma.permissao.createMany({
          data: funcionalidades.map((funcionalidade: string) => ({
            idUsuario: usuario.id,
            funcionalidade,
            status: 'ativo',
          })),
          skipDuplicates: true,
        });

        const funcionalidadesPadrao = [
          PERMISSOES_LOJA.LOJA_CADASTRAR_EDITAR_CLIENTES,
          PERMISSOES_LOJA.LOJA_EDITAR_EXCLUIR_ATENDIMENTO,
          PERMISSOES_LOJA.LOJA_PESQUISAR_CLIENTES,
          PERMISSOES_LOJA.LOJA_RESPONDER_CHAT,
          PERMISSOES_LOJA.LOJA_VER_ATENDIMENTOS,
          PERMISSOES_LOJA.LOJA_VER_DASHBOARD,
          PERMISSOES_LOJA.LOJA_VINCULAR_ATENDIMENTO_USUARIO,
          PERMISSOES_LOJA.LOJA_VER_CHAT,
          PERMISSOES_LOJA.LOJA_GERENCIAR_SUSPENSOES,
          PERMISSOES_LOJA.LOJA_VER_MENSAGENS_PADRAO,
          PERMISSOES_LOJA.LOJA_CRIAR_MENSAGEM_PADRAO,
          PERMISSOES_LOJA.LOJA_EDITAR_MENSAGEM_PADRAO,
          PERMISSOES_LOJA.LOJA_DELETAR_MENSAGEM_PADRAO,
        ];
        const cargosParaCriar = ['Pré-vendedor', 'Vendedor', 'Gerente', 'Atendente'];

        for (const cargoNome of cargosParaCriar) {
          const funcionalidadesCargo =
            cargoNome === 'Pré-vendedor'
              ? [...funcionalidadesPadrao, PERMISSOES_LOJA.LOJA_PRE_VENDEDOR_FINALIZAR_ATENDIMENTO]
              : funcionalidadesPadrao;
          await prisma.cargo.upsert({
            where: { idLoja_cargo: { idLoja: loja.id, cargo: cargoNome } },
            update: {
              funcionalidades: funcionalidadesCargo.join(','),
            },
            create: {
              idLoja: loja.id,
              cargo: cargoNome,
              funcionalidades: funcionalidadesCargo.join(','),
            },
          });
        }

        const cargos = await prisma.cargo.findMany({ where: { idLoja: loja.id } });

        await prisma.colaborador.upsert({
          where: { idUsuario: usuario.id },
          update: {
            idLoja: loja.id,
            nome: usuario.nome,
            documentoFiscal: loja.cnpj,
            status: 'ativo',
            cargos: {
              set: [], // limpa vínculos anteriores
              connect: cargos.map((c) => ({ id: c.id })),
            },
          },
          create: {
            idLoja: loja.id,
            idUsuario: usuario.id,
            nome: usuario.nome,
            documentoFiscal: loja.cnpj,
            status: 'ativo',
            cargos: {
              connect: cargos.map((c) => ({ id: c.id })),
            },
          },
        });

        return {
          usuario,
          lojaId: loja.id,
          loginUrl: `${process.env.FRONTEND_URL}/login`,
        };
      }, { timeout: 120000 });

      try {
        const response = await this.instanciaAxios().post(`/integrations/${result.lojaId}`);
        if (!response || response.status < 200 || response.status >= 300) {
          throw new Error(`Falha na integração externa. Status: ${response?.status ?? 'desconhecido'}`);
        }
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data ||
          err?.message ||
          '';

        if (typeof msg === 'string' && msg.includes('This store has already been saved in the system.')) {
        } else {
          console.error('Erro na integração externa:', err);
        }
      }

      try {
        await this.emailService.sendUserRegistrationEmail(
          usuarioComRelacionamentos.nome,
          usuarioComRelacionamentos.email,
          result.loginUrl,
        );
      } catch (e) {
        console.error('Falha ao enviar e-mail de registro:', e);
      }

      return {
        message: 'Email confirmado com sucesso! Sua conta foi ativada.',
        loginUrl: result.loginUrl,
      };
    } catch (error) {
      if (error instanceof AppErrorNotFound) {
        throw error;
      }
      throw new AppErrorInternal('Erro ao confirmar email.');
    }
  }

  async cadastrarEndereco(params: CadastroEnderecoDto, idLoja: string) {
    const paramsSemIdEndereco = { ...params, idEndereco: undefined };

    if (!params.idEndereco) {
      return await this.prismaService.enderecoLoja.create({
        data: {
          idLoja,
          ...paramsSemIdEndereco,
        },
      });
    }

    const endereco = await this.prismaService.enderecoLoja.findUnique({
      where: {
        id: params.idEndereco,
        idLoja,
      },
    });

    if (!endereco) {
      throw new AppErrorNotFound('Endereço não encontrado.');
    }

    return await this.prismaService.enderecoLoja.update({
      where: {
        id: params.idEndereco,
        idLoja,
      },
      data: {
        ...paramsSemIdEndereco,
      },
    });
  }

  async cadastrarContato(idLoja: string, contatoDto: EditarContatoDto) {
    const paramsSemIdContato = { ...contatoDto, idContato: undefined };

    if (!contatoDto.idContato) {
      return await this.prismaService.contatoLoja.create({
        data: {
          idLoja: idLoja,
          ...paramsSemIdContato,
        },
      });
    }

    const contato = await this.prismaService.contatoLoja.findUnique({
      where: {
        id: contatoDto.idContato,
        idLoja,
      },
    });

    if (!contato) {
      throw new AppErrorNotFound('Contato não encontrado.');
    }

    return await this.prismaService.contatoLoja.update({
      where: {
        id: contatoDto.idContato,
        idLoja,
      },
      data: {
        ...paramsSemIdContato,
      },
    });
  }

  async pegarLojaPorId(id: string) {
    return await this.prismaService.loja.findUnique({
      where: {
        id: id,
      },
      select: {
        urlFoto: true,
        enderecoLoja: true,
        assinatura: true,
        lojista: {
          select: {
            usuario: {
              select: {
                email: true,
                nome: true,
                criadoEm: true,
              },
            },
          },
        },
        nomeEmpresa: true,
        atendimentoResponsaveis: true,
        atividadePrincipal: true,
        atualizadoEm: true,
        cnpj: true,
        colaborador: true,
        contatoLoja: true,
        descricaoAtividade: true,
        inscricaoEstadual: true,
        inscricaoMunicipal: true,
        portalEmpresa: true,
        regimeTributario: true,
      },
    });
  }

  async pegarEnderecoPorId(idEndereco: string) {
    return await this.prismaService.enderecoLoja.findUnique({
      where: {
        id: idEndereco,
      },
    });
  }

  async listarLojista(lista: ListarLojaDto) {
    const pagina = parseInt(lista.pagina, 10) || 1;
    const quantidade = parseInt(lista.quantidade, 10) || 20;
    const pesquisa = lista.pesquisa ? lista.pesquisa : '';
    const where: Prisma.LojaWhereInput = {
      nomeEmpresa: {
        contains: pesquisa,
        mode: 'insensitive',
      },
    };

    const lojas = await this.prismaService.loja.findMany({
      skip: (pagina - 1) * quantidade,
      take: quantidade,
      where: where,
      select: {
        id: true,
        nomeEmpresa: true,
        cnpj: true,
        enderecoLoja: true,
        contatoLoja: true,
        assinatura: true,
        lojista: {
          select: {
            usuario: {
              select: {
                email: true,
                nome: true,
                criadoEm: true,
              },
            },
          },
        },
      },
    });
    const totalLojas = await this.prismaService.loja.count({
      where: where,
    });
    return {
      lojas: lojas,
      pagina,
      quantidade,
      pesquisa,
      totalLojas,
      totalPaginas: Math.ceil(totalLojas / quantidade),
    };
  }

  async editarLoja(editarLoja: EditarLojaDto, idLoja: string) {
    if (editarLoja.cnpj) {
      const cnpjExiste = await this.prismaService.loja.findUnique({
        where: {
          cnpj: editarLoja.cnpj,
        },
      });

      if (cnpjExiste && cnpjExiste.id !== idLoja) {
        throw new AppErrorConflict('CNPJ já cadastrado');
      }
    }

    return await this.prismaService.loja.update({
      where: { id: idLoja },
      data: { ...editarLoja },
    });
  }

  async pegarLojistaPorIdUsuario(id: string) {
    const user = await this.prismaService.usuario.findUnique({
      where: { id: id },
      select: { lojista: true },
    });
    if (!user || !user.lojista) {
      throw new AppErrorNotFound(
        'Lojista não encontrado com esse id de usuário',
      );
    }
    return await this.prismaService.lojista.findUnique({
      where: {
        id: user.lojista.id,
      },
      select: {
        id: true,
        status: true,
        loja: true,
      },
    });
  }

  async pegarLojaPorIdUsuario(id: string) {
    const lojista = await this.prismaService.usuario.findUnique({
      where: { id: id },
      select: { lojista: true },
    });

    if (!lojista || !lojista.lojista) {
      throw new AppErrorNotFound('Loja não encontrado com esse id de usuário');
    }

    const loja = await this.prismaService.loja.findUnique({
      where: { idLojista: lojista.lojista.id },
      select: {
        id: true,
        contatoLoja: true,
        atendimentoResponsaveis: true,
        atividadePrincipal: true,
        atualizadoEm: true,
        cnpj: true,
        descricaoAtividade: true,
        enderecoLoja: true,
        nomeEmpresa: true,
        inscricaoEstadual: true,
        inscricaoMunicipal: true,
        portalEmpresa: true,
        regimeTributario: true,
      },
    });
    return loja;
  }

  async statusAssinatura(idLoja: string) {
    const loja = await this.prismaService.loja.findUnique({
      where: {
        id: idLoja,
      },
      include: {
        assinatura: true,
      },
    });

    if (!loja) {
      throw new AppErrorNotFound('Loja não encontrada');
    }

    if (!loja.assinatura || loja.assinatura?.status !== STATUS_CLIENTE.ATIVO) {
      return false;
    }

    return true;
  }

  async pegarAcessoPorIdUsuario(idUsuario: string, idLoja: string) {
    const usuario = await this.prismaService.usuario.findUnique({
      where: { id: idUsuario },
      include: {
        lojista: {
          include: {
            loja: true,
          },
        },
        colaborador: {
          include: {
            loja: true,
            cargos: true,
          },
        },
        permissao: {
          where: {
            status: 'ativo',
          },
        },
      },
    });

    if (!usuario) {
      throw new AppErrorNotFound('Usuário não encontrado');
    }

    if (usuario.perfil === USUARIO_PERFIL.LOJISTA) {
      if (usuario.lojista.loja.id !== idLoja) {
        throw new AppErrorNotFound('Usuário não encontrado na loja');
      }
    }

    if (usuario.perfil === USUARIO_PERFIL.USUARIO) {
      if (usuario.colaborador.loja.id !== idLoja) {
        throw new AppErrorNotFound('Usuário não encontrado na loja');
      }
    }

    if (usuario.perfil === USUARIO_PERFIL.LOJISTA) {
      return {
        cargo: ['Administrador'],
        permissao: Object.values(PERMISSOES_LOJA),
        consultaEm: new Date().toISOString(),
      };
    }

    if (usuario.perfil === USUARIO_PERFIL.USUARIO) {
      return {
        cargo: usuario.colaborador.cargos.map((cargo) => cargo.cargo),
        permissao: usuario.permissao.map((permissao) => permissao.funcionalidade),
        consultaEm: new Date().toISOString(),
      };
    }

    return null;
  }

  async updateLogo(storeId: string, file: Express.Multer.File) {
    if (!storeId) throw new AppErrorNotFound('Loja não encontrada');
    if (!file) throw new AppErrorNotFound('Arquivo não encontrado');

    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/webp', 'image/png'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new AppErrorBadRequest(`Tipo de arquivo inválido. São aceitos um dos seguintes tipos: ${allowedMimeTypes.join(', ')}`);
    }

    const storeLogo = await this.fileService.salvarArquivo({
      file: file,
      entidade: 'logo',
      usuarioId: storeId,
      entidadeId: storeId,
    });

    if (!storeLogo || !storeLogo.url) throw new AppErrorInternal('Erro ao salvar o logo da loja');

    await this.prismaService.loja.update({
      where: { id: storeId },
      data: { urlFoto: storeLogo.url },
    });

    return {
      message: 'Logo da loja atualizada com sucesso',
      url: storeLogo.url,
    };
  }
}
