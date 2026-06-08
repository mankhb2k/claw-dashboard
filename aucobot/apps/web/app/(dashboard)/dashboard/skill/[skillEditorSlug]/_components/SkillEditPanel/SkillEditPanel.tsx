"use client";

import type { RefObject } from "react";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { Flex, Container } from "@/components/layout";
import { BackButton } from "@/components/dashboard";
import { Button, Typography } from "@/components/ui";
import type { ProjectSkillDetail } from "@/schemas/project.schema";
import {
  SkillEditor,
  type SkillEditorHandle,
} from "../SkillEditor";
import styles from "./SkillEditPanel.module.css";

export type SkillEditPanelProps = {
  skill: ProjectSkillDetail;
  skillPanelOpen: boolean;
  onToggleSkillPanel: () => void;
  saveStatus: "idle" | "saving" | "saved" | "error";
  saveError: string | null;
  onToggleEnabled: () => void;
  editorRef: RefObject<SkillEditorHandle | null>;
  initialBodyMarkdown: string;
  onBodyChange: (markdown: string) => void;
  onDebouncedSave: (markdown: string) => void;
  onCopy: () => void;
};

export function SkillEditPanel({
  skill,
  skillPanelOpen,
  onToggleSkillPanel,
  saveStatus,
  saveError,
  onToggleEnabled,
  editorRef,
  initialBodyMarkdown,
  onBodyChange,
  onDebouncedSave,
  onCopy,
}: SkillEditPanelProps) {
  return (
    <div
      className={`${styles.root} ${!skillPanelOpen ? styles.rootExpanded : ""}`}
    >
      <Container
        size={skillPanelOpen ? "full" : "md"}
        display="flex"
        className={styles.shell}
      >
        <Flex justify="between" align="center" className={styles.topBar}>
          <BackButton href="/dashboard/skill">Back to Skills</BackButton>
          <Flex align="center" gap={12}>
            {saveStatus === "saving" ? (
              <Typography variant="small" color="muted">
                Đang lưu...
              </Typography>
            ) : null}
            {saveStatus === "saved" ? (
              <Typography variant="small" color="muted">
                Đã lưu
                {skill.enabled ? " · đã sync OpenClaw" : ""}
              </Typography>
            ) : null}
            {saveStatus === "error" && saveError ? (
              <Typography variant="small" className={styles.error}>
                {saveError}
              </Typography>
            ) : null}
            <Button variant="outline" size="sm" onClick={onToggleEnabled}>
              {skill.enabled ? "Tắt skill" : "Bật & sync"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="md"
              iconOnly
              onClick={onToggleSkillPanel}
              aria-label={
                skillPanelOpen ? "Hide skill assistant" : "Show skill assistant"
              }
              aria-pressed={skillPanelOpen}
              title={
                skillPanelOpen ? "Hide skill assistant" : "Show skill assistant"
              }
            >
              {skillPanelOpen ? (
                <PanelRightClose size={18} />
              ) : (
                <PanelRightOpen size={18} />
              )}
            </Button>
          </Flex>
        </Flex>

        <div className={styles.editorBody}>
          <SkillEditor
            ref={editorRef}
            initialBodyMarkdown={initialBodyMarkdown}
            onChange={onBodyChange}
            onDebouncedSave={onDebouncedSave}
            onCopy={onCopy}
          />
        </div>
      </Container>
    </div>
  );
}
