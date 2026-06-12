import { parseAgentAiEditorResponse } from './agent-ai-editor.prompt';

describe('parseAgentAiEditorResponse', () => {
  it('parses clarify with questions', () => {
    const result = parseAgentAiEditorResponse(
      JSON.stringify({
        phase: 'clarify',
        message: 'Need more detail',
        questions: ['Who is the audience?'],
      }),
    );
    expect(result.phase).toBe('clarify');
    expect(result.questions).toEqual(['Who is the audience?']);
  });

  it('parses optimize with markdown', () => {
    const result = parseAgentAiEditorResponse(
      JSON.stringify({
        phase: 'optimize',
        message: 'Done',
        markdown: '# Role\nYou are helpful.',
      }),
    );
    expect(result.phase).toBe('optimize');
    expect(result.markdown).toContain('# Role');
  });

  it('strips json fences', () => {
    const result = parseAgentAiEditorResponse(
      '```json\n{"phase":"clarify","message":"Hi","questions":["Q?"]}\n```',
    );
    expect(result.message).toBe('Hi');
  });
});
