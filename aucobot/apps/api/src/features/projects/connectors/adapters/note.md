# Connectors adapters — kế hoạch mở rộng (API key / non-OAuth)

Tài liệu nội bộ cho `features/projects/connectors/adapters/`.  
**Hiện tại:** chỉ Google OAuth (`kind: 'OAUTH'`).  
**Mục tiêu:** thêm connector dùng **API key / PAT / token tĩnh** (`kind: 'API'`) mà không phá flow OAuth hiện có.

---

## 1. Nguyên tắc

| Việc | Đặt ở đâu |
|------|-----------|
| Contract adapter | `lib/connector-adapter.types.ts` |
| Registry (adapter đã implement) | `lib/connector-registry.ts` |
| Logic provider (test key, format secret) | `adapters/<provider>/` |
| Prisma, sync workspace, HTTP map | `services/project-connectors/` + controllers |
| Catalog kind enum | `@aucobot/shared` (`CONNECTOR_KINDS`) |

**Không** switch/case theo `connectorSlug` trong controller — luôn `resolveConnector(slug)` rồi delegate adapter.

Mirror `channels/adapters/telegram`: mỗi connector = 1 file (hoặc folder nếu có util dài) + đăng ký registry.

---

## 2. Hiện trạng (OAuth)

```text
adapters/google/
├── google-oauth.ts                 # HTTP Google token endpoints
├── create-google-oauth-connector.ts
├── google-drive.connector.ts
└── google-calendar.connector.ts
```

`ConnectorAdapter` hiện **bắt buộc** mọi method OAuth (`buildOAuthUrl`, `exchangeOAuthCode`, …).  
Connector API-key **không** cần các method đó → cần refactor type trước connector non-OAuth đầu tiên.

---

## 3. Refactor interface (làm cùng PR connector API-key đầu tiên)

### 3.1 Base + discriminated union (đề xuất)

```typescript
// lib/connector-adapter.types.ts (phác thảo)

type ConnectorAdapterBase = {
  id: string;
  slug: string;
  displayName: string;
  description: string;
  kind: ConnectorKind;
  status: 'ACTIVE' | 'DISABLED' | 'DEPRECATED';
  mcpServerId: string;
  secretKeys: string[];           // NEW — mirror ChannelAdapter
  configSchema?: null;
  testConnection(secrets: Record<string, string>): Promise<ConnectorTestResult>;
};

export type OAuthConnectorAdapter = ConnectorAdapterBase & {
  kind: 'OAUTH';
  oauthScopes: string[];
  isOAuthConfigured(): boolean;
  buildOAuthUrl(params: { state: string; prompt?: 'consent' | 'select_account' }): string;
  exchangeOAuthCode(code: string): Promise<ConnectorOAuthTokens>;
  oauthClientSecrets(): { clientId: string; clientSecret: string } | null;
};

export type ApiConnectorAdapter = ConnectorAdapterBase & {
  kind: 'API';
  // không có OAuth methods
};

export type ConnectorAdapter = OAuthConnectorAdapter | ApiConnectorAdapter;

export function isOAuthConnector(a: ConnectorAdapter): a is OAuthConnectorAdapter {
  return a.kind === 'OAUTH';
}
```

### 3.2 Cập nhật Google adapters

- Thêm `secretKeys: ['client_id', 'client_secret', 'refresh_token']` (hoặc subset document trong adapter).
- `create-google-oauth-connector.ts` giữ nguyên; chỉ type thu hẹp thành `OAuthConnectorAdapter`.

---

## 4. Cấu trúc folder khi thêm API key

```text
adapters/
├── note.md                         # file này
├── google/                         # OAUTH (đã có)
├── github/
│   ├── github.connector.ts
│   └── github.connector.spec.ts
├── notion/
│   └── notion.connector.ts
└── ...
```

**Một connector = một registry entry.** Provider chung (vd. nhiều Google product) có thể share `google-oauth.ts`; GitHub chỉ cần một file nếu logic ngắn.

### Ví dụ phác thảo `github.connector.ts`

```typescript
export const GITHUB_CONNECTOR: ApiConnectorAdapter = {
  id: 'github',
  slug: 'github',
  displayName: 'GitHub',
  description: '…',
  kind: 'API',
  status: 'ACTIVE',
  mcpServerId: 'github',
  secretKeys: ['personal_access_token'],
  configSchema: null,
  async testConnection(secrets) {
    const token = secrets.personal_access_token?.trim();
    if (!token) return { ok: false, message: 'Missing personal_access_token' };
    const res = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) return { ok: false, message: `GitHub API HTTP ${res.status}` };
    const data = (await res.json()) as { login?: string };
    return { ok: true, message: data.login ? `Connected as ${data.login}` : 'Connected' };
  },
};
```

Đăng ký: `lib/connector-registry.ts` → `CONNECTOR_REGISTRY.push(GITHUB_CONNECTOR)`.

---

## 5. Thay đổi service (checklist)

Khi land connector `kind: 'API'`, cập nhật `ProjectConnectorsService`:

| Luồng | OAuth (hiện tại) | API key (mới) |
|-------|------------------|---------------|
| `startOAuth` | build URL, JWT state | **từ chối** hoặc `400` nếu `!isOAuthConnector(adapter)` |
| `handleOAuthCallback` | exchange code, lưu secrets | không đổi (chỉ OAuth) |
| `upsertSecret` | manual / OAuth callback | user nhập key qua `PUT …/secrets/:key` |
| `test` | `adapter.testConnection` | **cùng method** |
| `create` + `enabled: true` | có thể bật sớm (cần xem lại) | **nên** yêu cầu đủ `secretKeys` + `testConnection` ok |
| `update` + `enabled: true` | đã có guard “chưa OAuth” | đổi thành: connected = test ok hoặc status CONNECTED |

**Gợi ý enable guard chung:**

```typescript
function hasRequiredSecrets(adapter: ConnectorAdapter, secrets: Record<string, string>): boolean {
  return adapter.secretKeys.every((k) => secrets[k]?.trim());
}
```

---

## 6. Workspace sync

`workspace.service.ts` đã dùng `resolveConnector(slug).mcpServerId` — **không đổi** khi thêm API adapter, miễn `mcpServerId` đúng với block MCP trong `openclaw.json`.

Secrets merge vào config qua `mergeConnectorsIntoConfig` (`@aucobot/workspace-sync`) — key names phải khớp MCP server doc (thống nhất với `secretKeys`).

---

## 7. Web / API contract

- Catalog: `GET /api/projects/connectors/definitions` — thêm entry khi adapter `ACTIVE`.
- Connect UI:
  - **OAUTH** → nút “Kết nối” → `GET …/oauth/start` → redirect.
  - **API** → form nhập key → `PUT …/secrets/personal_access_token` → `POST …/test`.
- i18n: `lib/i18n/dictionaries/*/connect.ts` — slug overlay tên/mô tả (giống channels).

Không bắt buộc move catalog skeleton sang `@aucobot/shared` trong phase đầu; registry API đủ cho connector đã implement.

---

## 8. Checklist thêm connector mới

1. [ ] Tạo `adapters/<provider>/<slug>.connector.ts` (+ spec gọi API mock).
2. [ ] Nếu `kind: 'API'` — đảm bảo interface đã hỗ trợ (mục 3).
3. [ ] Đăng ký trong `lib/connector-registry.ts`.
4. [ ] `testConnection`: validate format + 1 HTTP call nhẹ tới provider.
5. [ ] Khai báo `secretKeys` — document tên key cho UI và MCP.
6. [ ] Service guards: OAuth-only paths, enable + test cho API.
7. [ ] Web: form secret vs OAuth button theo `kind`.
8. [ ] i18n `connect.services.<slug>` nếu cần.
9. [ ] `rule.md` §connectors — chỉ khi đổi convention (không cần mỗi connector).

---

## 9. `kind: 'MCP'` (tùy chọn sau)

Custom remote MCP (user nhập server URL + optional client id/secret) có thể là `kind: 'MCP'`:

- `secretKeys`: `['server_url']`, optional `client_id`, `client_secret`
- Không OAuth redirect — cấu hình thủ công hoặc wizard riêng
- Cùng pattern `ApiConnectorAdapter` hoặc type `McpConnectorAdapter` riêng nếu cần `validateServerUrl`

---

## 10. Thứ tự triển khai đề xuất

1. Refactor `ConnectorAdapter` → base + OAuth | API union + `secretKeys`.
2. Pilot **một** connector API (vd. GitHub PAT) end-to-end: adapter → service guard → web form → test.
3. Tách helper `createGoogleOAuthConnector` type-safe với `OAuthConnectorAdapter`.
4. Các provider khác (Notion, Slack bot token, …) chỉ thêm file adapter + registry.

**Không** tạo `ConnectorsModule` / controller mới per provider — mọi thứ đi qua registry + adapter hiện có.
