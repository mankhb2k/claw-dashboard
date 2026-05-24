'use client'

import React from 'react'
import { useFormContext } from 'react-hook-form'
import { Flex } from '@/components/layout'
import { Typography, Button, Card, Input, ToggleGroup, ToggleGroupItem } from '@/components/ui'
import { FileText, LayoutList, Zap } from 'lucide-react'
import type { AgentFormInput } from '@/schemas/agentForm.schema'
import styles from './CardInstructions.module.css'

export function CardInstructions() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<AgentFormInput>()

  const mode = watch('instructionsMode')

  return (
    <Card className={styles.card} disableHover>
      <Flex justify="between" align="center" className={styles.header}>
        <Typography variant="p" weight="bold">
          Chỉ thị vận hành (AGENTS.md)
        </Typography>
        <Button type="button" variant="ghost" size="sm" className={styles.aiBtn}>
          <Zap size={14} />
          Tối ưu bằng AI
        </Button>
      </Flex>

      <Typography variant="small" color="muted">
        Biên dịch ra AGENTS.md (chỉ thị vận hành) và TOOLS.md (ghi chú môi trường). Giọng điệu
        SOUL.md lấy từ tab Identity. Cấu hình model/sandbox nằm ở tab Capabilities.
      </Typography>

      <ToggleGroup
        type="single"
        value={mode}
        onValueChange={(value) => {
          if (value === 'simple' || value === 'advanced') {
            setValue('instructionsMode', value, { shouldDirty: true })
          }
        }}
        size="sm"
        className={styles.modeToggle}
      >
        <ToggleGroupItem value="simple" className={styles.modeItem}>
          <LayoutList size={14} aria-hidden />
          Đơn giản
        </ToggleGroupItem>
        <ToggleGroupItem value="advanced" className={styles.modeItem}>
          <FileText size={14} aria-hidden />
          Markdown
        </ToggleGroupItem>
      </ToggleGroup>

      {mode === 'simple' ? (
        <div className={styles.simpleFields}>
          <Input
            id="instructions-role"
            label="Vai trò"
            placeholder="Agent này làm gì? Phục vụ ai?"
            error={errors.instructionsRole?.message}
            {...register('instructionsRole')}
          />

          <div className={styles.field}>
            <label className={styles.label} htmlFor="instructions-rules">
              Quy tắc (mỗi dòng một ý)
            </label>
            <textarea
              id="instructions-rules"
              className={styles.textarea}
              rows={5}
              placeholder={'Luôn xác nhận trước khi xóa dữ liệu\nƯu tiên trả lời ngắn gọn'}
              {...register('instructionsRules')}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="instructions-constraints">
              Giới hạn (mỗi dòng một ý)
            </label>
            <textarea
              id="instructions-constraints"
              className={styles.textarea}
              rows={4}
              placeholder={'Không tiết lộ API key\nKhông chạy lệnh nguy hiểm'}
              {...register('instructionsConstraints')}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="instructions-output">
              Định dạng đầu ra (tùy chọn)
            </label>
            <textarea
              id="instructions-output"
              className={styles.textarea}
              rows={2}
              placeholder="VD: Trả lời bằng tiếng Việt, có bullet khi liệt kê."
              {...register('instructionsOutputFormat')}
            />
          </div>
        </div>
      ) : (
        <div className={styles.field}>
          <label className={styles.label} htmlFor="instructions-advanced">
            AGENTS.md (Markdown)
          </label>
          <textarea
            id="instructions-advanced"
            className={`${styles.textarea} ${styles.textareaTall}`}
            placeholder={'# Vai trò\n...'}
            aria-invalid={!!errors.instructionsAdvanced}
            {...register('instructionsAdvanced')}
          />
          {errors.instructionsAdvanced?.message ? (
            <span className={styles.fieldError}>{errors.instructionsAdvanced.message}</span>
          ) : null}
        </div>
      )}

      <hr className={styles.divider} />

      <Typography variant="p" weight="bold">
        Ghi chú công cụ (TOOLS.md)
      </Typography>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="tools-notes">
          Ghi chú môi trường (tùy chọn)
        </label>
        <textarea
          id="tools-notes"
          className={styles.textarea}
          rows={4}
          placeholder="VD: Tên camera, host SSH, giọng TTS ưa thích..."
          {...register('toolsNotes')}
        />
        <Typography variant="small" color="muted">
          Ghi chú đặc thù setup — không thay thế cấu hình trong openclaw.json.
        </Typography>
      </div>
    </Card>
  )
}
