export const AGENT_PANEL_APPLY_AGENTS_MD = 'agent-panel:apply-agents-md';

export type AgentPanelApplyAgentsMdDetail = {
  markdown: string;
  mode: 'advanced' | 'simple';
  /** When mode=simple, optional field updates parsed from markdown */
  fields?: {
    instructionsRole?: string;
    instructionsRules?: string;
    instructionsConstraints?: string;
    instructionsOutputFormat?: string;
  };
};

export function dispatchApplyAgentsMd(detail: AgentPanelApplyAgentsMdDetail) {
  window.dispatchEvent(
    new CustomEvent(AGENT_PANEL_APPLY_AGENTS_MD, { detail }),
  );
}
