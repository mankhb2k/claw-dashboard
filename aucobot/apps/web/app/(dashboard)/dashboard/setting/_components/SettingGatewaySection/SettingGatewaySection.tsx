"use client";

import { useState } from "react";
import { Button, Typography } from "@/components/ui";
import { Flex } from "@/components/layout";
import { Eye, EyeOff, Copy, Check, AlertTriangle } from "lucide-react";
import { projectApi } from "@/lib/api/project";
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
  const [copied, setCopied] = useState<"token" | "url" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "clawsandbox.cloud";
  const gatewayUrl = `https://${subdomain}.${appDomain}`;
  const controlUiUrl = `${gatewayUrl}/openclaw`;

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

  const copyToClipboard = async (text: string, type: "token" | "url") => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Flex direction="column" gap={24}>
      <TitleSection title="Gateway access" />

      <CardSection>
        {/* Warning row */}
        <div className={styles.warningRow}>
          <AlertTriangle size={18} className={styles.warningIcon} />
          <p className={styles.warningText}>
            Không chia sẻ Gateway Token. Bất kỳ ai có token đều có thể điều khiển bot của bạn.
          </p>
        </div>

        {/* Gateway Token row */}
        <CardSection.Row className={styles.cardRow}>
          <CardSection.Info className={styles.rowInfo}>
            <Typography variant="p" weight="medium">Gateway Token</Typography>
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
                  onClick={handleReveal}
                  disabled={loading}
                  className={styles.actionBtnWithIcon}
                  size="sm"
                >
                  {loading ? "Đang tải..." : <><Eye size={14} /> Hiện</>}
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => copyToClipboard(token, "token")}
                    className={styles.actionBtnWithIcon}
                    size="sm"
                  >
                    {copied === "token" ? <><Check size={14} /> Đã copy</> : <><Copy size={14} /> Copy</>}
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
            {error && <p className={styles.errorText}>{error}</p>}
          </CardSection.Action>
        </CardSection.Row>

        {/* Gateway URL row */}
        <CardSection.Row className={styles.cardRow}>
          <CardSection.Info className={styles.rowInfo}>
            <Typography variant="p" weight="medium">Gateway URL</Typography>
            <Typography variant="small" color="muted">
              Địa chỉ cơ sở cho các kết nối Gateway.
            </Typography>
          </CardSection.Info>
          <CardSection.Action className={styles.rowAction}>
            <div className={styles.valueWithCopy}>
              <code className={styles.urlCode}>{gatewayUrl}</code>
              <button
                type="button"
                className={styles.copyBtn}
                onClick={() => copyToClipboard(gatewayUrl, "url")}
              >
                {copied === "url" ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </CardSection.Action>
        </CardSection.Row>

        {/* Control UI row */}
        <CardSection.Row noBorder className={styles.cardRow}>
          <CardSection.Info className={styles.rowInfo}>
            <Typography variant="p" weight="medium">Control UI</Typography>
            <Typography variant="small" color="muted">
              Giao diện điều khiển trực tiếp trên worker.
            </Typography>
          </CardSection.Info>
          <CardSection.Action className={styles.rowAction}>
            <a
              href={controlUiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.controlUiLink}
            >
              Mở Dashboard {controlUiUrl.replace("https://", "")} ↗
            </a>
          </CardSection.Action>
        </CardSection.Row>
      </CardSection>
    </Flex>
  );
}

