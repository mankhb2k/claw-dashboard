import {
  modelIdsEquivalent,
  resolveEffectiveAgentModel,
} from './agent-model.resolve';
import type { ChatModelProviderGroup } from '../chat/project-model-catalog';

const providers: ChatModelProviderGroup[] = [
  {
    providerId: 'gemini',
    displayName: 'Google Gemini',
    defaultModel: 'google/gemini-2.5-flash',
    tested: true,
    models: [
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        openclawId: 'google/gemini-2.5-flash',
      },
    ],
  },
];

describe('agent-model.resolve', () => {
  it('matches provider-prefixed and short ids', () => {
    expect(modelIdsEquivalent('claude-3-5-sonnet', 'anthropic/claude-3-5-sonnet')).toBe(
      true,
    );
    expect(modelIdsEquivalent('google/gemini-2.5-flash', 'gemini-2.5-flash')).toBe(
      true,
    );
  });

  it('falls back to project primary when legacy model is absent from catalog', () => {
    expect(
      resolveEffectiveAgentModel({
        formModel: 'claude-3-5-sonnet',
        projectPrimary: 'google/gemini-2.5-flash',
        providers,
      }),
    ).toBe('google/gemini-2.5-flash');
  });

  it('keeps catalog model when form value is valid', () => {
    expect(
      resolveEffectiveAgentModel({
        formModel: 'google/gemini-2.5-flash',
        projectPrimary: 'google/gemini-2.5-flash',
        providers,
      }),
    ).toBe('google/gemini-2.5-flash');
  });

  it('returns empty when no provider is connected', () => {
    expect(
      resolveEffectiveAgentModel({
        formModel: 'claude-3-5-sonnet',
        projectPrimary: 'google/gemini-2.5-flash',
        providers: [],
      }),
    ).toBe('');
  });
});
