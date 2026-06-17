"use client";

import { useCallback, useEffect, useState } from "react";
import { Spinner, Typography } from "@/components/ui";
import { usersApi } from "@/lib/api/users";
import { useI18n } from "@/lib/i18n";
import type { PublicUser } from "@/schemas/user.schema";
import { TitleSection } from "../../../setting/_components/TitleSection/TitleSection";
import { ProfileAccountSection } from "../ProfileAccountSection/ProfileAccountSection";
import { ProfileHeroAvatar } from "../ProfileHeroAvatar/ProfileHeroAvatar";
import { ProfileSecuritySection } from "../ProfileSecuritySection/ProfileSecuritySection";
import styles from "../../profile.module.css";

export function ClientProfilePage() {
  const { t } = useI18n();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const profile = await usersApi.me();
      setUser(profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("profile.loadError"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile, t]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner size="md" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <Typography variant="small" color="muted">
        {error ?? t("profile.unavailable")}
      </Typography>
    );
  }

  return (
    <div className={styles.sections}>
      <TitleSection
        title={t("profile.title")}
        description={t("profile.description")}
      />

      <div className={styles.hero}>
        <ProfileHeroAvatar
          user={user}
          onUserUpdated={setUser}
          onUploadError={setAvatarError}
        />
        <div className={styles.heroText}>
          <Typography variant="h3" weight="medium">
            {user.name}
          </Typography>
          {avatarError && (
            <span className={styles.heroAvatarError}>{avatarError}</span>
          )}
        </div>
      </div>

      <ProfileAccountSection user={user} onUserUpdated={setUser} />
      <ProfileSecuritySection />
    </div>
  );
}
