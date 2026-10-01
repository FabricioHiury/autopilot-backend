import { SetMetadata } from '@nestjs/common';

export const PROFILES_KEY = 'profiles';
export const Profile = (...profiles: string[]) =>
  SetMetadata(PROFILES_KEY, profiles);
