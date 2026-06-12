import { buildSkillMarkdown, parseSkillMarkdown } from './skill-markdown';

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

    expect(parsed).toEqual({
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

    expect(parsed.name).toBe('slack');
    expect(parsed.description).toBe('Post to Slack channels');
    expect(parsed.heading).toBe('Slack Integration');
    expect(parsed.bodyMarkdown).toContain('post messages');
  });
});
