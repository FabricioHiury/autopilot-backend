import { PERMISSOES_AUTOPILOT } from 'src/core/usuario/enum/permissoes_funcionalidades.enum';

export class IsInEnum {
  validate(value: any) {
    return Object.values(PERMISSOES_AUTOPILOT).includes(value);
  }

  defaultMessage() {
    return `Os valores aceitos no array de permissões são: ${Object.values(PERMISSOES_AUTOPILOT).join(', ')}`;
  }
}
