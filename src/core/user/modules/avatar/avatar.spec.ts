import { AvatarService } from './avatar.service';
import { AvatarController } from './avatar.controller';

describe('Avatar fallback', () => {
  it('finishes the HTTP response when a user has no photo', async () => {
    const service = new AvatarService(
      { user: { findUnique: jest.fn().mockResolvedValue({ photoUrl: null }) } } as any,
      {} as any,
    );
    const response = { status: jest.fn().mockReturnThis(), end: jest.fn(), redirect: jest.fn() };
    await new AvatarController(service).getAvatar('user', response as any);
    expect(response.status).toHaveBeenCalledWith(204);
    expect(response.end).toHaveBeenCalledTimes(1);
    expect(response.redirect).not.toHaveBeenCalled();
  });

  it('returns not found for an unknown user instead of dereferencing null', async () => {
    const service = new AvatarService(
      { user: { findUnique: jest.fn().mockResolvedValue(null) } } as any,
      {} as any,
    );
    await expect(service.getAvatarUrl('missing')).rejects.toThrow('User not found');
  });
});
