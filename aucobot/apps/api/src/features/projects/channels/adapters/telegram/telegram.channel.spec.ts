jest.mock('@aucobot/shared', () => jest.requireActual('@aucobot/shared'));

import { TELEGRAM_CHANNEL } from './telegram.channel';

const VALID_TOKEN = '123456789:ABCDEFghijklmnopQRSTUVwxyz';

describe('TELEGRAM_CHANNEL', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  describe('testConnection', () => {
    it('rejects invalid bot token format', async () => {
      const result = await TELEGRAM_CHANNEL.testConnection(
        { bot_token: 'not-a-token' },
        {},
      );
      expect(result).toEqual({
        ok: false,
        message: 'Invalid bot token format',
      });
      expect(global.fetch).toBe(originalFetch);
    });

    it('returns connected label when Telegram getMe succeeds', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({
            ok: true,
            result: { username: 'my_test_bot', first_name: 'Test' },
          }),
      }) as typeof fetch;

      const result = await TELEGRAM_CHANNEL.testConnection(
        { bot_token: VALID_TOKEN },
        {},
      );

      expect(global.fetch).toHaveBeenCalledWith(
        `https://api.telegram.org/bot${VALID_TOKEN}/getMe`,
      );
      expect(result).toEqual({
        ok: true,
        message: 'Connected as @my_test_bot',
        metadata: { botUsername: 'my_test_bot' },
      });
    });

    it('returns API error message when getMe fails', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({
            ok: false,
            description: 'Unauthorized',
          }),
      }) as typeof fetch;

      const result = await TELEGRAM_CHANNEL.testConnection(
        { bot_token: VALID_TOKEN },
        {},
      );

      expect(result).toEqual({ ok: false, message: 'Unauthorized' });
    });
  });

  describe('buildOpenClawConfig', () => {
    it('builds telegram slice with access rules', () => {
      const slice = TELEGRAM_CHANNEL.buildOpenClawConfig(
        { bot_token: VALID_TOKEN },
        { dmPolicy: 'allowlist', allowFrom: ['8734062810'] },
      );

      expect(slice).toEqual({
        botToken: VALID_TOKEN,
        dmPolicy: 'allowlist',
        groupPolicy: 'disabled',
        allowFrom: ['8734062810'],
      });
    });

    it('throws when bot token missing', () => {
      expect(() =>
        TELEGRAM_CHANNEL.buildOpenClawConfig({}, { dmPolicy: 'open' }),
      ).toThrow('bot_token required');
    });
  });

  describe('normalizeConfig', () => {
    it('merges patch over existing config', () => {
      const normalized = TELEGRAM_CHANNEL.normalizeConfig(
        { dmPolicy: 'pairing', allowFrom: ['8734062810'] },
        { dmPolicy: 'allowlist', allowFrom: ['1234567890'] },
      );

      expect(normalized.dmPolicy).toBe('allowlist');
      expect(normalized.allowFrom).toEqual(['1234567890']);
    });

    it('defaultConfig matches allowlist baseline', () => {
      expect(TELEGRAM_CHANNEL.defaultConfig()).toEqual({
        dmPolicy: 'allowlist',
        allowFrom: [],
      });
    });
  });
});
