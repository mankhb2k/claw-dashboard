"use client";

import { Camera } from "lucide-react";
import { useRef, useState } from "react";

import styles from "../../profile.module.css";
import { Avatar, Spinner } from "@/components/ui";
import { usersApi } from "@/lib/api/users";
import { useI18n } from "@/lib/i18n";
import { useAuthStore } from "@/stores/auth.store";
import { prepareAvatarFile } from "@/utils/profile/avatar-upload";
import { resolveUserAvatarSrc } from "@/utils/profile/user-avatar";

import type { PublicUser } from "@/schemas/user.schema";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

interface ProfileHeroAvatarProps {
  user: PublicUser;
  onUserUpdated: (user: PublicUser) => void;
  onUploadError?: (message: string | null) => void;
}

export function ProfileHeroAvatar({
  user,
  onUserUpdated,
  onUploadError,
}: ProfileHeroAvatarProps) {
  const { t } = useI18n();
  const setAuthUser = useAuthStore((s) => s.setUser);
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const initials = user.username.slice(0, 2).toUpperCase();
  const avatarSrc = previewUrl ?? resolveUserAvatarSrc(user.avatarUrl);

  const syncAuthUser = (updated: PublicUser) => {
    onUserUpdated(updated);
    setAuthUser({
      id: updated.id,
      username: updated.username,
      name: updated.name,
      avatarUrl: updated.avatarUrl,
      createdAt: updated.createdAt,
    });
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) {
      return;
    }
    setUploading(true);
    onUploadError?.(null);

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    try {
      const prepared = await prepareAvatarFile(file);
      const updated = await usersApi.uploadAvatar(prepared);
      syncAuthUser(updated);
      setPreviewUrl(null);
      URL.revokeObjectURL(localPreview);
    } catch (err) {
      URL.revokeObjectURL(localPreview);
      setPreviewUrl(null);
      onUploadError?.(
        err instanceof Error ? err.message : t("profile.avatar.uploadFailed"),
      );
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  return (
    <div className={styles.heroAvatarWrap}>
      <Avatar size="xl" src={avatarSrc} fallback={initials} alt={user.name} />
      {uploading && (
        <span className={styles.heroAvatarOverlay} aria-hidden>
          <Spinner size="sm" />
        </span>
      )}
      <button
        type="button"
        className={styles.cameraBtn}
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        aria-label={t("profile.avatar.changeAria")}
      >
        <Camera size={14} aria-hidden />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className={styles.fileInput}
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
