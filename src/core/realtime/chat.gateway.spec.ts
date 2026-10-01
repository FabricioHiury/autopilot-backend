import { ChatGateway } from './chat.gateway';
describe('Tenant WebSocket rooms', () => {
  function setup() {
    const jwt = {
      verifyAsync: jest
        .fn()
        .mockResolvedValue({
          sub: 'user-a',
          storeId: 'forged-store',
          exp: Math.floor(Date.now() / 1000) + 60,
        }),
    };
    const auth = {
      validateAuth: jest
        .fn()
        .mockResolvedValue({ id: 'user-a', storeId: 'store-a' }),
    };
    const redis = { publish: jest.fn() };
    const socket = {
      handshake: { auth: { token: 'jwt', storeId: 'store-b' } },
      data: {},
      join: jest.fn(),
      disconnect: jest.fn(),
      once: jest.fn(),
    };
    return {
      jwt,
      auth,
      redis,
      socket,
      gateway: new ChatGateway(jwt as any, auth as any, redis as any),
    };
  }
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });
  it('uses database membership instead of a client-supplied store', async () => {
    jest.useFakeTimers();
    const { gateway, socket } = setup();
    await gateway.handleConnection(socket as any);
    expect(socket.join).toHaveBeenCalledWith('store:store-a');
    expect(socket.join).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(61000);
    expect(socket.disconnect).toHaveBeenCalledWith(true);
  });
  it('rejects invalid JWTs without joining a room', async () => {
    const { gateway, jwt, socket } = setup();
    jwt.verifyAsync.mockRejectedValue(new Error('invalid'));
    await gateway.handleConnection(socket as any);
    expect(socket.join).not.toHaveBeenCalled();
    expect(socket.disconnect).toHaveBeenCalledWith(true);
  });
  it('rejects password reset tokens', async () => {
    const { gateway, jwt, socket } = setup();
    jwt.verifyAsync.mockResolvedValue({ reset: true, exp: 9999999999 } as any);
    await gateway.handleConnection(socket as any);
    expect(socket.join).not.toHaveBeenCalled();
  });
  it('publishes with an explicit tenant for multi-instance delivery', async () => {
    const { gateway, redis } = setup();
    await gateway.publish('message:received', {
      storeId: 'store-a',
      chatId: 'chat-1',
    });
    expect(redis.publish).toHaveBeenCalledWith(
      'crm:realtime',
      JSON.stringify({
        storeId: 'store-a',
        event: 'message:received',
        payload: { storeId: 'store-a', chatId: 'chat-1' },
      }),
    );
  });
});
