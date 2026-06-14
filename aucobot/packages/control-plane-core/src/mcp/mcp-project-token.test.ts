import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { signProjectMcpToken, verifyProjectMcpToken } from './mcp/mcp-project-token.js';

describe('mcp-project-token', () => {
  it('signs and verifies project token', () => {
    const secret = 'test-mcp-service-secret-min-16-chars';
    const token = signProjectMcpToken({
      projectId: 'proj_1',
      connectorSlug: 'google-drive',
      secret,
    });
    const payload = verifyProjectMcpToken(token, secret);
    assert.deepEqual(payload, {
      purpose: 'mcp_project',
      projectId: 'proj_1',
      connectorSlug: 'google-drive',
    });
  });
});
