import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  isHashMarkdownHref,
  isInternalAppHref,
} from './markdown-link'

void describe('markdown-link', async () => {
  await it('isHashMarkdownHref', () => {
    assert.equal(isHashMarkdownHref('#section'), true)
    assert.equal(isHashMarkdownHref('/dashboard'), false)
  })

  await it('isInternalAppHref', () => {
    assert.equal(isInternalAppHref('/dashboard/chat'), true)
    assert.equal(isInternalAppHref('https://example.com'), false)
    assert.equal(isInternalAppHref('//cdn.example.com/x'), false)
    assert.equal(isInternalAppHref('mailto:a@b.com'), false)
    assert.equal(isInternalAppHref('#top'), false)
    assert.equal(isInternalAppHref(undefined), false)
  })
})
