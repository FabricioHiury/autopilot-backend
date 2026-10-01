import { ApiKeyService } from './guard.service';
describe('Microservice authentication', () => {
  const original = process.env.MICROSERVICE_TOKEN;
  afterEach(() => {
    if (original === undefined) delete process.env.MICROSERVICE_TOKEN;
    else process.env.MICROSERVICE_TOKEN = original;
  });
  it('accepts only the configured secret', () => {
    process.env.MICROSERVICE_TOKEN = 'test-secret';
    const service = new ApiKeyService();
    expect(service.validateApiKey('test-secret')).toBe(true);
    expect(service.validateApiKey('test')).toBe(false);
    expect(service.validateApiKey('wrong-value')).toBe(false);
    expect(service.validateApiKey(undefined as any)).toBe(false);
  });
});
