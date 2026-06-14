import jwt from 'jsonwebtoken';

export type ProjectMcpTokenPayload = {
  purpose: 'mcp_project';
  projectId: string;
  connectorSlug: string;
};

const DEFAULT_MCP_TOKEN_TTL_SEC = 7 * 24 * 3600;

export function getMcpServiceSecret(): string | null {
  const secret = process.env.MCP_SERVICE_SECRET?.trim();
  return secret || null;
}

export function signProjectMcpToken(params: {
  projectId: string;
  connectorSlug: string;
  secret?: string;
  expiresInSec?: number;
}): string {
  const secret = params.secret?.trim() || getMcpServiceSecret();
  if (!secret) {
    throw new Error('MCP_SERVICE_SECRET is not configured');
  }

  const payload: ProjectMcpTokenPayload = {
    purpose: 'mcp_project',
    projectId: params.projectId.trim(),
    connectorSlug: params.connectorSlug.trim(),
  };

  return jwt.sign(payload, secret, {
    expiresIn: params.expiresInSec ?? DEFAULT_MCP_TOKEN_TTL_SEC,
  });
}

export function verifyProjectMcpToken(
  token: string,
  secret?: string,
): ProjectMcpTokenPayload | null {
  const key = secret?.trim() || getMcpServiceSecret();
  if (!key) return null;

  try {
    const payload = jwt.verify(token, key) as jwt.JwtPayload;
    if (payload.purpose !== 'mcp_project') return null;
    if (typeof payload.projectId !== 'string' || !payload.projectId.trim()) return null;
    if (typeof payload.connectorSlug !== 'string' || !payload.connectorSlug.trim()) return null;
    return {
      purpose: 'mcp_project',
      projectId: payload.projectId.trim(),
      connectorSlug: payload.connectorSlug.trim(),
    };
  } catch {
    return null;
  }
}
