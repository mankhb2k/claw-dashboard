import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { extractBearerToken, verifyProjectMcpToken } from './verify-project-token.js';

const SECRET = 'test-mcp-service-secret-min-16';

describe('verifyProjectMcpToken', () => {
  it('accepts valid project token', () => {
    const token = jwt.sign(
      { purpose: 'mcp_project', projectId: 'proj_1', connectorSlug: 'google-drive' },
      SECRET,
      { expiresIn: 3600 },
    );
    const payload = verifyProjectMcpToken(token, SECRET);
    assert.deepEqual(payload, {
      purpose: 'mcp_project',
      projectId: 'proj_1',
      connectorSlug: 'google-drive',
    });
  });

  it('rejects wrong secret', () => {
    const token = jwt.sign(
      { purpose: 'mcp_project', projectId: 'proj_1', connectorSlug: 'google-drive' },
      SECRET,
    );
    assert.equal(verifyProjectMcpToken(token, 'other-secret'), null);
  });

  it('extracts bearer token', () => {
    assert.equal(extractBearerToken('Bearer abc.def.ghi'), 'abc.def.ghi');
    assert.equal(extractBearerToken(undefined), null);
  });
});
