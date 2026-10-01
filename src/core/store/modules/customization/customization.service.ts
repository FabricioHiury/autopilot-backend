import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { UpdateCustomizationDto } from './customization.dto';
@Injectable()
export class CustomizationService {
  constructor(private readonly prisma: PrismaService) {}
  async get(storeId: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });
    if (!store) throw new NotFoundException('Store not found');
    return this.prisma.storeCustomization.upsert({
      where: { storeId },
      update: {},
      create: {
        storeId,
        slug: storeId,
        displayName: store.companyName,
        workingDays: [1, 2, 3, 4, 5],
      },
    });
  }
  async update(storeId: string, input: UpdateCustomizationDto) {
    await this.get(storeId);
    const data = Object.fromEntries(
      Object.entries(input).filter(
        ([, value]) => value !== null && value !== undefined,
      ),
    );
    try {
      return await this.prisma.storeCustomization.update({
        where: { storeId },
        data,
      });
    } catch (error) {
      if (error.code === 'P2002')
        throw new ConflictException('Slug already in use');
      throw error;
    }
  }
}
