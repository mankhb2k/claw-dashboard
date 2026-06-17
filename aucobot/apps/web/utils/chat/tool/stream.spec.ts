import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { REDACTED, redactSensitiveText } from './redact.js'
import {
  extractWebSources,
  truncateToolOutput,
} from './output.js'
import {
  applyToolActivityPatch,
  CANONICAL_TOOL_IDS,
  mergeLiveAssistantText,
  parseAgentToolPayload,
  parseToolGatewayEvent,
  resolveCanonicalToolId,
  resolveToolActivityI18nKey,
  toActivityList,
} from './stream.js'

describe('parseAgentToolPayload', () => {
  it('parses tool start as running', () => {
    const patch = parseAgentToolPayload(
      {
        sessionKey: 'agent:main:main',
        stream: 'tool',
        data: {
          phase: 'start',
          toolCallId: 'call_1',
          name: 'web_search',
        },
      },
      'agent',
    )
    assert.ok(patch)
    assert.equal(patch.status, 'running')
    assert.equal(patch.id, 'call_1')
  })

  it('parses tool result as done', () => {
    const patch = parseAgentToolPayload(
      {
        sessionKey: 'agent:main:main',
        stream: 'tool',
        data: {
          phase: 'result',
          toolCallId: 'call_1',
          name: 'web_search',
          result: { ok: true },
        },
      },
      'agent',
    )
    assert.ok(patch)
    assert.equal(patch.status, 'done')
  })

  it('parses tool result with isError as error', () => {
    const patch = parseAgentToolPayload(
      {
        sessionKey: 'agent:main:main',
        stream: 'tool',
        data: {
          phase: 'result',
          toolCallId: 'call_1',
          name: 'exec',
          isError: true,
        },
      },
      'agent',
    )
    assert.ok(patch)
    assert.equal(patch.status, 'error')
  })

  it('parses flat tool fields on payload root', () => {
    const patch = parseAgentToolPayload(
      {
        sessionKey: 'agent:main:main',
        stream: 'tool',
        phase: 'start',
        toolCallId: 'call_flat',
        name: 'web_fetch',
      },
      'agent',
    )
    assert.ok(patch)
    assert.equal(patch.name, 'web_fetch')
    assert.equal(patch.status, 'running')
  })

  it('accepts session key alias on payload.key', () => {
    const patch = parseToolGatewayEvent(
      'session.tool',
      {
        key: 'agent:main:main',
        phase: 'start',
        id: 'call_key',
        toolName: 'browser',
      },
      'agent:main:main',
    )
    assert.ok(patch)
    assert.equal(patch.name, 'browser')
  })
})

describe('parseToolGatewayEvent session filter', () => {
  it('accepts matching session key', () => {
    const patch = parseToolGatewayEvent(
      'session.tool',
      {
        sessionKey: 'agent:main:main',
        data: {
          phase: 'start',
          toolCallId: 'call_2',
          name: 'read',
        },
      },
      'agent:main:main',
    )
    assert.ok(patch)
    assert.equal(patch.name, 'read')
  })

  it('rejects other session keys', () => {
    const patch = parseToolGatewayEvent(
      'agent',
      {
        sessionKey: 'agent:other:main',
        stream: 'tool',
        data: {
          phase: 'start',
          toolCallId: 'call_3',
          name: 'read',
        },
      },
      'agent:main:main',
    )
    assert.equal(patch, null)
  })
})

describe('resolveCanonicalToolId and i18n keys', () => {
  it('maps search alias to web_search', () => {
    assert.equal(resolveCanonicalToolId('search'), 'web_search')
    assert.equal(
      resolveToolActivityI18nKey('search', 'running'),
      'chat.toolActivity.tools.web_search.running',
    )
  })

  it('maps bash alias to exec', () => {
    assert.equal(resolveCanonicalToolId('bash'), 'exec')
    assert.equal(
      resolveToolActivityI18nKey('bash', 'done'),
      'chat.toolActivity.tools.exec.done',
    )
  })

  it('resolves all canonical tool ids to non-generic keys', () => {
    for (const id of CANONICAL_TOOL_IDS) {
      assert.equal(resolveCanonicalToolId(id), id)
      assert.equal(
        resolveToolActivityI18nKey(id, 'running'),
        `chat.toolActivity.tools.${id}.running`,
      )
    }
  })

  it('falls back to generic for unknown tools', () => {
    assert.equal(resolveCanonicalToolId('listCalendars'), null)
    assert.equal(
      resolveToolActivityI18nKey('listCalendars', 'running'),
      'chat.toolActivity.generic.running',
    )
  })
})

describe('applyToolActivityPatch', () => {
  it('tracks parallel tool calls independently', () => {
    let map = new Map()
    map = applyToolActivityPatch(map, {
      id: 'a',
      name: 'web_search',
      status: 'running',
      updatedAt: 1,
      startedAt: 1,
    })
    map = applyToolActivityPatch(map, {
      id: 'b',
      name: 'exec',
      status: 'running',
      updatedAt: 2,
      startedAt: 2,
    })
    assert.equal(map.size, 2)
    const list = toActivityList(map)
    assert.equal(list.length, 2)
  })

  it('updates existing tool call on duplicate events', () => {
    let map = new Map()
    map = applyToolActivityPatch(map, {
      id: 'a',
      name: 'web_search',
      status: 'running',
      updatedAt: 1,
      startedAt: 1,
    })
    map = applyToolActivityPatch(map, {
      id: 'a',
      name: 'web_search',
      status: 'done',
      updatedAt: 5,
    })
    assert.equal(map.size, 1)
    assert.equal(map.get('a')?.status, 'done')
    assert.equal(map.get('a')?.startedAt, 1)
  })

  it('limits activity list to max entries with running first', () => {
    let map = new Map()
    for (let i = 0; i < 6; i += 1) {
      map = applyToolActivityPatch(map, {
        id: `done-${i}`,
        name: 'read',
        status: 'done',
        updatedAt: i,
        startedAt: i,
      })
    }
    map = applyToolActivityPatch(map, {
      id: 'running-1',
      name: 'exec',
      status: 'running',
      updatedAt: 99,
      startedAt: 99,
    })
    const list = toActivityList(map)
    assert.equal(list.length, 5)
    assert.equal(list[0]?.id, 'running-1')
  })

  it('stores partial output on update phase', () => {
    let map = new Map()
    map = applyToolActivityPatch(map, {
      id: 'exec-1',
      name: 'exec',
      status: 'running',
      phase: 'start',
      updatedAt: 1,
      startedAt: 1,
      args: { command: 'echo hello' },
    })
    map = applyToolActivityPatch(map, {
      id: 'exec-1',
      name: 'exec',
      status: 'running',
      phase: 'update',
      updatedAt: 2,
      partialResult: 'hello\n',
    })
    const entry = map.get('exec-1')
    assert.ok(entry?.outputPreview?.includes('hello'))
  })

  it('redacts secrets in tool output', () => {
    let map = new Map()
    map = applyToolActivityPatch(map, {
      id: 'exec-secret',
      name: 'exec',
      status: 'done',
      phase: 'result',
      updatedAt: 1,
      startedAt: 1,
      result: { stdout: 'Bearer sk-1234567890abcdef' },
    })
    const entry = map.get('exec-secret')
    assert.ok(entry?.outputFull?.includes(REDACTED))
    assert.equal(entry?.outputFull?.includes('sk-1234567890abcdef'), false)
  })

  it('extracts web sources from search results', () => {
    let map = new Map()
    map = applyToolActivityPatch(map, {
      id: 'search-1',
      name: 'web_search',
      status: 'done',
      phase: 'result',
      updatedAt: 1,
      startedAt: 1,
      args: { query: 'gold price' },
      result: {
        results: [{ url: 'https://example.com/gold', title: 'Gold' }],
      },
    })
    const entry = map.get('search-1')
    assert.equal(entry?.sources?.[0]?.domain, 'example.com')
  })
})

describe('tool output helpers', () => {
  it('redacts bearer tokens in plain text', () => {
    const text = redactSensitiveText('Authorization: Bearer abc.def.ghi')
    assert.ok(text.includes(REDACTED))
  })

  it('truncates long output previews', () => {
    const long = 'x'.repeat(600)
    const { preview, truncated } = truncateToolOutput(long, 500)
    assert.equal(truncated, true)
    assert.ok(preview.endsWith('…'))
  })

  it('extracts urls from nested result objects', () => {
    const sources = extractWebSources('web_search', { query: 'test' }, {
      items: [{ href: 'https://news.example.com/a' }],
    })
    assert.equal(sources[0]?.domain, 'news.example.com')
  })
})

describe('mergeLiveAssistantText', () => {
  it('joins flushed segments and trailing stream text', () => {
    const merged = mergeLiveAssistantText(
      [{ type: 'text', text: 'Let me check.' }],
      'Here is the answer.',
    )
    assert.equal(merged, 'Let me check.\n\nHere is the answer.')
  })
})
