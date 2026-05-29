"use client";

import React from "react";
import { AgentEditorLayout } from "../AgentEditorLayout/AgentEditorLayout";

interface ClientAgentIdPageProps {
  agentId: string;
}

export function ClientAgentIdPage({ agentId }: ClientAgentIdPageProps) {
  return <AgentEditorLayout agentId={agentId} isEditing />;
}
