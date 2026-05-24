"use client";

import { useState, useMemo, useEffect } from "react";
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input } from "@/components/ui";
import { skillDraftSchema, type SkillDraft } from "@/lib/skill-markdown";
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
    return fe.name?.length ? "Tên chỉ gồm chữ cái, số, dấu gạch ngang." : undefined;
  }, [parsedDraft, isSubmitted]);

  const descriptionError = useMemo(() => {
    if (!isSubmitted) return undefined;
    if (parsedDraft.success) return undefined;
    const fe = parsedDraft.error.flatten().fieldErrors;
    return fe.description?.length ? "Mô tả không được để trống." : undefined;
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
            {editingSlug ? "Sửa thông tin Skill" : "Khởi tạo Skill mới"}
          </DialogTitle>
        </DialogHeader>

        <div className={styles.body}>
          <div>
            <Input
              id="skill-name"
              label="Tên định danh (Slug)"
              value={draft.name}
              autoComplete="off"
              spellCheck={false}
              error={nameError}
              disabled={!!editingSlug}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, name: e.target.value }))
              }
            />
            <p className={styles.hint}>Tên duy nhất, ví dụ: "google-search"</p>
          </div>

          <div>
            <Input
              id="skill-description"
              label="Mô tả ngắn"
              value={draft.description}
              autoComplete="off"
              spellCheck={false}
              error={descriptionError}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, description: e.target.value }))
              }
            />
            <p className={styles.hint}>
              Mô tả vai trò của skill này.
            </p>
          </div>

          <div>
            <Input
              id="skill-heading"
              label="Tiêu đề hiển thị (Heading)"
              value={draft.heading ?? ""}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, heading: e.target.value }))
              }
            />
            <p className={styles.hint}>Tiêu đề thân thiện, ví dụ: "Tìm kiếm Google"</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveClick}
            disabled={isSubmitted && !parsedDraft.success}
          >
            {editingSlug ? "Cập nhật" : "Tạo & Tiếp tục"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
