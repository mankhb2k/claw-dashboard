'use client'

import React, { useMemo, useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { Flex } from '@/components/layout'
import { Typography, Input, Button, Avatar, Select, Card } from '@/components/ui'
import { X } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import type { AgentFormInput, AgentVibe } from '@/schemas/agent-form.schema'
import styles from './CardIdentity.module.css'

function normalizeTag(raw: string) {
  return raw.trim().toLowerCase().replace(/[\s#]/g, '-')
}

interface CardIdentityProps {
  collaborationSlot?: React.ReactNode;
  joinCollaborationSlot?: React.ReactNode;
}

export function CardIdentity({
  collaborationSlot,
  joinCollaborationSlot,
}: CardIdentityProps) {
  const { t } = useI18n()
  const vibeOptions = useMemo(
    () =>
      [
        { value: 'professional' as AgentVibe, label: t('agent.identity.vibe.professional') },
        { value: 'friendly' as AgentVibe, label: t('agent.identity.vibe.friendly') },
        { value: 'strict' as AgentVibe, label: t('agent.identity.vibe.strict') },
      ],
    [t],
  )

  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<AgentFormInput>()

  const avatar = watch('avatar')
  const tags = watch('tags')
  const [tagDraft, setTagDraft] = useState('')

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' && e.key !== ',') return
    e.preventDefault()
    const val = normalizeTag(tagDraft)
    if (!val || tags.includes(val)) {
      setTagDraft('')
      return
    }
    setValue('tags', [...tags, val], { shouldValidate: true, shouldDirty: true })
    setTagDraft('')
  }

  const handleRemoveTag = (tag: string) => {
    setValue(
      'tags',
      tags.filter((item) => item !== tag),
      { shouldValidate: true, shouldDirty: true },
    )
  }

  const tagsError =
    typeof errors.tags?.message === 'string' ? errors.tags.message : undefined

  return (
    <Card className={styles.card} disableHover>
      <div className={styles.cardHeader}>
        <Typography variant="p" weight="bold">
          {t('agent.identity.title')}
        </Typography>
        {collaborationSlot}
      </div>

      <Flex align="center" gap={4} className={styles.avatarRow}>
        <Avatar src="" fallback={avatar} size="lg" />
        <Button type="button" variant="outline" size="sm">
          {t('agent.identity.uploadImage')}
        </Button>
      </Flex>

      <Input
        id="agent-name"
        label={t('agent.identity.name.label')}
        placeholder={t('agent.identity.name.placeholder')}
        error={errors.name?.message}
        {...register('name')}
      />

      <Input
        id="agent-description"
        label={t('agent.identity.description.label')}
        placeholder={t('agent.identity.description.placeholder')}
        error={errors.description?.message}
        {...register('description')}
      />

      <div className={styles.inputGroup}>
        <Typography variant="small" weight="medium">
          {t('agent.identity.tags.label')}
        </Typography>
        <div className={styles.tagContainer}>
          {tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              #{tag}
              <button
                type="button"
                className={styles.tagDeleteBtn}
                onClick={() => handleRemoveTag(tag)}
                aria-label={t('agent.identity.tags.removeAria', { tag })}
              >
                <X size={13} className={styles.tagDeleteIcon} />
              </button>
            </span>
          ))}
          <input
            type="text"
            className={styles.tagInput}
            placeholder={
              tags.length === 0
                ? t('agent.identity.tags.placeholder')
                : t('agent.identity.tags.placeholderAdd')
            }
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={handleAddTag}
            aria-invalid={!!tagsError}
          />
        </div>
        {tagsError ? (
          <span className={styles.fieldError}>{tagsError}</span>
        ) : null}
        <Typography variant="small" color="muted">
          {t('agent.identity.tags.hint')}
        </Typography>
      </div>

      <Controller
        name="vibe"
        control={control}
        render={({ field }) => (
          <Select
            id="agent-vibe"
            label={t('agent.identity.vibe.label')}
            options={vibeOptions}
            value={field.value}
            onValueChange={field.onChange}
            error={errors.vibe?.message}
          />
        )}
      />

      {joinCollaborationSlot}
    </Card>
  )
}
