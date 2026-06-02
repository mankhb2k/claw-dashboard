'use client'

import React, { useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { Flex } from '@/components/layout'
import { Typography, Input, Button, Avatar, Select, Card } from '@/components/ui'
import { X } from 'lucide-react'
import type { AgentFormInput, AgentVibe } from '@/schemas/agentForm.schema'
import styles from './CardIdentity.module.css'

const VIBE_OPTIONS: { value: AgentVibe; label: string }[] = [
  { value: 'professional', label: 'Professional & Polite' },
  { value: 'friendly', label: 'Friendly & Open' },
  { value: 'strict', label: 'Strict & Precise' },
]

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
      tags.filter((t) => t !== tag),
      { shouldValidate: true, shouldDirty: true },
    )
  }

  const tagsError =
    typeof errors.tags?.message === 'string' ? errors.tags.message : undefined

  return (
    <Card className={styles.card} disableHover>
      <div className={styles.cardHeader}>
        <Typography variant="p" weight="bold">
          Basic information
        </Typography>
        {collaborationSlot}
      </div>

      <Flex align="center" gap={4} className={styles.avatarRow}>
        <Avatar src="" fallback={avatar} size="lg" />
        <Button type="button" variant="outline" size="sm">
          Upload image
        </Button>
      </Flex>

      <Input
        id="agent-name"
        label="Agent name"
        placeholder="e.g. Customer Support, Data Analyst..."
        error={errors.name?.message}
        {...register('name')}
      />

      <Input
        id="agent-description"
        label="Short description"
        placeholder="What is this agent's main job?"
        error={errors.description?.message}
        {...register('description')}
      />

      <div className={styles.inputGroup}>
        <Typography variant="small" weight="medium">
          Tags
        </Typography>
        <div className={styles.tagContainer}>
          {tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              #{tag}
              <button
                type="button"
                className={styles.tagDeleteBtn}
                onClick={() => handleRemoveTag(tag)}
                aria-label={`Remove tag ${tag}`}
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
                ? 'Enter a tag (e.g. support, finance...) and press Enter...'
                : 'Add tag...'
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
          Tags help group and filter agents when you have many in a project.
        </Typography>
      </div>

      <Controller
        name="vibe"
        control={control}
        render={({ field }) => (
          <Select
            id="agent-vibe"
            label="Tone (Vibe)"
            options={VIBE_OPTIONS}
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
