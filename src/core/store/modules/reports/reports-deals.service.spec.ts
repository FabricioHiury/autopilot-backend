import { ReportsDealsService } from './reports-deals.service';

describe('Reports for a new store', () => {
  it('returns an empty detailed report when the store has no salespeople', async () => {
    const prisma = {
      employee: { findMany: jest.fn().mockResolvedValue([]) },
      deal: { findMany: jest.fn() },
    };
    const service = new ReportsDealsService(prisma as any);
    await expect(
      service.generateReportDetailedSalesperson('store-id', {
        dataStart: '2026-10-01',
        dataEnd: '2026-10-06',
      }),
    ).resolves.toEqual([]);
    expect(prisma.deal.findMany).not.toHaveBeenCalled();
  });
});
