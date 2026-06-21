import styles from '../MessageBox.module.css'
import { parseLeadingSelectedSkill } from '@/utils/chat/skill-slash'

type InputMirrorProps = {
  value: string
  knownSlugs: readonly string[]
}

export function InputMirror({ value, knownSlugs }: InputMirrorProps) {
  const parsed = parseLeadingSelectedSkill(value, knownSlugs)
  if (!parsed) return null

  return (
    <>
      <span className={styles.skillCommand}>{parsed.command}</span>
      {parsed.rest.length > 0 ? (
        <span className={styles.skillCommandTail}>
          {' '}
          {parsed.rest}
        </span>
      ) : null}
    </>
  )
}
