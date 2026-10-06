import { Reflector } from '@nestjs/core';
import { ProfileGuard } from './profile.guard';
import { SupportBackofficeController } from 'src/core/support/support-backoffice.controller';
import { BackofficeStoreController } from 'src/core/backoffice/modules/stores/backoffice-store.controller';
import { AppErrorForbidden, AppErrorUnauthorized } from 'src/utils/errors/app-errors';

describe('Controller profile restrictions', () => {
  const guard = new ProfileGuard(new Reflector());
  const context = (controller: any, profile?: string) => ({
    getHandler: () => Object.getOwnPropertyNames(controller.prototype)
      .filter((name) => name !== 'constructor')
      .map((name) => controller.prototype[name])[0],
    getClass: () => controller,
    switchToHttp: () => ({ getRequest: () => ({ user: profile ? { profile } : undefined }) }),
  } as any);

  it.each([SupportBackofficeController, BackofficeStoreController])(
    'blocks store users and permits autopilot administrators on %p', (controller) => {
      expect(() => guard.canActivate(context(controller, 'storeOwner'))).toThrow(AppErrorForbidden);
      expect(() => guard.canActivate(context(controller, 'user'))).toThrow(AppErrorForbidden);
      expect(guard.canActivate(context(controller, 'autopilot'))).toBe(true);
    },
  );

  it('requires authentication on a restricted controller', () => {
    expect(() => guard.canActivate(context(SupportBackofficeController))).toThrow(AppErrorUnauthorized);
  });
});
