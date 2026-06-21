import { compileAgentsMd } from '@aucobot/workspace-sync/agent-workspace-compile';

import type { AgentFormInput } from '@/schemas/agent-form.schema';
import type { AgentAiEditorCompleteInput } from '@/schemas/project.schema';
import type { AgentEditTab } from '@/stores/agent/agent-editor.store';

export function buildAgentContextFromForm(
  form: Partial<AgentFormInput>,
  activeEditTab?: AgentEditTab,
): AgentAiEditorCompleteInput['agentContext'] {
  const instructionsMode = form.instructionsMode ?? 'simple';
  return {
    name: form.name?.trim() || 'New Agent',
    description: form.description?.trim() || '',
    vibe: form.vibe ?? 'professional',
    tags: form.tags ?? [],
    instructionsMode,
    currentAgentsMd: compileAgentsMd({
      instructionsMode,
      instructionsRole: form.instructionsRole ?? '',
      instructionsRules: form.instructionsRules ?? '',
      instructionsConstraints: form.instructionsConstraints ?? '',
      instructionsOutputFormat: form.instructionsOutputFormat ?? '',
      instructionsAdvanced: form.instructionsAdvanced ?? '',
    }),
    activeEditTab,
    instructionsRole: form.instructionsRole,
    instructionsRules: form.instructionsRules,
    instructionsConstraints: form.instructionsConstraints,
    instructionsOutputFormat: form.instructionsOutputFormat,
  };
}

export const OPTIMIZE_SEED_USER_MESSAGE =
  'Please review and optimize AGENTS.md for this agent based on the current form context. Ask clarifying questions if anything important is missing.';
