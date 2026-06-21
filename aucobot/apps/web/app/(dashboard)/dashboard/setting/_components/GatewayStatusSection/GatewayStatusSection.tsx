"use client";

import {
  Play,
  Square,
  RotateCw,
  Eye,
  EyeOff,
  Copy,
  Check,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";

import styles from "./GatewayStatusSection.module.css";
import { CardSection } from "../CardSection/CardSection";
import { TitleSection } from "../TitleSection/TitleSection";
import { Flex } from "@/components/layout";
import { Button, Input, Typography, Spinner } from "@/components/ui";
import { projectApi } from "@/lib/api/project";
import { useI18n } from "@/lib/i18n";
import {
  buildGatewayControlUiUrl,
  resolveOssGatewayHttpBase,
} from "@/lib/runtime/gateway-control-ui";
import { isCloudRuntime } from "@/lib/runtime/runtime-mode";
import { useProjectStore } from "@/stores/project.store";

import type { ProjectHealth, ProjectStatus } from "@/schemas/project.schema";

interface Props {
  projectId: string;
  subdomain: string;
  initialHealth: ProjectHealth | null;
}

const MASKED_TOKEN = "••••••••••••••••••••••••••••••";

const STATUS_CLASS: Record<ProjectStatus, string> = {
  creating: "yellow",
  running: "green",
  starting: "yellow",
  stopping: "yellow",
  stopped: "gray",
  error: "red",
};

export function GatewayStatusSection({
  projectId,
  subdomain,
  initialHealth,
}: Props) {
  const { t } = useI18n();
  const [health, setHealth] = useState<ProjectHealth | null>(initialHealth);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const startProject = useProjectStore((s) => s.startProject);
  const respawnProject = useProjectStore((s) => s.respawnProject);
  const stopProject = useProjectStore((s) => s.stopProject);
  const clearHealthPoll = useProjectStore((s) => s.clearHealthPoll);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [token, setToken] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [controlUiLoading, setControlUiLoading] = useState(false);
  const [copied, setCopied] = useState<"token" | "url" | "control" | null>(
    null,
  );
  const [gatewayError, setGatewayError] = useState<string | null>(null);

  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "clawsandbox.cloud";
  const isOss = !isCloudRuntime();

  const gatewayHttpBase = useMemo(
    () =>
      isOss ? resolveOssGatewayHttpBase() : `https://${subdomain}.${appDomain}`,
    [isOss, subdomain, appDomain],
  );

  const fetchHealth = useCallback(async () => {
    try {
      const h = await projectApi.health(projectId);
      setHealth(h);
      return h;
    } catch {
      return null;
    }
  }, [projectId]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearHealthPoll(projectId);
    };
  }, [projectId, clearHealthPoll]);

  useEffect(() => {
    const status = health?.status;
    const busy =
      status === "starting" || status === "stopping" || status === "creating";
    if (!busy) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return undefined;
    }
    if (intervalRef.current) return undefined;

    intervalRef.current = setInterval(() => {
      void (async () => {
        const h = await fetchHealth();
        if (
          h &&
          h.status !== "starting" &&
          h.status !== "stopping" &&
          h.status !== "creating"
        ) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;
          setActionLoading(false);
        }
      })();
    }, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [health?.status, fetchHealth]);

  useEffect(() => {
    void (async () => {
      await Promise.resolve();
      await fetchHealth();
    })();
  }, [fetchHealth]);

  const handleStart = async () => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await startProject(projectId);
      const h = await fetchHealth();
      if (h?.status === "running") {
        setActionLoading(false);
      }
    } catch (e) {
      setErrorMsg(
        e instanceof Error ? e.message : t("settings.gateway.errors.start"),
      );
      setActionLoading(false);
    }
  };

  const handleRespawn = async () => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await respawnProject(projectId);
      const h = await fetchHealth();
      if (h?.status === "running") {
        setActionLoading(false);
      }
    } catch (e) {
      setErrorMsg(
        e instanceof Error ? e.message : t("settings.gateway.errors.respawn"),
      );
      setActionLoading(false);
    }
  };

  const handleStop = async () => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await stopProject(projectId);
      const h = await fetchHealth();
      if (h?.status === "stopped") {
        setActionLoading(false);
      }
    } catch (e) {
      setErrorMsg(
        e instanceof Error ? e.message : t("settings.gateway.errors.stop"),
      );
      setActionLoading(false);
    }
  };

  const handleReveal = async () => {
    setTokenLoading(true);
    setGatewayError(null);
    try {
      const data = await projectApi.gatewayToken(projectId);
      setToken(data.token);
    } catch {
      setGatewayError(t("settings.gateway.errors.fetchToken"));
    } finally {
      setTokenLoading(false);
    }
  };

  const resolveToken = async (): Promise<string> => {
    if (token) {
      return token;
    }
    const data = await projectApi.gatewayToken(projectId);
    setToken(data.token);
    return data.token;
  };

  const handleOpenControlUi = async () => {
    setControlUiLoading(true);
    setGatewayError(null);
    try {
      const authToken = await resolveToken();
      const href = buildGatewayControlUiUrl(gatewayHttpBase, authToken);
      window.open(href, "_blank", "noopener,noreferrer");
    } catch {
      setGatewayError(t("settings.gateway.errors.openControlUi"));
    } finally {
      setControlUiLoading(false);
    }
  };

  const handleCopyControlUiLink = async () => {
    setGatewayError(null);
    try {
      const authToken = await resolveToken();
      const href = buildGatewayControlUiUrl(gatewayHttpBase, authToken);
      await navigator.clipboard.writeText(href);
      setCopied("control");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setGatewayError(t("settings.gateway.errors.copyControlUi"));
    }
  };

  const copyToClipboard = async (text: string, type: "token" | "url") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setGatewayError(t("settings.gateway.errors.copyClipboard"));
    }
  };

  const status = health?.status ?? "stopped";
  const statusClass = STATUS_CLASS[status];
  const isTransitioning =
    status === "starting" || status === "stopping" || status === "creating";
  const containerMissing = health?.containerMissing === true;
  const serverError = health?.errorMessage?.trim() || null;
  const gatewayUrl =
    health?.publicUrl ??
    (health?.subdomain ? `https://${health.subdomain}.${appDomain}` : null) ??
    gatewayHttpBase;

  return (
    <Flex direction="column" gap={24}>
      <TitleSection title={t("settings.gateway.title")} />

      <CardSection>
        <Flex align="start" gap={3} className={styles.warningRow}>
          <AlertTriangle size={18} className={styles.warningIcon} aria-hidden />
          <Typography variant="small" className={styles.warningText}>
            {t("settings.gateway.warning")}
          </Typography>
        </Flex>

        <CardSection.Row className={styles.cardRow}>
          <CardSection.Info className={styles.rowInfo}>
            <Typography variant="p" weight="medium">
              {t("settings.gateway.token.label")}
            </Typography>
            <Typography variant="small" color="muted">
              {t("settings.gateway.token.description")}
            </Typography>
          </CardSection.Info>
          <CardSection.Action className={styles.rowAction}>
            <Input
              labelPosition="none"
              size="md"
              readOnly
              value={token ?? MASKED_TOKEN}
              className={styles.monoField}
            />
            <Flex gap={2} className={styles.tokenActions}>
              {!token ? (
                <Button
                  variant="ghost"
                  onClick={() => void handleReveal()}
                  disabled={tokenLoading}
                  className={styles.actionBtnWithIcon}
                  size="sm"
                >
                  {tokenLoading ? (
                    t("settings.gateway.token.loading")
                  ) : (
                    <>
                      <Eye size={14} /> {t("settings.gateway.token.show")}
                    </>
                  )}
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => void copyToClipboard(token, "token")}
                    className={styles.actionBtnWithIcon}
                    size="sm"
                  >
                    {copied === "token" ? (
                      <>
                        <Check size={14} /> {t("settings.gateway.token.copied")}
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> {t("settings.gateway.token.copy")}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setToken(null)}
                    className={styles.actionBtnWithIcon}
                    size="sm"
                  >
                    <EyeOff size={14} /> {t("settings.gateway.token.hide")}
                  </Button>
                </>
              )}
            </Flex>
            {gatewayError ? (
              <Typography variant="small" className={styles.errorText}>
                {gatewayError}
              </Typography>
            ) : null}
          </CardSection.Action>
        </CardSection.Row>

        <CardSection.Row className={styles.cardRow}>
          <CardSection.Info className={styles.rowInfo}>
            <Typography variant="p" weight="medium">
              {t("settings.gateway.status.label")}
            </Typography>
            <Typography variant="small" color="muted">
              {t("settings.gateway.status.description")}
            </Typography>
          </CardSection.Info>
          <CardSection.Action className={styles.rowAction}>
            <Flex
              justify="between"
              align="center"
              gap={4}
              fullWidth
              className={styles.statusDisplay}
            >
              <Flex align="center" gap={8} className={styles.statusInfo}>
                <span
                  className={`${styles.statusDot} ${styles[`dot_${statusClass}`]}`}
                  aria-hidden
                />
                <Typography variant="p" weight="bold">
                  {t(`settings.gateway.status.${status}`)}
                </Typography>
                {isTransitioning && <Spinner size="sm" />}
              </Flex>
              <Flex gap={2} className={styles.actionBtns}>
                {status === "stopped" && (
                  <Button
                    variant="primary"
                    onClick={handleStart}
                    disabled={actionLoading}
                    className={styles.actionBtnWithIcon}
                    size="sm"
                  >
                    <Play size={14} fill="currentColor" />
                    {t("settings.gateway.status.start")}
                  </Button>
                )}
                {status === "running" && (
                  <Button
                    variant="ghost"
                    onClick={handleStop}
                    disabled={actionLoading}
                    className={styles.actionBtnWithIcon}
                    size="sm"
                  >
                    <Square size={14} fill="currentColor" />
                    {t("settings.gateway.status.stop")}
                  </Button>
                )}
                {isTransitioning && (
                  <Button
                    variant="ghost"
                    disabled
                    size="sm"
                    className={styles.actionBtnWithIcon}
                  >
                    {t("settings.gateway.status.processing")}
                  </Button>
                )}
                {(status === "error" || containerMissing) && (
                  <Button
                    variant="primary"
                    onClick={handleRespawn}
                    disabled={actionLoading}
                    className={styles.actionBtnWithIcon}
                    size="sm"
                  >
                    <RotateCw size={14} />
                    {t("settings.gateway.status.respawn")}
                  </Button>
                )}
                {status === "error" && !containerMissing && (
                  <Button
                    variant="ghost"
                    onClick={handleStart}
                    disabled={actionLoading}
                    className={styles.actionBtnWithIcon}
                    size="sm"
                  >
                    <Play size={14} />
                    {t("settings.gateway.status.start")}
                  </Button>
                )}
              </Flex>
            </Flex>
            {(errorMsg || serverError) && (
              <Typography variant="small" className={styles.errorMsg}>
                {errorMsg ?? serverError}
              </Typography>
            )}
          </CardSection.Action>
        </CardSection.Row>

        <CardSection.Row noBorder className={styles.cardRow}>
          <CardSection.Info className={styles.rowInfo}>
            <Typography variant="p" weight="medium">
              {t("settings.gateway.url.label")}
            </Typography>
            <Typography variant="small" color="muted">
              {isOss
                ? t("settings.gateway.url.descriptionLocal")
                : t("settings.gateway.url.descriptionPublic")}
            </Typography>
          </CardSection.Info>
          <CardSection.Action className={styles.rowAction}>
            <Flex
              align="center"
              gap={2}
              fullWidth
              className={styles.valueWithCopy}
            >
              <Input
                labelPosition="none"
                size="md"
                readOnly
                value={gatewayUrl}
                className={styles.monoField}
              />
              <Button
                type="button"
                variant="outline"
                size="md"
                iconOnly
                className={styles.copyBtn}
                aria-label={t("settings.gateway.url.copyAria")}
                onClick={() => void copyToClipboard(gatewayUrl, "url")}
              >
                {copied === "url" ? (
                  <Check size={14} aria-hidden />
                ) : (
                  <Copy size={14} aria-hidden />
                )}
              </Button>
            </Flex>
            <Flex wrap="wrap" gap={2} className={styles.controlUiActions}>
              <Button
                size="sm"
                onClick={() => void handleOpenControlUi()}
                disabled={controlUiLoading}
                className={styles.actionBtnWithIcon}
              >
                <ExternalLink size={14} aria-hidden />
                {controlUiLoading
                  ? t("settings.gateway.url.opening")
                  : t("settings.gateway.url.openControlUi")}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void handleCopyControlUiLink()}
                className={styles.actionBtnWithIcon}
              >
                {copied === "control" ? (
                  <>
                    <Check size={14} aria-hidden />{" "}
                    {t("settings.gateway.url.linkCopied")}
                  </>
                ) : (
                  <>
                    <Copy size={14} aria-hidden />{" "}
                    {t("settings.gateway.url.copyLink")}
                  </>
                )}
              </Button>
            </Flex>
          </CardSection.Action>
        </CardSection.Row>
      </CardSection>
    </Flex>
  );
}
