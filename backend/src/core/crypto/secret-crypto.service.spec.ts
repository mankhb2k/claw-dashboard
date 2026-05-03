import { SecretCryptoService } from './secret-crypto.service';

describe('SecretCryptoService', () => {
  const prev = process.env.PROJECT_SECRETS_MASTER_KEY;

  afterEach(() => {
    process.env.PROJECT_SECRETS_MASTER_KEY = prev;
  });

  it('roundtrips utf8 plaintext', () => {
    process.env.PROJECT_SECRETS_MASTER_KEY = 'aa'.repeat(32);
    const svc = new SecretCryptoService();
    svc.onModuleInit();
    const plain = 'sk-test-\u{1F512}';
    const enc = svc.encryptUtf8(plain);
    expect(enc).not.toContain(plain);
    expect(svc.decryptUtf8(enc)).toBe(plain);
  });
});
