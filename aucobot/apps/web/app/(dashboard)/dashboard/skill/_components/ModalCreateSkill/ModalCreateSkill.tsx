"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from "@/components/ui";
import { skillDraftSchema, type SkillDraft } from "@/utils/skill/skill-markdown";
import styles from "./ModalCreateSkill.module.css";

interface ModalCreateSkillProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SkillDraft) => void;
  initialData?: SkillDraft;
  editingSlug: string | null;
}

const EMPTY_DRAFT: SkillDraft = {
  name: "",
  description: "",
  heading: "",
};

export function ModalCreateSkill({
  isOpen,
  onClose,
  onSave,
  initialData,
  editingSlug,
}: ModalCreateSkillProps) {
  const [draft, setDraft] = useState<SkillDraft>(EMPTY_DRAFT);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsSubmitted(false);
      if (initialData) {
        setDraft(initialData);
      } else {
        setDraft(EMPTY_DRAFT);
      }
    }
  }, [initialData, isOpen]);

  const parsedDraft = useMemo(() => skillDraftSchema.safeParse(draft), [draft]);

  const nameError = useMemo(() => {
    if (!isSubmitted) return undefined;
    if (parsedDraft.success) return undefined;
    const fe = parsedDraft.error.flatten().fieldErrors;
    return fe.name?.length
      ? "Use lowercase letters, numbers, and hyphens only."
      : undefined;
  }, [parsedDraft, isSubmitted]);

  const descriptionError = useMemo(() => {
    if (!isSubmitted) return undefined;
    if (parsedDraft.success) return undefined;
    const fe = parsedDraft.error.flatten().fieldErrors;
    return fe.description?.length ? "Description is required." : undefined;
  }, [parsedDraft, isSubmitted]);

  const handleSaveClick = () => {
    setIsSubmitted(true);
    if (parsedDraft.success) {
      onSave(parsedDraft.data);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={styles.content}>
        <DialogHeader>
          <DialogTitle>
            {editingSlug ? "Edit skill info" : "Create new skill"}
          </DialogTitle>
          <DialogDescription>
            {editingSlug
              ? "Update the skill name and description shown in the directory."
              : "Create a new skill with a unique slug for this project."}
          </DialogDescription>
        </DialogHeader>

        <div className={styles.body}>
          <div>
            <Input
              id="skill-name"
              label="Slug"
              value={draft.name}
              autoComplete="off"
              spellCheck={false}
              error={nameError}
              disabled={!!editingSlug}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, name: e.target.value }))
              }
            />
            <p className={styles.hint}>Unique identifier, e.g. &quot;google-search&quot;</p>
          </div>

          <div>
            <Input
              id="skill-description"
              label="Short description"
              value={draft.description}
              autoComplete="off"
              spellCheck={false}
              error={descriptionError}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, description: e.target.value }))
              }
            />
            <p className={styles.hint}>What this skill does for agents.</p>
          </div>

          <div>
            <Input
              id="skill-heading"
              label="Display heading"
              value={draft.heading ?? ""}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, heading: e.target.value }))
              }
            />
            <p className={styles.hint}>Friendly title, e.g. &quot;Google Search&quot;</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveClick}
            disabled={isSubmitted && !parsedDraft.success}
          >
            {editingSlug ? "Update" : "Create & continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
