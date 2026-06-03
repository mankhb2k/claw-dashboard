"use client";

import { useMemo, useState } from "react";
import { Button, Typography } from "@/components/ui";
import { Flex } from "@/components/layout";
import { Eye, EyeOff, Copy, Check, AlertTriangle, ExternalLink } from "lucide-react";
import { projectApi } from "@/lib/api/project";
import {
  buildGatewayControlUiBaseUrl,
  buildGatewayControlUiUrl,
  resolveOssGatewayHttpBase,
} from "@/lib/gateway-control-ui";
import { isCloudRuntime } from "@/lib/runtime-mode";
import styles from "./SettingGatewaySection.module.css";
import { CardSection } from "../CardSection/CardSection";
import { TitleSection } from "../TitleSection/TitleSection";

interface Props {
  projectId: string;
  subdomain: string;
}

export function SettingGatewaySection({ projectId, subdomain }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [controlUiLoading, setControlUiLoading] = useState(false);
  const [copied, setCopied] = useState<"token" | "url" | "control" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "clawsandbox.cloud";
  const isOss = !isCloudRuntime();

  const gatewayHttpBase = useMemo(
    () =>
      isOss
        ? resolveOssGatewayHttpBase()
        : `https://${subdomain}.${appDomain}`,
    [isOss, subdomain, appDomain],
  );

  const controlUiBase = useMemo(
    () => buildGatewayControlUiBaseUrl(gatewayHttpBase),
    [gatewayHttpBase],
  );

  const handleReveal = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await projectApi.gatewayToken(projectId);
      setToken(data.token);
    } catch {
      setError("Không thể lấy token. Vui lòng thử lại.");
    } finally {
      setLoading(false);
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
    setError(null);
    try {
      const authToken = await resolveToken();
      const href = buildGatewayControlUiUrl(gatewayHttpBase, authToken);
      window.open(href, "_blank", "noopener,noreferrer");
    } catch {
      setError("Không thể mở Control UI. Hãy thử lại sau khi gateway đang chạy.");
    } finally {
      setControlUiLoading(false);
    }
  };

  const handleCopyControlUiLink = async () => {
    setError(null);
    try {
      const authToken = await resolveToken();
      const href = buildGatewayControlUiUrl(gatewayHttpBase, authToken);
      await navigator.clipboard.writeText(href);
      setCopied("control");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setError("Không thể copy link Control UI.");
    }
  };

  const copyToClipboard = async (text: string, type: "token" | "url") => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Flex direction="column" gap={24}>
      <TitleSection title="Gateway access" />

      <CardSection>
        <div className={styles.warningRow}>
          <AlertTriangle size={18} className={styles.warningIcon} />
          <p className={styles.warningText}>
            Không chia sẻ Gateway Token hoặc link Control UI có token. Bất kỳ ai
            có quyền truy cập đều có thể điều khiển bot của bạn.
          </p>
        </div>

        <CardSection.Row className={styles.cardRow}>
          <CardSection.Info className={styles.rowInfo}>
            <Typography variant="p" weight="medium">
              Gateway Token
            </Typography>
            <Typography variant="small" color="muted">
              Token xác thực để kết nối API và WebSocket.
            </Typography>
          </CardSection.Info>
          <CardSection.Action className={styles.rowAction}>
            <div className={styles.tokenDisplay}>
              <code className={styles.tokenCode}>
                {token ? token : "••••••••••••••••••••••••••••••"}
              </code>
            </div>
            <div className={styles.tokenActions}>
              {!token ? (
                <Button
                  variant="ghost"
                  onClick={() => void handleReveal()}
                  disabled={loading}
                  className={styles.actionBtnWithIcon}
                  size="sm"
                >
                  {loading ? (
                    "Đang tải..."
                  ) : (
                    <>
                      <Eye size={14} /> Hiện
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
                        <Check size={14} /> Đã copy
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
                    <EyeOff size={14} /> Ẩn
                  </Button>
                </>
              )}
            </div>
            {error ? <p className={styles.errorText}>{error}</p> : null}
          </CardSection.Action>
        </CardSection.Row>

        <CardSection.Row className={styles.cardRow}>
          <CardSection.Info className={styles.rowInfo}>
            <Typography variant="p" weight="medium">
              Gateway URL
            </Typography>
            <Typography variant="small" color="muted">
              {isOss
                ? "Gateway OSS dùng chung trên máy local (port 18789)."
                : "Địa chỉ cơ sở cho các kết nối Gateway."}
            </Typography>
          </CardSection.Info>
          <CardSection.Action className={styles.rowAction}>
            <div className={styles.valueWithCopy}>
              <code className={styles.urlCode}>{gatewayHttpBase}</code>
              <button
                type="button"
                className={styles.copyBtn}
                onClick={() => void copyToClipboard(gatewayHttpBase, "url")}
              >
                {copied === "url" ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </CardSection.Action>
        </CardSection.Row>

        <CardSection.Row noBorder className={styles.cardRow}>
          <CardSection.Info className={styles.rowInfo}>
            <Typography variant="p" weight="medium">
              Control UI
            </Typography>
            <Typography variant="small" color="muted">
              {isOss
                ? "Mở giao diện OpenClaw gốc với token hiện tại — không cần màn hình đăng nhập."
                : "Giao diện điều khiển trực tiếp trên worker."}
            </Typography>
          </CardSection.Info>
          <CardSection.Action className={styles.rowAction}>
            <code className={styles.urlCode}>{controlUiBase}</code>
            <div className={styles.controlUiActions}>
              <Button
                size="sm"
                onClick={() => void handleOpenControlUi()}
                disabled={controlUiLoading}
                className={styles.actionBtnWithIcon}
              >
                <ExternalLink size={14} />
                {controlUiLoading ? "Đang mở..." : "Mở Control UI"}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void handleCopyControlUiLink()}
                className={styles.actionBtnWithIcon}
              >
                {copied === "control" ? (
                  <>
                    <Check size={14} /> Đã copy link
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Copy link
                  </>
                )}
              </Button>
            </div>
          </CardSection.Action>
        </CardSection.Row>
      </CardSection>
    </Flex>
  );
}
