import jwt from 'jsonwebtoken';

export type ProjectMcpTokenPayload = {
  purpose: 'mcp_project';
  projectId: string;
  connectorSlug: string;
};

export function verifyProjectMcpToken(
  token: string,
  secret: string,
): ProjectMcpTokenPayload | null {
  try {
    const payload = jwt.verify(token, secret) as jwt.JwtPayload;
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

export function extractBearerToken(authorization: string | undefined): string | null {
  if (!authorization?.startsWith('Bearer ')) return null;
  const token = authorization.slice('Bearer '.length).trim();
  return token || null;
}
