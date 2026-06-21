"use client";

import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import styles from "./ShellExecSection.module.css";
import { CardSection } from "../CardSection/CardSection";
import { TitleSection } from "../TitleSection/TitleSection";
import { Flex } from "@/components/layout";
import {
  Button,
  Input,
  ToggleGroup,
  ToggleGroupItem,
  Typography,
} from "@/components/ui";
import { projectApi } from "@/lib/api/project";
import { useI18n } from "@/lib/i18n";
import { INTERPRETER_SAFE_BINS } from "@/schemas/agent-form.schema";

interface Props {
  projectId: string;
}

type AskPolicy = "always" | "on-miss" | "off";

export function formatPolicyLabel(
  policy: AskPolicy,
  t: (path: string) => string,
): string {
  if (policy === "always") return t("settings.shellExec.policy.alwaysAsk");
  if (policy === "on-miss") return t("settings.shellExec.policy.standard");
  return t("settings.shellExec.policy.automatic");
}

function policyHint(
  policy: AskPolicy,
  t: (path: string) => string,
): string {
  if (policy === "always") return t("settings.shellExec.policy.hintAlways");
  if (policy === "on-miss") return t("settings.shellExec.policy.hintOnMiss");
  return t("settings.shellExec.policy.hintOff");
}

export function ShellExecSection({ projectId }: Props) {
  const { t } = useI18n();
  const [askPolicy, setAskPolicy] = useState<AskPolicy>("on-miss");
  const [safeBins, setSafeBins] = useState<string[]>([]);
  const [timeoutSec, setTimeoutSec] = useState(1800);
  const [newBinInput, setNewBinInput] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  useEffect(() => {
    let active = true;
    if (!projectId) return undefined;
    projectApi
      .getProjectExecPolicy(projectId)
      .then((res) => {
        if (!active) return;
        setAskPolicy(res.askPolicy);
        setSafeBins(res.safeBins);
        setTimeoutSec(res.timeoutSec);
        setLoaded(true);
      })
      .catch(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [projectId]);

  const interpreterWarnings = useMemo(
    () => safeBins.filter((bin) => INTERPRETER_SAFE_BINS.has(bin)),
    [safeBins],
  );

  const handleAddBin = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = newBinInput.trim().toLowerCase();
      if (val && !safeBins.includes(val)) {
        setSafeBins([...safeBins, val]);
        setDirty(true);
      }
      setNewBinInput("");
    }
  };

  const handleRemoveBin = (bin: string) => {
    setSafeBins(safeBins.filter((b) => b !== bin));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      await projectApi.updateProjectExecPolicy(projectId, {
        askPolicy,
        safeBins,
        timeoutSec,
      });
      setSaveStatus("saved");
      setDirty(false);
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
    }
  };

  return (
    <Flex direction="column" gap={24}>
      <TitleSection title={t("settings.shellExec.title")} />

      <CardSection>
        <CardSection.Row className={styles.cardRow}>
          <CardSection.Info className={styles.rowInfo}>
            <Typography variant="p" weight="medium">
              {t("settings.shellExec.approval.label")}
            </Typography>
            <Typography variant="small" color="muted">
              {t("settings.shellExec.approval.description")}
            </Typography>
          </CardSection.Info>
          <CardSection.Action className={`${styles.rowAction} ${styles.policyAction}`}>
            <ToggleGroup
              type="single"
              value={askPolicy}
              onValueChange={(value) => {
                if (value === "always" || value === "on-miss" || value === "off") {
                  setAskPolicy(value);
                  setDirty(true);
                }
              }}
              disabled={!loaded}
              className={styles.policyGroup}
            >
              <ToggleGroupItem value="always">
                {formatPolicyLabel("always", t)}
              </ToggleGroupItem>
              <ToggleGroupItem value="on-miss">
                {formatPolicyLabel("on-miss", t)}
              </ToggleGroupItem>
              <ToggleGroupItem value="off">
                {formatPolicyLabel("off", t)}
              </ToggleGroupItem>
            </ToggleGroup>
            <Typography variant="small" color="muted" className={styles.hint}>
              {policyHint(askPolicy, t)}
            </Typography>
          </CardSection.Action>
        </CardSection.Row>

        <CardSection.Row className={styles.cardRow}>
          <CardSection.Info className={styles.rowInfo}>
            <Typography variant="p" weight="medium">
              {t("settings.shellExec.fastPath.label")}
            </Typography>
            <Typography variant="small" color="muted">
              {t("settings.shellExec.fastPath.description")}
            </Typography>
          </CardSection.Info>
          <CardSection.Action className={styles.rowAction}>
            <Flex wrap="wrap" align="center" gap={2} className={styles.tagContainer}>
              {safeBins.map((bin) => (
                <Flex
                  key={bin}
                  as="span"
                  align="center"
                  gap={2}
                  className={styles.tag}
                >
                  {bin}
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    iconOnly
                    className={styles.tagDeleteBtn}
                    onClick={() => handleRemoveBin(bin)}
                    aria-label={t("settings.shellExec.fastPath.removeAria", {
                      bin,
                    })}
                  >
                    <X size={13} aria-hidden />
                  </Button>
                </Flex>
              ))}
              <input
                type="text"
                className={styles.tagInput}
                placeholder={
                  safeBins.length === 0
                    ? t("settings.shellExec.fastPath.placeholderEmpty")
                    : t("settings.shellExec.fastPath.placeholderAdd")
                }
                value={newBinInput}
                onChange={(e) => setNewBinInput(e.target.value)}
                onKeyDown={handleAddBin}
                disabled={!loaded}
              />
            </Flex>
            {interpreterWarnings.length > 0 ? (
              <Typography variant="small" className={styles.warning}>
                {t("settings.shellExec.fastPath.interpreterWarning", {
                  list: interpreterWarnings.join(", "),
                })}
              </Typography>
            ) : null}
          </CardSection.Action>
        </CardSection.Row>

        <CardSection.Row noBorder className={styles.cardRow}>
          <CardSection.Info className={styles.rowInfo}>
            <Typography variant="p" weight="medium">
              {t("settings.shellExec.timeout.label")}
            </Typography>
            <Typography variant="small" color="muted">
              {t("settings.shellExec.timeout.description")}
            </Typography>
          </CardSection.Info>
          <CardSection.Action className={styles.rowAction}>
            <Input
              id="exec-timeout"
              type="number"
              labelPosition="none"
              className={styles.timeoutField}
              value={timeoutSec}
              onChange={(e) => {
                setTimeoutSec(Number(e.target.value));
                setDirty(true);
              }}
              min={5}
              max={86400}
              disabled={!loaded}
            />
          </CardSection.Action>
        </CardSection.Row>

        <CardSection.Footer>
          {saveStatus === "error" && (
            <Typography variant="small" className={styles.fieldError}>
              {t("settings.shellExec.save.error")}
            </Typography>
          )}
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            disabled={!dirty || saveStatus === "saving"}
            size="sm"
          >
            {saveStatus === "saving"
              ? t("settings.shellExec.save.saving")
              : saveStatus === "saved"
                ? t("settings.shellExec.save.saved")
                : t("settings.shellExec.save.submit")}
          </Button>
        </CardSection.Footer>
      </CardSection>
    </Flex>
  );
}
