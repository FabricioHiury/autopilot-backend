import { Reflector } from '@nestjs/core';

export const Permissoes = Reflector.createDecorator<string[]>();