import { Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { PrismaService } from '../../persistence/database/prisma/prisma.service';

export interface IisUniqueOptions {
  field: string;
  table: string;
}

@ValidatorConstraint({ name: 'isUnique', async: true })
@Injectable()
export class IsUniqueConstraint implements ValidatorConstraintInterface {
  constructor(private readonly prismaService: PrismaService) {}

  private message: string = null;

  async validate(value: any, args: ValidationArguments): Promise<boolean> {
    const [options] = args.constraints as IisUniqueOptions[];
    const { field, table } = options;

    if (value === undefined || value === null) return false;

    try {
      const exists = await this.prismaService[table].findFirst({
        where: {
          [field]: value,
        },
      });

      return !exists;
    } catch (error) {
      console.log(error);
      this.message = 'Table or column not found.';
      return false;
    }
  }

  defaultMessage(args: ValidationArguments): string {
    return this.message || `${args.property} already is at uso.`;
  }
}

export function IsUnique(
  options: IisUniqueOptions,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [options],
      validator: IsUniqueConstraint,
    });
  };
}
