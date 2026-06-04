"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  Input,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui";
import styles from "./ModalAddConnection.module.css";

interface ModalAddConnectionProps {
  isOpen: boolean;
  onClose: () => void;
  provider: { name: string };
  mode: "add" | "edit";
  editingConn: { name: string; key: string } | null;
  editKeyLoading?: boolean;
  onSubmit: (data: { keyName: string; apiKey: string }) => void;
}

export function ModalAddConnection({
  isOpen,
  onClose,
  provider,
  mode,
  editingConn,
  editKeyLoading = false,
  onSubmit,
}: ModalAddConnectionProps) {
  const isEdit = mode === "edit";
  const [keyName, setKeyName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isEdit && editingConn) {
        setKeyName(editingConn.name);
        setApiKey(editingConn.key);
      } else {
        setKeyName("");
        setApiKey("");
      }
      setShowApiKey(isEdit);
    }
  }, [isOpen, isEdit, editingConn]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ keyName, apiKey });
  };

  const apiKeyDisabled = isEdit && editKeyLoading;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? `Update key ${provider.name}`
              : `Add key ${provider.name}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Key Name"
            placeholder="Example: Default Connection"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            required
          />
          <div className={styles.apiKeyField}>
            <Input
              label="API Key"
              placeholder={isEdit ? "Loading key..." : "sk-..."}
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={apiKeyDisabled}
              required
            />
            <button
              type="button"
              className={styles.eyeBtn}
              onClick={() => setShowApiKey((prev) => !prev)}
              disabled={apiKeyDisabled || !apiKey}
              aria-label={showApiKey ? "Ẩn key" : "Hiện key"}
            >
              {showApiKey ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={onClose} type="button">
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={apiKeyDisabled || !apiKey.trim()}
            >
              {isEdit ? "Update" : "Add key"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
