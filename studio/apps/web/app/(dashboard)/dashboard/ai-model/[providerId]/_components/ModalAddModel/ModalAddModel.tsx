"use client";

import { useState } from "react";

import styles from "./ModalAddModel.module.css";
import {
  Input,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Typography,
} from "@/components/ui";

interface ModalAddModelProps {
  isOpen: boolean;
  onClose: () => void;
  providerName: string;
  modelRefHint?: string;
  defaultOpenclawId?: string;
  onSubmit: (data: {
    openclawId: string;
    displayName?: string;
    setDefault: boolean;
  }) => void;
  submitting?: boolean;
}

export function ModalAddModel({
  isOpen,
  onClose,
  providerName,
  modelRefHint,
  defaultOpenclawId = "",
  onSubmit,
  submitting = false,
}: ModalAddModelProps) {
  const [openclawId, setOpenclawId] = useState(defaultOpenclawId);
  const [displayName, setDisplayName] = useState("");
  const [setDefault, setSetDefault] = useState(true);
  const [trackedOpenKey, setTrackedOpenKey] = useState("");

  const openKey = isOpen ? defaultOpenclawId : "";

  if (isOpen && openKey !== trackedOpenKey) {
    setTrackedOpenKey(openKey);
    setOpenclawId(defaultOpenclawId);
    setDisplayName("");
    setSetDefault(true);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedId = openclawId.trim();
    if (!trimmedId) return;
    onSubmit({
      openclawId: trimmedId,
      displayName: displayName.trim() || undefined,
      setDefault,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add model — {providerName}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className={styles.form}>
          {modelRefHint && (
            <Typography variant="small" color="muted">
              Use OpenClaw model ref format: <code>{modelRefHint}</code>
            </Typography>
          )}

          <Input
            label="OpenClaw model ref"
            placeholder={modelRefHint ?? "provider/model-id"}
            value={openclawId}
            onChange={(e) => setOpenclawId(e.target.value)}
            required
          />

          <Input
            label="Display name (optional)"
            placeholder="Friendly label in chat picker"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={setDefault}
              onChange={(e) => setSetDefault(e.target.checked)}
            />
            <span>Set as default model for this provider</span>
          </label>

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={submitting || !openclawId.trim()}
            >
              {submitting ? "Adding..." : "Add model"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
