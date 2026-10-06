import { ChatService } from './chat.service';
import { AppErrorBadRequest } from 'src/utils/errors/app-errors';

describe('WhatsApp number verification', () => {
  const storeId = 'e16997e6-f52e-4bd1-8c72-79ae1b98f3c5';
  const number = '5561998621109';
  let post: jest.Mock;
  let service: ChatService;

  beforeEach(() => {
    post = jest.fn();
    service = new ChatService(
      {} as any,
      {} as any,
      {} as any,
      { post } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
  });

  it('uses the microservice phone contract and reads the Evolution result list', async () => {
    post.mockResolvedValue({
      data: { data: [{ exists: true, jid: '556198621109@s.whatsapp.net', number }] },
    });

    await expect(service.whatsappAvailable(storeId, number)).resolves.toEqual({
      exists: true,
      number: '556198621109',
      numberSearch: number,
    });
    expect(post).toHaveBeenCalledWith('/communication/whatsapp/verify-number', {
      storeId,
      phone: number,
    });
  });

  it('returns an unavailable number when the provider explicitly reports it', async () => {
    post.mockResolvedValue({ data: { data: [{ exists: false, number }] } });
    await expect(service.whatsappAvailable(storeId, number)).resolves.toEqual({
      exists: false,
      number: null,
      numberSearch: number,
    });
  });

  it('supports the object response contract', async () => {
    post.mockResolvedValue({ data: { data: { exists: true, number } } });
    await expect(service.whatsappAvailable(storeId, number)).resolves.toEqual({
      exists: true,
      number,
      numberSearch: number,
    });
  });

  it.each([[], {}, null])('rejects an invalid provider response: %j', async (data) => {
    post.mockResolvedValue({ data: { data } });
    await expect(service.whatsappAvailable(storeId, number)).rejects.toBeInstanceOf(
      AppErrorBadRequest,
    );
  });
});
