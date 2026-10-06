import axios from 'axios';
import { BackofficeStoreService } from './backoffice-store.service';

jest.mock('axios', () => ({
  __esModule: true,
  default: { create: jest.fn() },
}));

describe('Backoffice WhatsApp configuration', () => {
  const originalEnv = { ...process.env };
  const storeId = 'e16997e6-f52e-4bd1-8c72-79ae1b98f3c5';
  let put: jest.Mock;
  let prisma: any;
  let service: BackofficeStoreService;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MICROSERVICE_URL = 'http://microservice:3005';
    process.env.MICROSERVICE_TOKEN = 'shared-token';
    process.env.API_BASE_URL = 'http://legacy:3005';
    process.env.API_KEY = 'legacy-token';
    put = jest.fn().mockResolvedValue({ data: { status: 'success' } });
    (axios.create as jest.Mock).mockReturnValue({ put });
    prisma = {
      store: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: storeId, wppInstance: null }),
        update: jest
          .fn()
          .mockResolvedValue({ id: storeId, wppConfigured: true }),
      },
    };
    service = new BackofficeStoreService(prisma);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('uses the shared microservice token and confirms the provider before enabling the store', async () => {
    put.mockImplementation(async () => {
      expect(prisma.store.update).not.toHaveBeenCalled();
      return { data: { status: 'success' } };
    });
    await service.configureIntegrationWpp({ storeId });
    expect(axios.create).toHaveBeenCalledWith({
      baseURL: 'http://microservice:3005',
      headers: { 'x-micro-token': 'shared-token' },
      timeout: 10000,
    });
    expect(put).toHaveBeenCalledWith('/integrations/whatsapp', {
      storeId,
      instanceId: expect.any(String),
    });
    expect(prisma.store.update).toHaveBeenCalledWith({
      where: { id: storeId },
      data: {
        integrationsEnabled: true,
        wppConfigured: true,
        wppInstance: put.mock.calls[0][1].instanceId,
      },
    });
  });

  it('keeps store flags unchanged when the microservice rejects the request', async () => {
    put.mockRejectedValue(new Error('Request failed with status code 401'));
    await expect(service.configureIntegrationWpp({ storeId })).rejects.toThrow(
      'Failed to enable WhatsApp integration',
    );
    expect(prisma.store.update).not.toHaveBeenCalled();
  });

  it('reuses an existing instance when retrying configuration', async () => {
    prisma.store.findUnique.mockResolvedValue({
      id: storeId,
      wppInstance: 'existing-instance',
    });
    await service.configureIntegrationWpp({ storeId });
    expect(put).toHaveBeenCalledWith('/integrations/whatsapp', {
      storeId,
      instanceId: 'existing-instance',
    });
  });

  it('supports the legacy environment when the new variables are absent', async () => {
    delete process.env.MICROSERVICE_URL;
    delete process.env.MICROSERVICE_TOKEN;
    await service.configureIntegrationWpp({ storeId });
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'http://legacy:3005',
        headers: { 'x-micro-token': 'legacy-token' },
      }),
    );
  });

  it('does not call the microservice for an unknown store', async () => {
    prisma.store.findUnique.mockResolvedValue(null);
    await expect(service.configureIntegrationWpp({ storeId })).rejects.toThrow(
      'Store not found',
    );
    expect(put).not.toHaveBeenCalled();
    expect(prisma.store.update).not.toHaveBeenCalled();
  });
});
