import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'isCnpj', async: false })
export class IsCnpjConstraint implements ValidatorConstraintInterface {
  
  validate(cnpj: string): boolean {
    if(!cnpj) return false;
    cnpj = cnpj.replace(/\D+/g, '');
    console.log(cnpj)

    if (cnpj.length !== 14) return false;

    if (/^(\d)\1{13}$/.test(cnpj)) return false;
    return true;
  }

  defaultMessage(): string {
    return 'CNPJ inválido';
  }
  
}

export function IsCnpj(validationOptions?: ValidationOptions) {
  return function(object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCnpjConstraint,
    });
  };
}
