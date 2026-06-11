"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Button, Input, Typography, Spinner } from "@/components/ui";
import { Flex } from "@/components/layout";
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
import { projectApi } from "@/lib/api/project";
import { useProjectStore } from "@/stores/project.store";
import type { ProjectHealth, ProjectStatus } from "@/schemas/project.schema";
import {
  buildGatewayControlUiUrl,
  resolveOssGatewayHttpBase,
} from "@/lib/runtime/gateway-control-ui";
import { isCloudRuntime } from "@/lib/runtime/runtime-mode";
import styles from "./GatewayStatusSection.module.css";
import { CardSection } from "../CardSection/CardSection";
import { TitleSection } from "../TitleSection/TitleSection";

interface Props {
  projectId: string;
  subdomain: string;
  initialHealth: ProjectHealth | null;
}

const STATUS_LABEL: Record<ProjectStatus, string> = {
  creating: "Creating",
  running: "Running",
  starting: "Starting",
  stopping: "Stopping",
  stopped: "Stopped",
  error: "Error",
};

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
      return;
    }
    if (intervalRef.current) return;

    intervalRef.current = setInterval(async () => {
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
    }, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [health?.status, fetchHealth]);

  useEffect(() => {
    fetchHealth();
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
        e instanceof Error ? e.message : "Unable to start the container.",
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
        e instanceof Error ? e.message : "Unable to respawn the container.",
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
      setErrorMsg(e instanceof Error ? e.message : "Unable to stop the container.");
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
      setGatewayError("Unable to fetch token. Please try again.");
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
      setGatewayError(
        "Unable to open Control UI. Try again after the gateway is running.",
      );
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
      setGatewayError("Unable to copy Control UI link.");
    }
  };

  const copyToClipboard = async (text: string, type: "token" | "url") => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
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
      <TitleSection title="Gateway Status" />

      <CardSection>
        <Flex align="start" gap={3} className={styles.warningRow}>
          <AlertTriangle size={18} className={styles.warningIcon} aria-hidden />
          <Typography variant="small" className={styles.warningText}>
            Do not share the Gateway Token or Control UI links that include a
            token. Anyone with access can control your bot.
          </Typography>
        </Flex>

        <CardSection.Row className={styles.cardRow}>
          <CardSection.Info className={styles.rowInfo}>
            <Typography variant="p" weight="medium">
              Gateway Token
            </Typography>
            <Typography variant="small" color="muted">
              Authentication token for API and WebSocket connections.
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
                    "Loading..."
                  ) : (
                    <>
                      <Eye size={14} /> Show
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
                        <Check size={14} /> Copied
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> Copy
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setToken(null)}
                    className={styles.actionBtnWithIcon}
                    size="sm"
                  >
                    <EyeOff size={14} /> Hide
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
              Gateway status
            </Typography>
            <Typography variant="small" color="muted">
              Current state of the gateway worker.
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
                  {STATUS_LABEL[status]}
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
                    Start
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
                    Stop
                  </Button>
                )}
                {isTransitioning && (
                  <Button
                    variant="ghost"
                    disabled
                    size="sm"
                    className={styles.actionBtnWithIcon}
                  >
                    Processing...
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
                    Respawn
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
                    Start
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
              Gateway URL
            </Typography>
            <Typography variant="small" color="muted">
              {isOss
                ? "Local gateway address for API, WebSocket, and Control UI."
                : "Public gateway address for API, WebSocket, and Control UI."}
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
                aria-label="Copy Gateway URL"
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
                {controlUiLoading ? "Opening..." : "Open Control UI"}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void handleCopyControlUiLink()}
                className={styles.actionBtnWithIcon}
              >
                {copied === "control" ? (
                  <>
                    <Check size={14} aria-hidden /> Link copied
                  </>
                ) : (
                  <>
                    <Copy size={14} aria-hidden /> Copy link
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
