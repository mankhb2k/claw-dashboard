export { gatewayTokenForNewProject } from './gateway-token.js';
export { decryptSecret, encryptSecret, maskSecret } from './crypto/secret-crypto.js';
export {
  openGatewayUpstream,
  callGatewayRpc,
  GatewayRpcError,
} from './chat/gateway-upstream.js';
export { CHAT_RPC_WHITELIST, isAllowedChatRpc } from './chat/chat-rpc-whitelist.js';
export { sessionKeyForAgent } from './chat/session-key.util.js';
export {
  buildDeviceAuthPayloadV3,
  buildSignedConnectDevice,
  OPERATOR_SCOPES,
  publicKeyRawBase64UrlFromPem,
  signDevicePayload,
} from './chat/gateway-device-auth.js';
export {
  loadOrCreateGatewayDeviceIdentity,
  type GatewayDeviceIdentity,
} from './chat/gateway-device-identity.js';
export {
  approveProxyDeviceIfPending,
  isPairingRequiredError,
} from './chat/gateway-device-pairing.js';
export {
  AUTH_COOKIES,
  accessMaxAgeSec,
  refreshMaxAgeSec,
  refreshExpiresAt,
} from './auth/auth.constants.js';
export {
  toPublicUser,
  normalizeUsername,
  type PublicUser,
} from './auth/auth-user.util.js';
export {
  signAccessToken,
  verifyAccessToken,
  getJwtSecret,
  type JwtAccessPayload,
} from './auth/jwt-tokens.js';
export {
  extractAccessTokenFromRequest,
  extractRefreshTokenFromRequest,
  verifyAccessTokenFromRequest,
  type VerifiedJwtUser,
} from './auth/jwt-verify.util.js';
export {
  hashRefreshToken,
  generateRefreshTokenRaw,
} from './auth/refresh-token.util.js';
export {
  AGENT_API_TOKEN_PREFIX,
  AGENT_API_TOKEN_PREFIX_LENGTH,
  generateAgentApiToken,
  hashAgentApiToken,
} from './auth/agent-api-token.util.js';
export {
  AUTH_COOKIE_CLEAR_PATHS,
  buildAuthCookieSpecs,
  buildClearAuthCookieSpecs,
  type AuthCookieOptions,
  type AuthCookieSpec,
} from './auth/auth-cookies.util.js';
export {
  ensureSelfHostDefaultUser,
  selfHostDisplayNameFromEnv,
  selfHostUsernameFromEnv,
  selfHostLoginFromEnv,
  selfHostPasswordFromEnv,
} from './auth/self-host-user.js';
