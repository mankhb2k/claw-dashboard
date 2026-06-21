import { normalizeAssistantMarkdown } from './skill-ai-editor.prompt';

describe('normalizeAssistantMarkdown', () => {
  it('strips markdown fences', () => {
    expect(normalizeAssistantMarkdown('```markdown\n# Title\n```')).toBe(
      '# Title',
    );
  });

  it('returns trimmed plain text unchanged', () => {
    expect(normalizeAssistantMarkdown('  # Title  ')).toBe('# Title');
  });
});
