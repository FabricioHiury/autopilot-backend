import { Injectable } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { Payload } from './entities/payload.entity';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { MailService } from 'src/utils/mail/mail.service';
import { Usuario } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  AppErrorInternal,
  AppErrorNotFound,
  AppErrorUnauthorized,
} from 'src/utils/errors/app-errors';
import { JwtService } from '@nestjs/jwt';
import { PERFIS_KEY } from './roles-decorators/perfil/perfil.decorator';
import { USUARIO_PERFIL } from 'src/core/usuario/enum/perfil.enum';
import { STATUS_CLIENTE } from 'src/core/loja/modules/cliente/enum/cliente.enum';
import { isUUID } from 'class-validator';
import { PERMISSOES_AUTOPILOT } from 'src/core/usuario/enum/permissoes_funcionalidades.enum';
import { NovuService } from 'src/core/novu/novu.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly novuService: NovuService,
  ) { }

  private async validarEGerarToken(
    usuario: Usuario,
    senhaParaValidacao: string,
    tipoToken: 'access' | 'reset',
  ): Promise<string> {
    const { senha } = usuario;

    if (tipoToken === 'access') {
      const senhaValida = await bcrypt.compare(senhaParaValidacao, senha);
      if (!senhaValida) throw new AppErrorUnauthorized('Credenciais inválidas');
    }
    // gerando payload
    const payload: Payload = {
      sub: usuario.id,
    };

    let token: string;

    if (tipoToken === 'reset') {
      payload.reset = true;
      token = this.jwtService.sign(payload, {
        expiresIn: '4h',
        secret: process.env.JWT_RESET_SECRET,
      });

      return token;
    }

    // gerando token
    token = this.jwtService.sign(payload, {
      //expiresIn: '30d',
      secret: process.env.JWT_SECRET,
    });

    return token;
  }

  async login(signAuthDto: LoginDto) {
    const { email, senha, expoPushToken } = signAuthDto;

    try {
      const usuario = await this.prismaService.usuario.findUnique({
        where: { email },
        include: {
          lojista: { include: { loja: true } },
          colaborador: {
            include: {
              loja: {
                include: {
                  lojista: true,
                },
              },
            },
          },
        },
      });

      if (!usuario) {
        throw new AppErrorUnauthorized('Credenciais inválidas');
      }

      if (usuario.status !== STATUS_CLIENTE.ATIVO) {
        throw new AppErrorUnauthorized('Usuário inativo, pendente ou bloqueado');
      }

      let idLoja: string | null;
      let nomeLoja: string | null;

      if (usuario.perfil === USUARIO_PERFIL.LOJISTA) {
        if (
          !usuario.lojista ||
          usuario.lojista.status !== STATUS_CLIENTE.ATIVO
        ) {
          throw new AppErrorUnauthorized('Usuário inativo ou bloqueado');
        }

        idLoja = usuario.lojista.loja.id;
        nomeLoja = usuario.lojista.loja.nomeEmpresa;
      }

      if (usuario.perfil === USUARIO_PERFIL.USUARIO) {
        if (
          !usuario.colaborador ||
          usuario.colaborador.status !== STATUS_CLIENTE.ATIVO ||
          usuario.colaborador.loja.lojista.status !== STATUS_CLIENTE.ATIVO
        ) {
          throw new AppErrorUnauthorized('Usuário inativo ou bloqueado');
        }

        idLoja = usuario.colaborador.loja.id;
        nomeLoja = usuario.colaborador.loja.nomeEmpresa;
      }

      const token = await this.validarEGerarToken(usuario, senha, 'access');

      if (expoPushToken) {
        await this.prismaService.usuario.update({
          where: { id: usuario.id },
          data: { expoPushToken },
        });

        this.novuService.createOrUpdateSubscriber({
          subscriberId: usuario.id,
          email: usuario.email,
          firstName: usuario.nome,
          expoPushToken,
        }).catch(() => {});
      }

      return {
        token,
        perfil: usuario.perfil,
        nome: usuario.nome || null,
        nomeEmpresa: nomeLoja || null,
        idLoja: idLoja || null,
        id: usuario.id,
      };
    } catch (error) {
      throw error;
    }
  }

  async validarAuth(payload: Payload) {
    const { sub } = payload;

    if (typeof sub !== 'string' || !isUUID(sub)) {
      throw new AppErrorUnauthorized('Token inválido');
    }

    const usuario = await this.prismaService.usuario.findUnique({
      where: { id: sub },
      include: {
        lojista: { include: { loja: true } },
        colaborador: { include: { loja: true } },
      },
    });

    if (!usuario) {
      return null;
    }

    return {
      id: usuario.id,
      idLoja: usuario.lojista?.loja?.id ?? usuario.colaborador?.loja?.id ?? null,
      email: usuario.email,
      perfil: usuario.perfil,
    };
  }


  async enviarEmailDeRecuperacao(email: string): Promise<void> {
    try {
      const usuario = await this.prismaService.usuario.findUnique({
        where: { email },
      });

      if (!usuario) {
        throw new AppErrorNotFound('Usuário não encontrado');
      }

      const token = await this.validarEGerarToken(
        usuario,
        usuario.senha,
        'reset',
      );

      const resetUrl = `${process.env.FRONTEND_URL}/autenticacao/redefinir-senha?token=${token}`;

      await this.mailService.sendPasswordResetEmail(
        email,
        resetUrl,
        usuario.nome,
      );
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async validarResetToken(token: string): Promise<Usuario> {
    const secret = process.env.JWT_RESET_SECRET;
    if (!secret) {
      throw new Error('Token inválido');
    }
  
    let payload: Payload;
    try {
      payload = this.jwtService.verify(token, { secret }) as Payload;
    } catch (e: any) {
      throw new AppErrorUnauthorized('Token inválido ou expirado');
    }
  
    if (!payload?.reset) {
      throw new AppErrorUnauthorized('Token inválido');
    }
  
    const { sub } = payload;

    if (typeof sub !== 'string' || !isUUID(sub)) {
      throw new AppErrorUnauthorized('Token inválido');
    }
  
    const usuario = await this.prismaService.usuario.findUnique({
      where: { id: sub },
    });
  
    if (!usuario) {
      throw new AppErrorNotFound('Usuário não encontrado');
    }
  
    return usuario as Usuario;
  }
  
  async redefinirSenha(resetToken: string, newPassword: string) {
    const usuario = (await this.validarResetToken(resetToken)) as Usuario;

    let hashedPassword: string;

    try {
      hashedPassword = await bcrypt.hash(newPassword, 10);
    } catch (err) {
      throw new AppErrorInternal('Erro ao criptografar senha');
    }

    await this.prismaService.usuario.update({
      where: { id: usuario.id },
      data: {
        senha: hashedPassword,
      },
    });

    return true;
  }

  async pegarAcessoBackoffice(idUsuario: string) {
    try {
      const usuario = await this.prismaService.usuario.findUnique({
        where: { 
          id: idUsuario,
          perfil: USUARIO_PERFIL.AUTOPILOT,
          status: {
            not: 'excluido'
          }
        },
        include: {
          permissao: {
            where: {
              status: 'ativo'
            }
          }
        }
      });

      if (!usuario) {
        throw new AppErrorNotFound('Usuário admin não encontrado');
      }

      // Extrair apenas as funcionalidades das permissões
      const permissoes = usuario.permissao?.map((permissao) => permissao.funcionalidade) ?? [];

      return {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        cargo: ['Admin'],
        permissao: permissoes,
        status: usuario.status,
        consultaEm: new Date()
      };
    } catch (error) {
      console.error('Erro ao buscar permissões do usuário:', error);
      throw error;
    }
  }
}
