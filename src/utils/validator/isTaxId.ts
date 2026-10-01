import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isTaxId', async: false })
export class IsTaxIdConstraint implements ValidatorConstraintInterface {
  validate(taxId: string): boolean {
    if (!taxId) return false;
    taxId = taxId.replace(/\D+/g, '');
    console.log(taxId);

    if (taxId.length !== 14) return false;

    if (/^(\d)\1{13}$/.test(taxId)) return false;
    return true;
  }

  defaultMessage(): string {
    return 'TAXID invalid';
  }
}

export function IsTaxId(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsTaxIdConstraint,
    });
  };
}
