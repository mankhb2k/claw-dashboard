import { useCreateBlockNote } from "@blocknote/react"
import { BlockNoteView } from "@blocknote/mantine"
import "@blocknote/core/fonts/inter.css"
import "@blocknote/mantine/style.css"
import { useEffect } from "react"

interface SkillEditorProps {
  onChange: (markdown: string) => void
  initialMarkdown?: string
}

export function SkillEditor({ onChange, initialMarkdown }: SkillEditorProps) {
  const editor = useCreateBlockNote()

  useEffect(() => {
    async function loadInitial() {
      if (initialMarkdown && editor.document.length === 1 && editor.document[0].content === undefined) {
        const blocks = await editor.tryParseMarkdownToBlocks(initialMarkdown)
        editor.replaceBlocks(editor.document, blocks)
      }
    }
    void loadInitial()
  }, [editor, initialMarkdown])

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', minHeight: '300px' }}>
      <BlockNoteView
        editor={editor}
        onChange={async () => {
          const markdown = await editor.blocksToMarkdownLossy(editor.document)
          onChange(markdown)
        }}
      />
    </div>
  )
}
