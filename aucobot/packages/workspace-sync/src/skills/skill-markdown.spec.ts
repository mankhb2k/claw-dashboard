import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildSkillMarkdown, parseSkillMarkdown } from './skill-markdown.js';

describe('skill-markdown', () => {
  it('round-trips build then parse', () => {
    const draft = {
      name: 'my-skill',
      description: 'Does something useful',
      heading: 'My Skill',
    };
    const body = 'Step one.\n\nStep two.';
    const markdown = buildSkillMarkdown(draft, body);
    const parsed = parseSkillMarkdown(markdown);

    assert.deepEqual(parsed, {
      name: 'my-skill',
      description: 'Does something useful',
      heading: 'My Skill',
      bodyMarkdown: body,
    });
  });

  it('parses ClawHub-style markdown with fallbacks', () => {
    const markdown = `---
name: slack
description: Post to Slack channels
---
# Slack Integration

Use this skill to post messages.
`;
    const parsed = parseSkillMarkdown(markdown, {
      fallbackSlug: 'slack',
      fallbackDescription: 'Fallback summary',
      fallbackHeading: 'Slack',
    });

    assert.equal(parsed.name, 'slack');
    assert.equal(parsed.description, 'Post to Slack channels');
    assert.equal(parsed.heading, 'Slack Integration');
    assert.ok(parsed.bodyMarkdown.includes('post messages'));
  });
});
