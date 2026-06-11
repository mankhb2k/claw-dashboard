"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { Flex, Container } from "@/components/layout";
import { BackButton } from "@/components/dashboard";
import { resolveThemeAppearance } from "@/lib/theme/theme-resolve";
import { useThemeStore } from "@/stores/theme.store";
import type { ProjectSkillDetail } from "@/schemas/project.schema";
import {
  BlockNoteEditor,
  type BlockNoteViewMode,
} from "../BlockNoteEditor";
import styles from "./SkillEditPanel.module.css";

export type SkillEditorHandle = {
  applyMarkdown: (markdown: string) => Promise<void>;
  getMarkdown: () => Promise<string>;
};

export type SkillEditPanelProps = {
  skill: ProjectSkillDetail;
  skillPanelOpen: boolean;
  onToggleSkillPanel: () => void;
  saveStatus: "idle" | "saving" | "saved" | "error";
  saveError: string | null;
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
  editorRef,
  initialBodyMarkdown,
  onBodyChange,
  onDebouncedSave,
  onCopy,
}: SkillEditPanelProps) {
  const theme = useThemeStore((s) => s.theme);
  const [viewMode, setViewMode] = useState<BlockNoteViewMode>("editor");
  const [markdownContent, setMarkdownContent] = useState<string>("");
  const [initialized, setInitialized] = useState(false);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editor = useCreateBlockNote();

  const loadMarkdownIntoEditor = useCallback(
    async (md: string) => {
      const trimmed = md.trim();
      if (trimmed) {
        const blocks = await editor.tryParseMarkdownToBlocks(trimmed);
        editor.replaceBlocks(editor.document, blocks);
      } else {
        editor.replaceBlocks(editor.document, []);
      }
      const out = await editor.blocksToMarkdownLossy(editor.document);
      onBodyChange(out);
      setMarkdownContent(out);
    },
    [editor, onBodyChange],
  );

  useEffect(() => {
    if (!editor || initialized) return;
    void loadMarkdownIntoEditor(initialBodyMarkdown).then(() =>
      setInitialized(true),
    );
  }, [editor, initialBodyMarkdown, initialized, loadMarkdownIntoEditor]);

  const scheduleSave = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(async () => {
      const markdown = await editor.blocksToMarkdownLossy(editor.document);
      onBodyChange(markdown);
      onDebouncedSave(markdown);
      setMarkdownContent(markdown);
    }, 2500);
  }, [editor, onBodyChange, onDebouncedSave]);

  useImperativeHandle(
    editorRef,
    () => ({
      applyMarkdown: async (markdown: string) => {
        await loadMarkdownIntoEditor(markdown);
        const out = await editor.blocksToMarkdownLossy(editor.document);
        onBodyChange(out);
        onDebouncedSave(out);
        setMarkdownContent(out);
      },
      getMarkdown: async () => editor.blocksToMarkdownLossy(editor.document),
    }),
    [editor, loadMarkdownIntoEditor, onBodyChange, onDebouncedSave],
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleViewModeChange = useCallback(
    async (mode: BlockNoteViewMode) => {
      if (mode === "markdown") {
        const md = await editor.blocksToMarkdownLossy(editor.document);
        setMarkdownContent(md);
      }
      setViewMode(mode);
    },
    [editor],
  );

  return (
    <div
      className={`${styles.root} ${!skillPanelOpen ? styles.rootExpanded : ""}`}
    >
      <Container
        size={skillPanelOpen ? "full" : "md"}
        display="flex"
        className={styles.shell}
      >
        <Flex align="center" className={styles.topBar}>
          <BackButton href="/dashboard/skill">Back to Skills</BackButton>
        </Flex>

        <div className={styles.editorBody}>
          <BlockNoteEditor
            editor={editor}
            theme={resolveThemeAppearance(theme)}
            onChange={() => scheduleSave()}
            viewMode={viewMode}
            onViewModeChange={(mode) => void handleViewModeChange(mode)}
            markdownPreview={markdownContent}
            onCopy={onCopy}
            saveStatus={saveStatus}
            saveError={saveError}
            skillEnabled={skill.enabled}
            assistantPanelOpen={skillPanelOpen}
            onToggleAssistantPanel={onToggleSkillPanel}
          />
        </div>
      </Container>
    </div>
  );
}
