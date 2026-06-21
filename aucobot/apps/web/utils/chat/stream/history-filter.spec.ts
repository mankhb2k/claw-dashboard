import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  isHiddenToolPayloadText,
  isVisibleChatBubbleText,
  shouldShowHistoryMessage,
} from './history-filter.js'

void describe('isHiddenToolPayloadText', async () => {
  await it('hides web_search JSON payloads', () => {
    const text = JSON.stringify({
      query: 'gold price',
      provider: 'duckduckgo',
      count: 5,
      tookMs: 770,
      results: [{ url: 'https://example.com' }],
    })
    assert.equal(isHiddenToolPayloadText(text), true)
  })

  await it('hides JSON with EXTERNAL_UNTRUSTED_CONTENT blocks', () => {
    const text = JSON.stringify({
      query: 'gold',
      provider: 'duckduckgo',
      results: [],
    })
    assert.equal(
      isHiddenToolPayloadText(
        `${text}\n<<<EXTERNAL_UNTRUSTED_CONTENT id="abc">>>\nsnippet`,
      ),
      true,
    )
  })

  await it('hides JSON embedded after a short prefix', () => {
    const payload = JSON.stringify({
      query: 'giá vàng hôm nay',
      provider: 'duckduckgo',
      tookMs: 770,
      results: [{ title: 'Gold', url: 'https://example.com' }],
    })
    assert.equal(
      isHiddenToolPayloadText(`Search results:\n\n${payload}`),
      true,
    )
  })

  await it('shows normal markdown assistant text', () => {
    assert.equal(
      isHiddenToolPayloadText('**Gold price today:** 14.5M VND per tael'),
      false,
    )
  })
})

void describe('shouldShowHistoryMessage', async () => {
  await it('always shows user messages', () => {
    assert.equal(
      shouldShowHistoryMessage(
        'user',
        JSON.stringify({ query: 'x', provider: 'duckduckgo', results: [] }),
      ),
      true,
    )
  })

  await it('hides tool roles', () => {
    assert.equal(shouldShowHistoryMessage('tool', '{"ok":true}'), false)
    assert.equal(shouldShowHistoryMessage('toolresult', '{"ok":true}'), false)
  })

  await it('hides assistant tool JSON', () => {
    assert.equal(
      shouldShowHistoryMessage(
        'assistant',
        JSON.stringify({
          query: 'test',
          provider: 'duckduckgo',
          tookMs: 1,
        }),
      ),
      false,
    )
  })

  await it('hides tool JSON for non-assistant roles', () => {
    assert.equal(
      shouldShowHistoryMessage(
        'unknown',
        JSON.stringify({
          query: 'test',
          provider: 'duckduckgo',
          tookMs: 1,
        }),
      ),
      false,
    )
  })

  await it('shows assistant markdown answers', () => {
    assert.equal(
      shouldShowHistoryMessage('assistant', 'Here is the answer in plain text.'),
      true,
    )
  })
})

void describe('isVisibleChatBubbleText', async () => {
  await it('hides assistant JSON bubbles', () => {
    assert.equal(
      isVisibleChatBubbleText(
        'assistant',
        JSON.stringify({ query: 'x', provider: 'duckduckgo', results: [] }),
      ),
      false,
    )
  })
})
