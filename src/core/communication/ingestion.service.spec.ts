import { EventEmitter2 } from '@nestjs/event-emitter';
import { IngestionService } from './ingestion.service';
import { IncomingEventDto } from './incoming.dto';

const input: IncomingEventDto = {
  storeId: 'store-a',
  eventId: 'event-1',
  externalMessageId: 'external-1',
  externalContactId: 'contact-1',
  channel: 'whatsapp',
  text: 'Hello',
  timestamp: '2026-10-01T10:00:00Z',
};
function setup() {
  const tx = {
    message: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest
        .fn()
        .mockResolvedValue({
          id: 'message-1',
          chatId: 'chat-1',
          sender: 'CUSTOMER',
        }),
      update: jest.fn(),
    },
    temporaryCustomer: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'customer-1' }),
    },
    chat: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'chat-1' }),
      update: jest.fn(),
    },
    deal: { create: jest.fn().mockResolvedValue({ id: 'deal-1' }) },
    inboundEvent: {
      update: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      upsert: jest.fn().mockResolvedValue({ eventId: 'event-1' }),
    },
    store: { findUnique: jest.fn().mockResolvedValue({ id: 'store-a' }) },
  };
  const prisma = { ...tx, $transaction: jest.fn((fn) => fn(tx)) };
  const events = new EventEmitter2();
  jest.spyOn(events, 'emit');
  return {
    tx,
    prisma,
    events,
    service: new IngestionService(prisma as any, events),
  };
}
describe('Incoming communication', () => {
  it('persists an inbox event before acknowledging the transport', async () => {
    const { service, tx } = setup();
    await expect(service.accept(input)).resolves.toEqual({
      accepted: true,
      eventId: 'event-1',
    });
    expect(tx.inboundEvent.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          storeId_eventId_kind: {
            storeId: 'store-a',
            eventId: 'event-1',
            kind: 'message',
          },
        },
        update: {},
      }),
    );
  });
  it('rejects an unknown tenant before storing a message', async () => {
    const { service, tx } = setup();
    tx.store.findUnique.mockResolvedValue(null);
    await expect(service.accept(input)).rejects.toThrow('Store not found');
    expect(tx.inboundEvent.upsert).not.toHaveBeenCalled();
  });
  it('creates a deal, chat and message in one transaction and emits after commit', async () => {
    const { service, tx, events, prisma } = setup();
    await service['process']({ id: 'inbox-1', payload: input } as any);
    expect(tx.message.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sender: 'CUSTOMER',
          content: 'Hello',
          isRead: false,
        }),
      }),
    );
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'Serializable',
    });
    expect(events.emit).toHaveBeenCalledWith(
      'chat.message.received',
      expect.objectContaining({ storeId: 'store-a', chatId: 'chat-1' }),
    );
  });
  it('deduplicates provider messages scoped to their tenant and channel', async () => {
    const { service, tx, events } = setup();
    tx.message.findFirst.mockResolvedValue({ id: 'existing' });
    await service['process']({ id: 'inbox-1', payload: input } as any);
    expect(tx.message.findFirst).toHaveBeenCalledWith({
      where: {
        externalMessageId: 'external-1',
        channel: 'whatsapp',
        chat: { storeId: 'store-a' },
      },
    });
    expect(tx.message.create).not.toHaveBeenCalled();
    expect(events.emit).not.toHaveBeenCalled();
  });
  it('does not acknowledge a message belonging to another tenant', async () => {
    const { service, tx } = setup();
    await expect(
      service.acknowledge({
        storeId: 'store-b',
        messageId: 'message-1',
        status: 'READ',
      }),
    ).rejects.toThrow('Message not found');
    expect(tx.message.findFirst).toHaveBeenCalledWith({
      where: { id: 'message-1', chat: { storeId: 'store-b' } },
    });
    expect(tx.message.update).not.toHaveBeenCalled();
  });
  it('does not downgrade READ on an out-of-order delivery acknowledgement', async () => {
    const { service, tx } = setup();
    tx.message.findFirst.mockResolvedValue({
      id: 'message-1',
      deliveryStatus: 'READ',
    });
    await service.acknowledge({
      storeId: 'store-a',
      messageId: 'message-1',
      status: 'SENT',
    });
    expect(tx.message.update).not.toHaveBeenCalled();
  });
});
