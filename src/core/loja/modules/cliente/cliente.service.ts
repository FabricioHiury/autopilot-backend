import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import {
  CriarClienteDto,
  EditarClienteDto,
  ListarClienteDto,
} from './dto/cliente.dto';
import {
  AppErrorConflict,
  AppErrorNotFound,
} from 'src/utils/errors/app-errors';
import { Prisma } from '@prisma/client';
import { STATUS_CLIENTE } from './enum/cliente.enum';
import { FileService } from 'src/persistence/files/file/file.service';
import * as XLSX from 'xlsx';

@Injectable()
export class ClienteService {
  constructor(private readonly prismaService: PrismaService, private readonly fileService: FileService) { }

  private async validarLoja(idLoja: string) {
    const loja = await this.prismaService.loja.findUnique({
      where: {
        id: idLoja,
      },
    });

    if (!loja) {
      throw new AppErrorNotFound('Erro ao encontrar uma loja com o ID informado.');
    }
  }

  async criarClienteNaLoja(
    idLoja: string,
    idUsuario: string,
    criarCliente: CriarClienteDto,
  ) {
    await this.validarLoja(idLoja);

    const clientePorDocumento = await this.prismaService.cliente.findFirst({
      where: {
        documentoFiscal: criarCliente.documentoFiscal,
        idLoja,
      },
    });

    if (clientePorDocumento) {
      throw new AppErrorConflict(
        'Já existe um cliente cadastrado com este CPF ou CNPJ nesta loja.',
      );
    }

    if (criarCliente.email) {
      const clientePorEmail = await this.prismaService.cliente.findFirst({
        where: {
          email: criarCliente.email,
          idLoja,
        },
      });

      if (clientePorEmail) {
        throw new AppErrorConflict(
          'Já existe um cliente cadastrado com este EMAIL nesta loja.',
        );
      }
    }
    await this.prismaService.$transaction(async (prisma) => {
      // Criando cliente
      const cliente = await prisma.cliente.create({
        data: {
          idLoja: idLoja,
          nome: criarCliente.nome,
          tipoPessoa: criarCliente.tipoPessoa,
          documentoFiscal: criarCliente.documentoFiscal,
          rg: criarCliente.rg,
          estrangeiro: criarCliente.estrangeiro,
          genero: criarCliente.genero,
          dataNascimento: criarCliente.dataNascimento,
          telefone: criarCliente.telefone,
          whatsapp: criarCliente.whatsapp,
          email: criarCliente.email,
          versao: 1,
          observacoes: criarCliente.observacoes
        },
      });

      // Criando endereço com o ID do cliente
      await prisma.enderecoCliente.create({
        data: {
          idCliente: cliente.id,
          cep: criarCliente.cep,
          uf: criarCliente.uf,
          municipio: criarCliente.municipio,
          endereco: criarCliente.endereco,
          bairro: criarCliente.bairro,
          numero: criarCliente.numero,
          complemento: criarCliente.complemento,
        },
      });
    });

    const cliente = await this.prismaService.cliente.findFirst({
      where: {
        documentoFiscal: criarCliente.documentoFiscal,
      },
      include: {
        enderecoCliente: true,
      },
    });

    const totalAtendimentos = await this.prismaService.atendimento.count({
      where: {
        idCliente: cliente.id,
      },
    });

    // Criando o primeiro historico de alteração
    await this.prismaService.historicoDadosCadastraisCliente.create({
      data: {
        idCliente: cliente.id,
        idUsuarioEditor: idUsuario,
        versao: 1,
        atualizacao: JSON.stringify(cliente),
      },
    });

    return {
      ...cliente,
      totalAtendimentos,
    };
  }


  async enviarAnexo(idLoja: string, idCliente: string, arquivos: Express.Multer.File[]) {
    this.validarLoja(idLoja)

    const documentMimeTypes = [
      "application/msword", // .doc
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      "application/pdf", // .pdf
      "text/plain", // .txt
      "application/vnd.ms-excel", // .xls
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-powerpoint", // .ppt
      "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
      "application/rtf", // .rtf
      "text/html", // .html
      "text/csv", // .csv
      "application/epub+zip", // .epub
      "application/x-iwork-pages-sffpages", // .pages (Apple iWork)
      "application/vnd.oasis.opendocument.text", // .odt
      "application/vnd.oasis.opendocument.spreadsheet", // .ods
      "application/vnd.oasis.opendocument.presentation", // .odp
      "application/vnd.oasis.opendocument.graphics", // .odg
      "application/vnd.google-apps.document", // Google Docs
      "application/vnd.google-apps.spreadsheet", // Google Sheets
      "application/vnd.google-apps.presentation", // Google Slides
    ];

    const arquivoCriado = await this.fileService.salvarArquivoUUID({
      file: arquivos[0],
      allowedMimeTypes: documentMimeTypes,
    })

    const anexoCliente = this.prismaService.anexoCliente.create({
      data: {
        idArquivo: arquivoCriado.id,
        idCliente: idCliente,
      },
      select: {
        idArquivo: true,
        id: true,
        arquivo: {
          select: {
            url: true,
            nome: true,
            criadoEm: true,
            tipo: true
          }
        }
      }
    })

    return anexoCliente


  }

  async buscarClientePorId(idLoja: string, idCliente: string) {
    this.validarLoja(idLoja);

    const cliente = await this.prismaService.cliente.findUnique({
      where: {
        id: idCliente,
        idLoja,

      },
      include: {
        enderecoCliente: true,

        historicoDadosCadastrais: {
          where: {
            versao: 1,
          },
          select: {
            criadoEm: true,
            idUsuarioEditor: true
          }
        },
        atendimento: {
          select: {
            visitasAtendimento: {
              select: {
                observacoes: true,
                horaFim: true,
                horaInicio: true,
                concluida: true,
                data: true,
                tipo: true,
                criadoEm: true,
                id: true
              }
            },
            tarefasAtendimento: {
              select: {
                observacoes: true,
                nome: true,
                criadoEm: true,
                horaFim: true,
                horaInicio: true,
                colaborador: {
                  select: {
                    nome: true,
                    idUsuario: true
                  }
                },
                concluida: true
              }
            },
            criadoEm: true,
            descricaoAtendimento: true,
            id: true,
            anexos: {
              select: {
                criadoEm: true,
                arquivo: {
                  select: {
                    url: true,
                    nome: true,
                    tipo: true,
                  }
                }
              }
            },
            observacao: true,
            status: true,
            titulo: true,
            temperatura: true,
            origemAtendimento: true,
            modoAtendimento: true,
            logsAtividadesAtendimento: {
              select: {
                mensagem: true,
                id: true,
                criadoEm: true,
              }
            },
            comentariosAtendimento: true,
            atendimentoResponsaveis: {
              select: {
                colaborador: {
                  select: {
                    nome: true,
                    idUsuario: true
                  }
                }
              }
            },
            chat: {
              select: {
                _count: true,
              }
            },

          }

        },
      },
    });

    const usuarioEditor = cliente.historicoDadosCadastrais ? cliente.historicoDadosCadastrais[0] : null

    let usuarioCriador = null
    if (usuarioEditor) {
      usuarioCriador = await this.prismaService.usuario.findUnique({
        where: {
          id: usuarioEditor.idUsuarioEditor
        },
        select: {
          nome: true,
          perfil: true,
          id: true,
        }
      })
    }

    const totalAtendimentos = await this.prismaService.atendimento.count({
      where: {
        idCliente,
      },
    });

    const anexos = await this.prismaService.anexoCliente.findMany({
      where: {
        idCliente: idCliente
      },
      select: {
        arquivo: {
          select: {
            url: true,
            nome: true,
            tipo: true,
            criadoEm: true,
            id: true
          }
        }
      }
    })

    if (!cliente) {
      throw new AppErrorNotFound(
        'Nenhum cliente com este ID foi encontrado nesta loja.',
      );
    }

    return {
      ...cliente,
      atendimentos: cliente.atendimento,
      atendimento: undefined,
      anexos: anexos,
      totalAtendimentos,
      usuarioCriador: usuarioCriador ? usuarioCriador : null
    };
  }

  async buscarClientesPorLoja(idLoja: string, params: ListarClienteDto) {
    this.validarLoja(idLoja);

    const pagina = params.pagina ? +params.pagina : 1;
    const quantidade = params.quantidade ? +params.quantidade : 10;
    const pesquisa = params.pesquisa ? params.pesquisa : '';
    const genero = params.genero;
    const estado = params.estado;
    const canalOrigem = params.canalOrigem;

    let dataInicial = params.dataInicial ? new Date(params.dataInicial) : undefined;
    let dataFinal = params.dataFinal ? new Date(params.dataFinal) : undefined;

    if (dataInicial) {
      dataInicial = new Date(dataInicial.setUTCHours(0, 0, 0, 0));
    }

    if (dataFinal) {
      dataFinal = new Date(dataFinal.setUTCHours(23, 59, 59, 999));
    }

    let whereData: Prisma.ClienteWhereInput;

    if (dataInicial && dataFinal) {
      if (dataInicial) {
        dataInicial = new Date(dataInicial.setUTCHours(0, 0, 0, 0));
      }

      if (dataFinal) {
        dataFinal = new Date(dataFinal.setUTCHours(23, 59, 59, 999));
      }

      whereData = {
        criadoEm: {
          gte: dataInicial,
          lte: dataFinal,
        },
      };
    } else {
      dataInicial = undefined;
      dataFinal = undefined;
    }

    let wherePesquisa: Prisma.ClienteWhereInput;

    if (pesquisa) {
      const camposPesquisas = [
        'nome',
        'email',
        'telefone',
        'whatsapp',
        'documentoFiscal',
        'rg',
      ];

      wherePesquisa = {
        OR: camposPesquisas.map((campo) => ({
          [campo]: {
            contains: pesquisa,
            mode: 'insensitive',
          },
        })),
      };
    }

    let whereGenero: Prisma.ClienteWhereInput;
    if (genero) {
      whereGenero = {
        genero: genero,
      };
    }

    let whereEstado: Prisma.ClienteWhereInput;
    if (estado) {
      whereEstado = {
        enderecoCliente: {
          uf: {
            equals: estado,
            mode: 'insensitive',
          },
        },
      };
    }

    let whereCanalOrigem: Prisma.ClienteWhereInput;
    if (canalOrigem) {
      whereCanalOrigem = {
        chat: {
          some: {
            canal: {
              equals: canalOrigem,
              mode: 'insensitive',
            },
          },
        },
      };
    }

    const whereFormatado: Prisma.ClienteWhereInput = {
      ...whereData,
      ...wherePesquisa,
      ...whereGenero,
      ...whereEstado,
      ...whereCanalOrigem,
      idLoja,
      status: {
        not: 'inativo',
      },
    };

    const clientes = await this.prismaService.cliente.findMany({
      where: whereFormatado,
      include: {
        enderecoCliente: true,
      },
      skip: (pagina - 1) * quantidade,
      take: quantidade,
      orderBy: { id: 'desc' },
    });

    const totalClientes = await this.prismaService.cliente.count({
      where: whereFormatado,
    });

    const totalPaginas = Math.ceil(totalClientes / quantidade);

    const pegarTotalAtendimentos = async (idCliente: string) => {
      return this.prismaService.atendimento.count({
        where: {
          idCliente,
        },
      });
    };

    const clientesFormatados = await Promise.all(
      clientes.map(async (cliente) => {
        return {
          ...cliente,
          totalAtendimentos: await pegarTotalAtendimentos(cliente.id),
        };
      }),
    );

    const cadastrosRecentes = await this.prismaService.cliente.count({
      where: {
        idLoja: idLoja,
        criadoEm: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      orderBy: {
        criadoEm: 'desc',
      },
    });

    return {
      pesquisa,
      pagina,
      quantidade,
      totalClientes,
      totalPaginas,
      dataInicial,
      dataFinal,
      genero,
      estado,
      canalOrigem,
      clientes: clientesFormatados,
      cadastrosRecentes
    };
  }

  async editarClienteNaLoja(
    idLoja: string,
    idUsuario: string,
    idCliente: string,
    editarCliente: EditarClienteDto,
  ) {
    await this.validarLoja(idLoja);

    const cliente = await this.prismaService.cliente.findUnique({
      where: {
        id: idCliente,
        idLoja: idLoja,
      },
    });

    if (!cliente) {
      throw new AppErrorNotFound('Nenhum cliente com este ID foi encontrado.');
    }

    if (editarCliente.email) {
      const procurarClienteEmail = await this.prismaService.cliente.findFirst({
        where: {
          idLoja,
          email: editarCliente.email,
          NOT: {
            id: idCliente,
          },
        },
      });

      if (procurarClienteEmail) {
        throw new AppErrorConflict(
          'Já existe um cliente com este endereço de email cadastrado.',
        );
      }
    }

    if (editarCliente.documentoFiscal) {
      const procurarClienteDocumentoFiscal =
        await this.prismaService.cliente.findFirst({
          where: {
            idLoja,
            documentoFiscal: editarCliente.documentoFiscal,
            NOT: {
              id: idCliente,
            },
          },
        });

      if (procurarClienteDocumentoFiscal) {
        throw new AppErrorConflict(
          'Já existe um cliente com este documento fiscal cadastrado.',
        );
      }
    }

    await this.prismaService.$transaction(async (prisma) => {
      const clienteAtualizado = await prisma.cliente.update({
        where: {
          id: idCliente,
        },
        data: {
          nome: editarCliente.nome,
          tipoPessoa: editarCliente.tipoPessoa,
          documentoFiscal: editarCliente.documentoFiscal,
          rg: editarCliente.rg,
          estrangeiro: editarCliente.estrangeiro,
          genero: editarCliente.genero,
          dataNascimento: editarCliente.dataNascimento,
          telefone: editarCliente.telefone,
          whatsapp: editarCliente.whatsapp,
          email: editarCliente.email,
          observacoes: editarCliente.observacoes,
          versao: cliente.versao + 1,
        },
        include: {
          enderecoCliente: true,
        },
      });

      await prisma.enderecoCliente.update({
        where: {
          id: clienteAtualizado.enderecoCliente.id,
        },
        data: {
          cep: editarCliente.cep,
          uf: editarCliente.uf,
          municipio: editarCliente.municipio,
          endereco: editarCliente.endereco,
          bairro: editarCliente.bairro,
          numero: editarCliente.numero,
          complemento: editarCliente.complemento,
        },
      });
    });

    const clienteAtualizado = await this.prismaService.cliente.findUnique({
      where: {
        id: idCliente,
      },
      include: {
        enderecoCliente: true,
        atendimento: true,
      },
    });

    // Criando historico de alteração
    await this.prismaService.historicoDadosCadastraisCliente.create({
      data: {
        idCliente: clienteAtualizado.id,
        idUsuarioEditor: idUsuario,
        versao: clienteAtualizado.versao,
        atualizacao: JSON.stringify(clienteAtualizado),
      },
    });

    return clienteAtualizado;
  }

  async invativarClienteNaLoja(
    idLoja: string,
    idUsuario: string,
    idCliente: string,
  ) {
    await this.validarLoja(idLoja);

    const cliente = await this.prismaService.cliente.findUnique({
      where: {
        id: idCliente,
        idLoja,
      },
    });

    if (!cliente) {
      throw new AppErrorNotFound('Nenhum cliente com este ID foi encontrado.');
    }

    if (cliente.status === 'inativo') {
      throw new AppErrorConflict('Este cliente já está inativo.');
    }

    const clienteAtualizado = await this.prismaService.cliente.update({
      where: {
        id: idCliente,
      },
      data: {
        status: STATUS_CLIENTE.INATIVO,
        versao: cliente.versao + 1,
      },
      include: {
        enderecoCliente: true,
      },
    });

    // Criando o historico de alteração
    await this.prismaService.historicoDadosCadastraisCliente.create({
      data: {
        idCliente: clienteAtualizado.id,
        idUsuarioEditor: idUsuario,
        versao: clienteAtualizado.versao,
        atualizacao: JSON.stringify(clienteAtualizado),
      },
    });

    return {
      message: 'Cliente inativado com sucesso.',
    };
  }

  async ativarClienteNaLoja(
    idLoja: string,
    idUsuario: string,
    idCliente: string,
  ) {
    await this.validarLoja(idLoja);

    const cliente = await this.prismaService.cliente.findUnique({
      where: {
        id: idCliente,
        idLoja,
      },
    });

    if (!cliente) {
      throw new AppErrorNotFound('Nenhum cliente com este ID foi encontrado.');
    }

    if (cliente.status === 'ativo') {
      throw new AppErrorConflict('Este cliente já está ativo.');
    }

    const clienteAtualizado = await this.prismaService.cliente.update({
      where: {
        id: idCliente,
      },
      data: {
        status: STATUS_CLIENTE.ATIVO,
        versao: cliente.versao + 1,
      },
      include: {
        enderecoCliente: true,
      },
    });

    // Criando o historico de alteração
    await this.prismaService.historicoDadosCadastraisCliente.create({
      data: {
        idCliente: clienteAtualizado.id,
        idUsuarioEditor: idUsuario,
        versao: clienteAtualizado.versao,
        atualizacao: JSON.stringify(clienteAtualizado),
      },
    });

    return {
      message: 'Cliente ativado com sucesso.',
    };
  }

  async importarClientes(idLoja: string, idUsuario: string, arquivo: Express.Multer.File, app: 'autoConf' | 'revendaMais' = 'autoConf') {
    await this.validarLoja(idLoja);

    const workbook = XLSX.read(arquivo.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    if (app === 'revendaMais') {
      return this.importarRevendaMais(idLoja, idUsuario, data);
    }

    return this.importarAutoConf(idLoja, idUsuario, data);
  }

  private async importarAutoConf(idLoja: string, idUsuario: string, data: any[]) {
    let clientesCriados = 0;
    let clientesIgnorados = 0;

    for (const row of data) {
      const documentoFiscal = row['CPF\\CNPJ'] ? String(row['CPF\\CNPJ']).replace(/\D/g, '') : '';
      const email = row['Email'];
      const nome = row['Nome\\Razão Social'];

      if (!documentoFiscal && !email) {
        clientesIgnorados++;
        continue;
      }

      const existingCliente = await this.prismaService.cliente.findFirst({
        where: {
          idLoja,
          OR: [
            { documentoFiscal: documentoFiscal || undefined },
            { email: email || undefined }
          ]
        }
      });

      if (existingCliente) {
        clientesIgnorados++;
        continue;
      }

      const enderecoParsed = this.parseEndereco(row['Endereço']);
      const tipoPessoa = documentoFiscal.length > 11 ? 'juridica' : 'fisica';
      const dataNascimento = row['Data de aniversário'] ? this.parseData(row['Data de aniversário']) : new Date();

      await this.prismaService.$transaction(async (prisma) => {
        const cliente = await prisma.cliente.create({
          data: {
            idLoja,
            nome: nome || 'Cliente Importado',
            tipoPessoa,
            documentoFiscal: documentoFiscal || 'N/A',
            rg: '',
            estrangeiro: false,
            genero: 'nao_informado',
            dataNascimento,
            telefone: row['Telefone'] || '',
            whatsapp: row['Telefone'] || '',
            email: email || '',
            versao: 1,
            observacoes: 'Importado via Excel (AutoConf)',
            status: 'ativo'
          }
        });

        await prisma.enderecoCliente.create({
          data: {
            idCliente: cliente.id,
            ...enderecoParsed
          }
        });

        await prisma.historicoDadosCadastraisCliente.create({
          data: {
            idCliente: cliente.id,
            idUsuarioEditor: idUsuario,
            versao: 1,
            atualizacao: JSON.stringify(cliente),
          },
        });
      }).then(() => {
        clientesCriados++;
      }).catch((err) => {
        console.error('Erro ao importar cliente:', err);
        clientesIgnorados++;
      });
    }

    return {
      message: 'Importação concluída (AutoConf).',
      detalhes: {
        criados: clientesCriados,
        ignorados: clientesIgnorados
      }
    };
  }

  private async importarRevendaMais(idLoja: string, idUsuario: string, data: any[]) {
    let clientesCriados = 0;
    let clientesIgnorados = 0;

    for (const row of data) {
      const documentoFiscal = row['cpf_cnpj'] ? String(row['cpf_cnpj']).replace(/\D/g, '') : '';
      const email = row['email'];
      const nome = row['nome'];

      if (!documentoFiscal && !email) {
        clientesIgnorados++;
        continue;
      }

      const existingCliente = await this.prismaService.cliente.findFirst({
        where: {
          idLoja,
          OR: [
            { documentoFiscal: documentoFiscal || undefined },
            { email: email || undefined }
          ]
        }
      });

      if (existingCliente) {
        clientesIgnorados++;
        continue;
      }

      const tipoPessoa = row['pessoa'] === 'Jurídica' ? 'juridica' : 'fisica';
      const dataNascimento = row['data_nascimento'] ? this.parseData(row['data_nascimento']) : new Date();
      const telefone = row['telefone_celular'] || row['telefone_residencial'] || row['telefone_comercial'] || '';

      await this.prismaService.$transaction(async (prisma) => {
        const cliente = await prisma.cliente.create({
          data: {
            idLoja,
            nome: nome || 'Cliente Importado',
            tipoPessoa,
            documentoFiscal: documentoFiscal || 'N/A',
            rg: row['rg'] || '',
            estrangeiro: false,
            genero: row['sexo'] === 'Masculino' ? 'masculino' : row['sexo'] === 'Feminino' ? 'feminino' : 'nao_informado',
            dataNascimento,
            telefone: telefone,
            whatsapp: row['telefone_celular'] || '',
            email: email || '',
            versao: 1,
            observacoes: 'Importado via Excel (RevendaMais)',
            status: 'ativo'
          }
        });

        await prisma.enderecoCliente.create({
          data: {
            idCliente: cliente.id,
            cep: row['cep'] ? String(row['cep']).replace(/\D/g, '') : '',
            uf: row['estado'] || '',
            municipio: row['cidade'] || '',
            endereco: row['rua'] || '',
            bairro: row['bairro'] || '',
            numero: row['numero'] ? String(row['numero']) : '',
            complemento: row['complemento'] || '',
          }
        });

        await prisma.historicoDadosCadastraisCliente.create({
          data: {
            idCliente: cliente.id,
            idUsuarioEditor: idUsuario,
            versao: 1,
            atualizacao: JSON.stringify(cliente),
          },
        });
      }).then(() => {
        clientesCriados++;
      }).catch((err) => {
        console.error('Erro ao importar cliente:', err);
        clientesIgnorados++;
      });
    }

    return {
      message: 'Importação concluída (RevendaMais).',
      detalhes: {
        criados: clientesCriados,
        ignorados: clientesIgnorados
      }
    };
  }

  private parseEndereco(enderecoCompleto: string) {
    if (!enderecoCompleto) {
      return {
        cep: '',
        uf: '',
        municipio: '',
        endereco: '',
        bairro: '',
        numero: '',
        complemento: ''
      };
    }
    
    try {
      const parts = enderecoCompleto.split(',').map(p => p.trim());
      // parts[0] = Rua
      // parts[1] = Numero
      // parts[2] = Complemento - Bairro - Cidade - UF
      // parts[3] = CEP

      let rua = parts[0] || '';
      let numero = parts[1] || '';
      let cep = parts[parts.length - 1] || '';
      
      let meio = parts.slice(2, parts.length - 1).join(', ');
      
      let bairro = '';
      let municipio = '';
      let uf = '';
      let complemento = '';

      if (meio) {
        const meioParts = meio.split('-').map(p => p.trim());
        
        if (meioParts.length > 0) uf = meioParts[meioParts.length - 1];
        if (meioParts.length > 1) municipio = meioParts[meioParts.length - 2];
        if (meioParts.length > 2) bairro = meioParts[meioParts.length - 3];
        if (meioParts.length > 3) complemento = meioParts.slice(0, meioParts.length - 3).join(' - ');
        else if (meioParts.length === 1) complemento = meioParts[0];
      }

      cep = cep.replace(/\D/g, '');
      if (cep.length !== 8) cep = '';

      return {
        cep,
        uf,
        municipio,
        endereco: rua,
        bairro,
        numero,
        complemento
      };
    } catch (e) {
      return {
        cep: '',
        uf: '',
        municipio: '',
        endereco: enderecoCompleto, 
        bairro: '',
        numero: '',
        complemento: ''
      };
    }
  }

  private parseData(dataString: string): Date {
    if (!dataString) return new Date();
    try {
      const parts = dataString.split('/');
      if (parts.length === 3) {
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
    } catch (e) {
      return new Date();
    }
    return new Date();
  }
}
