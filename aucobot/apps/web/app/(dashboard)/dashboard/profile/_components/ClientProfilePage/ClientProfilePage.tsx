"use client";

import { useCallback, useEffect, useState } from "react";
import { Flex, Container } from "@/components/layout";
import { Spinner, Typography } from "@/components/ui";
import { usersApi } from "@/lib/api/users";
import type { PublicUser } from "@/schemas/user.schema";
import { TitleSection } from "../../../setting/_components/TitleSection/TitleSection";
import { ProfileAccountSection } from "../ProfileAccountSection/ProfileAccountSection";
import { ProfileHeroAvatar } from "../ProfileHeroAvatar/ProfileHeroAvatar";
import { ProfileSecuritySection } from "../ProfileSecuritySection/ProfileSecuritySection";
import styles from "../../profile.module.css";

export function ClientProfilePage() {
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
      setError(err instanceof Error ? err.message : "Could not load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner size="md" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <Flex direction="column" align="stretch" className={styles.page}>
        <Container size="setting" className={styles.content}>
          <Typography variant="small" color="muted">
            {error ?? "Profile unavailable"}
          </Typography>
        </Container>
      </Flex>
    );
  }

  return (
    <Flex direction="column" align="stretch" className={styles.page}>
      <Container size="setting" display="flex" className={styles.content}>
        <div className={styles.sections}>
          <TitleSection
            title="Profile"
            description="Manage your personal account. Project settings stay under Settings."
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
      </Container>
    </Flex>
  );
}
