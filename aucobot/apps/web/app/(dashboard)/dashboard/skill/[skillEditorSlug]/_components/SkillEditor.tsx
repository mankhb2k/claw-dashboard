"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { Flex } from "@/components/layout";
import { Button, Typography, ToggleGroup, ToggleGroupItem } from "@/components/ui";
import { Share, Edit3, FileText } from "lucide-react";
import { useThemeStore } from "@/stores/theme.store";
import styles from "./SkillEditor.module.css";

export type SkillEditorHandle = {
  applyMarkdown: (markdown: string) => Promise<void>;
  getMarkdown: () => Promise<string>;
};

interface SkillEditorProps {
  initialBodyMarkdown: string;
  onChange: (markdown: string) => void;
  onDebouncedSave: (markdown: string) => void;
  onCopy: () => void;
}

export const SkillEditor = forwardRef<SkillEditorHandle, SkillEditorProps>(
  function SkillEditor(
    { initialBodyMarkdown, onChange, onDebouncedSave, onCopy },
    ref,
  ) {
    const theme = useThemeStore((s) => s.theme);
    const [viewMode, setViewMode] = useState<"editor" | "markdown">("editor");
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
        onChange(out);
        setMarkdownContent(out);
      },
      [editor, onChange],
    );

    useEffect(() => {
      if (!editor || initialized) return;
      void loadMarkdownIntoEditor(initialBodyMarkdown).then(() => setInitialized(true));
    }, [editor, initialBodyMarkdown, initialized, loadMarkdownIntoEditor]);

    const scheduleSave = useCallback(() => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(async () => {
        const markdown = await editor.blocksToMarkdownLossy(editor.document);
        onChange(markdown);
        onDebouncedSave(markdown);
        setMarkdownContent(markdown);
      }, 2500);
    }, [editor, onChange, onDebouncedSave]);

    useImperativeHandle(
      ref,
      () => ({
        applyMarkdown: async (markdown: string) => {
          await loadMarkdownIntoEditor(markdown);
          const out = await editor.blocksToMarkdownLossy(editor.document);
          onChange(out);
          onDebouncedSave(out);
          setMarkdownContent(out);
        },
        getMarkdown: async () => editor.blocksToMarkdownLossy(editor.document),
      }),
      [editor, loadMarkdownIntoEditor, scheduleSave],
    );

    useEffect(() => {
      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }, []);

    const handleChange = () => {
      scheduleSave();
    };

    const handleViewModeChange = async (value: string) => {
      if (!value) return;
      if (value === "markdown") {
        const md = await editor.blocksToMarkdownLossy(editor.document);
        setMarkdownContent(md);
      }
      setViewMode(value as "editor" | "markdown");
    };

    return (
      <div className={styles.documentAreaWrapper}>
        <div className={styles.documentArea}>
          <Flex justify="between" align="center" className={styles.docHeader}>
            <Flex align="center" gap={2}>
              <div className={styles.macDot} style={{ background: "#f87171" }} />
              <div className={styles.macDot} style={{ background: "#fbbf24" }} />
              <div className={styles.macDot} style={{ background: "#4ade80" }} />
            </Flex>

            <Flex align="center" gap={8}>
              <ToggleGroup
                type="single"
                value={viewMode}
                onValueChange={(v) => void handleViewModeChange(v)}
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

          <div className={styles.editorContainer}>
            {viewMode === "editor" ? (
              <BlockNoteView
                editor={editor}
                theme={theme === "dark" ? "dark" : "light"}
                onChange={() => handleChange()}
              />
            ) : (
              <pre className={styles.markdownPreview} aria-readonly="true">
                {markdownContent || "(trống)"}
              </pre>
            )}
          </div>
          {viewMode === "markdown" ? (
            <Typography variant="small" color="muted" className={styles.markdownHint}>
              Chỉ xem. Sửa nội dung ở tab Editor hoặc dùng AI bên phải rồi Áp dụng.
            </Typography>
          ) : null}
        </div>
      </div>
    );
  },
);
