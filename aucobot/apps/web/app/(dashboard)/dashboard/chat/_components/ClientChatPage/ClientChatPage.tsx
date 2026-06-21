"use client";

import styles from "./ClientChatPage.module.css";
import { useClientChatPage } from "./use-client-chat-page";
import { ChatPanel } from "../ChatPanel/ChatPanel";
import { ChatSidebar } from "../ChatSidebar/ChatSidebar";
import { useI18n } from "@/lib/i18n";

export function ClientChatPage() {
  const { t } = useI18n();
  const chat = useClientChatPage();

  if (!chat.hasProject) {
    return (
      <p className={styles.muted}>
        {t("chat.errors.noProject")}
      </p>
    );
  }

  return (
    <div className={styles.panel}>
      <ChatSidebar
        sessions={chat.sessions}
        loading={chat.sessionsLoading}
        creating={chat.creatingSession}
        activeSessionKey={chat.sessionKey}
        agentId={chat.agentId}
        collapsed={chat.sidebarCollapsed}
        disabled={chat.sessionSidebarDisabled}
        searchQuery={chat.sessionSearch}
        onSearchChange={chat.setSessionSearch}
        onToggleCollapse={chat.handleToggleSidebar}
        onSelectSession={chat.handleSelectSession}
        onNewSession={() => void chat.handleNewSession()}
        onRenameSession={chat.handleRenameSession}
        onDeleteSession={chat.handleDeleteSession}
      />

      <ChatPanel
        projectDisplayName={chat.project?.displayName}
        projectStatus={chat.project?.status}
        ready={chat.ready}
        statusLoading={chat.statusLoading}
        connectionState={chat.connectionState}
        error={chat.error}
        onConnect={chat.connectChat}
        onOpenSetup={chat.openSetup}
        agentId={chat.agentId}
        agentOptions={chat.agentOptions}
        onAgentChange={chat.handleAgentChange}
        thinkingLevel={chat.thinkingLevel}
        thinkingOptions={chat.thinkingSelectOptions}
        onThinkingChange={chat.handleThinkingChange}
        thinkingSaving={chat.thinkingSaving}
        providerId={chat.providerId}
        providerOptions={chat.providerSelectOptions}
        onProviderChange={chat.handleProviderChange}
        modelId={chat.modelId}
        modelOptions={chat.modelSelectOptions}
        onModelChange={chat.handleModelChange}
        modelsLoading={chat.modelsLoading}
        modelSaving={chat.modelSaving}
        hasProviders={chat.hasProviders}
        messages={chat.messages}
        streamText={chat.streamText}
        sending={chat.sending}
        input={chat.input}
        onInputChange={chat.setInput}
        onSend={(payload) => void chat.handleSend(payload)}
        onAbort={() => void chat.handleAbort()}
        sessionActionsDisabled={chat.sessionSidebarDisabled}
        onNewSession={() => void chat.handleNewSession()}
        projectId={chat.projectId}
        sandboxActive={chat.sandboxActive}
        stagingMaxBytes={chat.stagingMaxBytes}
        contextUsage={chat.activeContextUsage}
        sessionKey={chat.sessionKey}
        liveItems={chat.liveItems}
        showToolPreparing={chat.showToolPreparing}
        modelHint={chat.modelHint}
        invokableSkills={chat.invokableSkills}
        invokableSkillsLoading={chat.invokableSkillsLoading}
      />
    </div>
  );
}
