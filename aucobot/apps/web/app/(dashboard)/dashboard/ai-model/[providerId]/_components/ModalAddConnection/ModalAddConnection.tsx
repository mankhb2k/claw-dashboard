"use client";

import { useState, useEffect } from "react";
import { Input, Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui";
import styles from "./ModalAddConnection.module.css";

interface ModalAddConnectionProps {
  isOpen: boolean;
  onClose: () => void;
  provider: { name: string };
  mode: "add" | "edit";
  editingConn: { name: string; key: string } | null;
  onSubmit: (data: { keyName: string; apiKey: string }) => void;
}

export function ModalAddConnection({
  isOpen,
  onClose,
  provider,
  mode,
  editingConn,
  onSubmit,
}: ModalAddConnectionProps) {
  const isEdit = mode === "edit";
  const [keyName, setKeyName] = useState("");
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (isEdit && editingConn) {
        setKeyName(editingConn.name);
        setApiKey(editingConn.key);
      } else {
        setKeyName("");
        setApiKey("");
      }
    }
  }, [isOpen, isEdit, editingConn]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ keyName, apiKey });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Sửa key ${provider.name}` : `Thêm key ${provider.name}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className={styles.form}>

          <Input
            label="Tên Key"
            placeholder="Ví dụ: Default Connection"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            required
          />
          <Input
            label="API Key"
            placeholder="sk-..."
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            required
          />
          
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={onClose} type="button">
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {isEdit ? "Cập nhật" : "Thêm key"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
