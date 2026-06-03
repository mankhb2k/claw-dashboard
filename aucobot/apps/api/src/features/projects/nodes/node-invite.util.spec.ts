import {
  generateNodeInviteCode,
  hashNodeInviteCode,
  NODE_INVITE_PREFIX,
} from './node-invite.util';

describe('node-invite.util', () => {
  it('generates codes with nd-inv- prefix and stable hash', () => {
    const first = generateNodeInviteCode();
    expect(first.code.startsWith(NODE_INVITE_PREFIX)).toBe(true);
    expect(hashNodeInviteCode(first.code)).toBe(first.codeHash);
    expect(first.codePrefix).toBe(first.code.slice(0, 14));
  });
});
