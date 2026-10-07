import { EventEmitter2 } from '@nestjs/event-emitter';
import axios from 'axios';
import { ChatAiService } from './chat-ai.service';
jest.mock('axios');
const insight = {
  leadDossier: {
    vehicleOfInterest: null,
    hasTradeIn: null,
    tradeInVehicle: null,
    paymentMethod: null,
    perceivedTemperature: 'UNKNOWN',
    mainObjection: null,
  },
  nextBestAction: 'Ask which vehicle interests the customer',
  quickReplies: ['Which vehicle are you interested in?'],
};
describe('Human-reviewed chat AI', () => {
  function setup() {
    const prisma = {
      chat: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ id: 'chat-1', storeId: 'store-a' }),
        update: jest.fn(),
      },
      message: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { id: 'message-1', sender: 'CUSTOMER', content: 'Hello' },
          ]),
        findFirst: jest.fn().mockResolvedValue({ id: 'message-1' }),
      },
    };
    const redis = { set: jest.fn(), zadd: jest.fn() };
    const events = new EventEmitter2();
    jest.spyOn(events, 'emit');
    return {
      prisma,
      redis,
      events,
      service: new ChatAiService(prisma as any, events, redis as any),
    };
  }
  it('enforces tenant ownership before returning insights', async () => {
    const { service, prisma } = setup();
    prisma.chat.findFirst.mockResolvedValue(null);
    await expect(service.get('store-b', 'chat-1')).rejects.toThrow(
      'Chat not found',
    );
    expect(prisma.chat.findFirst).toHaveBeenCalledWith({
      where: { id: 'chat-1', storeId: 'store-b' },
    });
  });
  it('rejects malformed provider responses without saving them', async () => {
    const { service, prisma } = setup();
    (axios.post as jest.Mock).mockResolvedValue({
      data: {
        choices: [
          {
            message: {
              content: JSON.stringify({ ...insight, quickReplies: [123] }),
            },
          },
        ],
      },
    });
    await expect(service['analyze']('store-a', 'chat-1')).rejects.toBeDefined();
    expect(prisma.chat.update).not.toHaveBeenCalled();
  });
  it('stores only a validated insight and notifies the tenant', async () => {
    const { service, prisma, events } = setup();
    (axios.post as jest.Mock).mockResolvedValue({
      data: { choices: [{ message: { content: JSON.stringify(insight) } }] },
    });
    await service['analyze']('store-a', 'chat-1');
    expect(axios.post).toHaveBeenCalledWith(
      process.env.CHAT_AI_URL,
      expect.objectContaining({
        response_format: expect.objectContaining({
          type: 'json_schema',
          json_schema: expect.objectContaining({
            strict: true,
            schema: expect.objectContaining({
              additionalProperties: false,
              required: ['leadDossier', 'nextBestAction', 'quickReplies'],
            }),
          }),
        }),
      }),
      expect.anything(),
    );
    expect(prisma.chat.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'chat-1', storeId: 'store-a' },
        data: { aiInsight: insight, aiAnalyzedAt: expect.any(Date) },
      }),
    );
    expect(events.emit).toHaveBeenCalledWith(
      'chat.ai.ready',
      expect.objectContaining({ storeId: 'store-a', insight }),
    );
  });
  it('reschedules stale analysis when a newer message arrives', async () => {
    const { service, prisma, redis } = setup();
    prisma.message.findFirst.mockResolvedValue({ id: 'message-2' });
    (axios.post as jest.Mock).mockResolvedValue({
      data: { choices: [{ message: { content: JSON.stringify(insight) } }] },
    });
    await service['analyze']('store-a', 'chat-1');
    expect(prisma.chat.update).not.toHaveBeenCalled();
    expect(redis.zadd).toHaveBeenCalled();
  });
});
