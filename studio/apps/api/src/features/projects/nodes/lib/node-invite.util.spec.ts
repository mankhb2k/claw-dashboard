import {
  generateNodeInviteCode,
  hashNodeInviteCode,
  normalizeNodeInviteCode,
  NODE_INVITE_PREFIX,
  NODE_INVITE_PREFIX_LENGTH,
} from './node-invite.util';

describe('node-invite.util', () => {
  it('generates codes with nd-inv- prefix and stable hash', () => {
    const first = generateNodeInviteCode();
    expect(first.code.startsWith(NODE_INVITE_PREFIX)).toBe(true);
    expect(hashNodeInviteCode(first.code)).toBe(first.codeHash);
    expect(first.codePrefix).toBe(
      first.code.slice(0, NODE_INVITE_PREFIX_LENGTH),
    );
  });

  it('generates unique codes on each call', () => {
    const a = generateNodeInviteCode();
    const b = generateNodeInviteCode();
    expect(a.code).not.toBe(b.code);
    expect(a.codeHash).not.toBe(b.codeHash);
  });

  it('hashes trimmed invite codes', () => {
    const code = `${NODE_INVITE_PREFIX}secret123`;
    expect(hashNodeInviteCode(`  ${code}  `)).toBe(hashNodeInviteCode(code));
  });

  it('normalizes invite codes by trimming whitespace', () => {
    expect(normalizeNodeInviteCode('  nd-inv-abc  ')).toBe('nd-inv-abc');
  });
});
