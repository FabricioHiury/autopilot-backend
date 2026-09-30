import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { CriarCargoDto } from './dto/criar-cargo.dto';
import { AppErrorConflict, AppErrorNotFound } from 'src/utils/errors/app-errors';

@Injectable()
export class LojaCargoService {
  constructor(private readonly prismaService: PrismaService) {}

  async criarCargo(idLoja: string, params: CriarCargoDto) {
    const funcionalidades = params.funcionalidades.join(',');

    const cargoExiste = await this.prismaService.cargo.findUnique({
      where: {
         idLoja_cargo: {
            idLoja,
            cargo: params.cargo
          }
      },
    });

    if( cargoExiste && !params.id ) {
      throw new AppErrorConflict('Cargo já cadastrado');
    }

    if ( cargoExiste && cargoExiste.id !== params.id) {
      throw new AppErrorConflict('Nome do cargo já utilizado');
    }

    return await this.prismaService.cargo.upsert({
      where: {
        id: params.id || '',
      },
      create: {
        idLoja: idLoja,
        cargo: params.cargo,
        funcionalidades,
      },
      update: {
        cargo: params.cargo,
        funcionalidades,
      },
    });
  }

  async listarCargos(idLoja: string) {
    const cargos = await this.prismaService.cargo.findMany({
      where: {
        idLoja,
      },
    });

    const cargosFormatados = cargos.map((cargo) => {
      return {
        id: cargo.id,
        cargo: cargo.cargo,
        funcionalidades: cargo.funcionalidades.split(','),
      };
    });

    return { cargos: cargosFormatados };
  }

  async deletarCargo(idLoja: string, idCargo: string) {
    const cargoExiste = await this.prismaService.cargo.findUnique({
      where: {
        idLoja,
        id: idCargo
      },
    });

    if (!cargoExiste) {
      throw new AppErrorNotFound('Cargo não encontrado');
    }

    return await this.prismaService.cargo.delete({
      where: {
        id: idCargo,
      },
    });
  }
}
