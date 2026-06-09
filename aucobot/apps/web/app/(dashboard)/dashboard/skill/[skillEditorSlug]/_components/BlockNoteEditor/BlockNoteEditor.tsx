"use client";

import type { BlockNoteEditor as BlockNoteEditorInstance } from "@blocknote/core";
import { BlockNoteViewEditor } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { Circle, Edit3, FileText, Share } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { Flex } from "@/components/layout";
import {
  Button,
  Typography,
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui";
import styles from "./BlockNoteEditor.module.css";

const MAC_WINDOW_DOTS = ["#f87171", "#fbbf24", "#4ade80"] as const;

export type BlockNoteViewMode = "editor" | "markdown";

export type BlockNoteEditorProps = {
  editor: BlockNoteEditorInstance;
  theme: "light" | "dark";
  onChange?: () => void;
  viewMode: BlockNoteViewMode;
  onViewModeChange: (mode: BlockNoteViewMode) => void;
  markdownPreview: string;
  onCopy: () => void;
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
}: BlockNoteEditorProps) {
  const bnShellRef = useRef<HTMLDivElement>(null);

  // BlockNote mounts floating UI (table +, handles) on document.body by default,
  // which paints above in-flow headers. Keep portal inside the editor shell instead.
  useEffect(() => {
    if (viewMode !== "editor") return;
    const shell = bnShellRef.current;
    if (!shell) return;

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
      color="var(--color-card)"
      className={styles.documentArea}
    >
      {/* Header*/}
      <Flex justify="between" align="center" className={styles.docHeader}>
        {/* Mac dots */}
        <Flex align="center" gap={4}>
          {MAC_WINDOW_DOTS.map((color) => (
            <Circle
              key={color}
              size={12}
              fill={color}
              stroke={color}
              aria-hidden
            />
          ))}
        </Flex>

        {/* View mode toggle and copy action */}
        <Flex align="center" gap={8}>
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

          <Button variant="ghost" size="sm" onClick={onCopy}>
            <Share size={14} style={{ marginRight: 6 }} />
            Copy SKILL.md
          </Button>
        </Flex>
      </Flex>

      {/* Body — BlockNote editor hoặc markdown preview (scroll bên trong editorScroll) */}
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
