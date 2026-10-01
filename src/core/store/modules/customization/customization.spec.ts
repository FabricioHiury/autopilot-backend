import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CustomizationService } from './customization.service';
import { CustomizationController } from './customization.controller';
import { UpdateCustomizationDto } from './customization.dto';
describe('Store branding', () => {
  it('rejects invalid colors, hours and executable URLs', async () => {
    const errors = await validate(
      plainToInstance(UpdateCustomizationDto, {
        primaryColor: 'red;display:none',
        openingTime: '25:80',
        logoLightUrl: 'javascript:alert(1)',
        workingDays: [8],
      }),
    );
    expect(errors.map((e) => e.property)).toEqual(
      expect.arrayContaining([
        'primaryColor',
        'openingTime',
        'logoLightUrl',
        'workingDays',
      ]),
    );
  });
  it('creates defaults using the authenticated store name', async () => {
    const db = {
      store: {
        findUnique: jest.fn().mockResolvedValue({ companyName: 'Store A' }),
      },
      storeCustomization: { upsert: jest.fn() },
    };
    await new CustomizationService(db as any).get('store-a');
    expect(db.storeCustomization.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          storeId: 'store-a',
          displayName: 'Store A',
        }),
      }),
    );
  });
  it('prevents employees from changing branding', () => {
    const service = { update: jest.fn() };
    expect(() =>
      new CustomizationController(service as any).update(
        'store-a',
        { user: { profile: 'user' } },
        { primaryColor: '#123456' },
      ),
    ).toThrow('Only the store owner');
    expect(service.update).not.toHaveBeenCalled();
  });
});
