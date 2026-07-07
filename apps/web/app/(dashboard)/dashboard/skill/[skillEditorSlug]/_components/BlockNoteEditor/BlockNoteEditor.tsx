"use client";

import { BlockNoteView } from "@blocknote/mantine";
import { BlockNoteViewEditor } from "@blocknote/react";
import "@blocknote/mantine/style.css";
import {
  Check,
  Circle,
  Copy,
  Edit3,
  FileText,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

import styles from "./BlockNoteEditor.module.css";
import { Flex } from "@/components/layout";
import {
  Button,
  Typography,
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui";

import type { BlockNoteEditor as BlockNoteEditorInstance } from "@blocknote/core";

const MAC_WINDOW_DOT_CLASSES = [
  styles.macDotClose,
  styles.macDotMinimize,
  styles.macDotMaximize,
] as const;

export type BlockNoteViewMode = "editor" | "markdown";

export type BlockNoteSaveStatus = "idle" | "saving" | "saved" | "error";

export type BlockNoteEditorProps = {
  editor: BlockNoteEditorInstance;
  theme: "light" | "dark";
  onChange?: () => void;
  viewMode: BlockNoteViewMode;
  onViewModeChange: (mode: BlockNoteViewMode) => void;
  markdownPreview: string;
  onCopy: () => void;
  saveStatus: BlockNoteSaveStatus;
  saveError?: string | null;
  skillEnabled?: boolean;
  assistantPanelOpen?: boolean;
  onToggleAssistantPanel?: () => void;
};

export function BlockNoteScrollArea({ children }: { children: ReactNode }) {
  return (
    <div className={styles.editorScroll}>
      <div className={styles.contentWrap}>{children}</div>
    </div>
  );
}

export function BlockNoteEditor({
  editor,
  theme,
  onChange,
  viewMode,
  onViewModeChange,
  markdownPreview,
  onCopy,
  saveStatus,
  saveError,
  skillEnabled = false,
  assistantPanelOpen = false,
  onToggleAssistantPanel,
}: BlockNoteEditorProps) {
  const bnShellRef = useRef<HTMLDivElement>(null);

  // BlockNote mounts floating UI (table +, handles) on document.body by default,
  // which paints above in-flow headers. Keep portal inside the editor shell instead.
  useEffect(() => {
    if (viewMode !== "editor") return undefined;
    const shell = bnShellRef.current;
    if (!shell) return undefined;

    const reparentPortal = () => {
      const portal = editor.portalElement;
      if (portal.parentElement !== shell) {
        shell.appendChild(portal);
      }
    };

    reparentPortal();

    const observer = new MutationObserver(() => {
      if (editor.portalElement.parentElement === document.body) {
        reparentPortal();
      }
    });
    observer.observe(document.body, { childList: true });

    return () => observer.disconnect();
  }, [editor, viewMode]);

  return (
    <Flex
      direction="column"
      border
      radius="lg"
      fullWidth
      fullHeight
      color="var(--color-card-background)"
      className={styles.documentArea}
    >
      {/* Header */}
      <div className={styles.docHeader}>
        <Flex align="center" gap={4} className={styles.headerStart}>
          {MAC_WINDOW_DOT_CLASSES.map((dotClass) => (
            <Circle
              key={dotClass}
              size={12}
              className={dotClass}
              aria-hidden
            />
          ))}
        </Flex>

        <Flex align="center" justify="center" className={styles.headerCenter}>
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => {
              if (value === "editor" || value === "markdown") {
                onViewModeChange(value);
              }
            }}
          >
            <ToggleGroupItem value="editor" aria-label="Editor">
              <Edit3 size={14} />
            </ToggleGroupItem>
            <ToggleGroupItem value="markdown" aria-label="Markdown preview">
              <FileText size={14} />
            </ToggleGroupItem>
          </ToggleGroup>
        </Flex>

        <Flex align="center" gap={8} className={styles.headerEnd}>
          <Flex align="center" className={styles.saveStatus} aria-live="polite">
            {saveStatus === "saving" ? (
              <Typography variant="small" color="muted">
                Saving...
              </Typography>
            ) : null}
            {saveStatus === "saved" ? (
              <Flex align="center" gap={4} className={styles.saveSuccess}>
                <Check size={14} strokeWidth={2.5} aria-hidden />
                <Typography variant="small" as="span">
                  Saved
                  {skillEnabled ? " · synced to OpenClaw" : ""}
                </Typography>
              </Flex>
            ) : null}
            {saveStatus === "error" && saveError ? (
              <Typography variant="small" className={styles.saveError}>
                {saveError}
              </Typography>
            ) : null}
          </Flex>

          <Button variant="ghost" size="sm" onClick={onCopy}>
            <Copy size={14} aria-hidden />
            Copy
          </Button>

          {onToggleAssistantPanel ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              iconOnly
              onClick={onToggleAssistantPanel}
              aria-label={
                assistantPanelOpen
                  ? "Hide skill assistant"
                  : "Show skill assistant"
              }
              aria-pressed={assistantPanelOpen}
              title={
                assistantPanelOpen
                  ? "Hide skill assistant"
                  : "Show skill assistant"
              }
            >
              {assistantPanelOpen ? (
                <PanelRightClose size={16} />
              ) : (
                <PanelRightOpen size={16} />
              )}
            </Button>
          ) : null}
        </Flex>
      </div>

      {/* Body — BlockNote editor or markdown preview */}
      <div className={styles.editorPane}>
        {viewMode === "editor" ? (
          <div ref={bnShellRef} className={styles.bnShell}>
            <BlockNoteView
              renderEditor={false}
              className={styles.bnView}
              editor={editor}
              theme={theme}
              onChange={onChange}
            >
              <BlockNoteScrollArea>
                <BlockNoteViewEditor />
              </BlockNoteScrollArea>
            </BlockNoteView>
          </div>
        ) : (
          <BlockNoteScrollArea>
            <pre className={styles.markdownPreview} aria-readonly="true">
              {markdownPreview || "(empty)"}
            </pre>
          </BlockNoteScrollArea>
        )}
      </div>

      {/* Body footer — just a hint when viewing markdown */}
      {viewMode === "markdown" ? (
        <Typography
          variant="small"
          color="muted"
          className={styles.markdownHint}
        >
          View only. Edit content in the Editor tab or use the AI panel on the
          right.
        </Typography>
      ) : null}
    </Flex>
  );
}
