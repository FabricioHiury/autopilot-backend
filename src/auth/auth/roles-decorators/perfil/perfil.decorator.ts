import { SetMetadata } from '@nestjs/common';

export const PERFIS_KEY = 'perfis';
export const Perfil = (...perfis: string[]) => SetMetadata(PERFIS_KEY, perfis);