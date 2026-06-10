"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Input,
  ToggleGroup,
  ToggleGroupItem,
  Typography,
} from "@/components/ui";
import { Flex } from "@/components/layout";
import { X } from "lucide-react";
import { projectApi } from "@/lib/api/project";
import { INTERPRETER_SAFE_BINS } from "@/schemas/agentForm.schema";
import styles from "./ShellExecSection.module.css";
import { CardSection } from "../CardSection/CardSection";
import { TitleSection } from "../TitleSection/TitleSection";

interface Props {
  projectId: string;
}

type AskPolicy = "always" | "on-miss" | "off";

const POLICY_HINT: Record<AskPolicy, string> = {
  always: "Agents must request approval before running any shell command.",
  "on-miss": "Only commands outside the fast-path list require approval.",
  off: "Commands may run without approval. Use only with trusted workloads.",
};

export function formatPolicyLabel(policy: AskPolicy): string {
  if (policy === "always") return "Always ask";
  if (policy === "on-miss") return "Standard";
  return "Automatic";
}

export function ShellExecSection({ projectId }: Props) {
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
    if (!projectId) return;
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
      <TitleSection title="Shell execution" />

      <CardSection>
        <CardSection.Row className={styles.cardRow}>
          <CardSection.Info className={styles.rowInfo}>
            <Typography variant="p" weight="medium">
              Approval policy
            </Typography>
            <Typography variant="small" color="muted">
              Project-wide shell policy synced to <code>tools.exec</code>. Applies
              to all agents that are allowed to run shell commands.
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
              <ToggleGroupItem value="always">Always ask</ToggleGroupItem>
              <ToggleGroupItem value="on-miss">Standard</ToggleGroupItem>
              <ToggleGroupItem value="off">Automatic</ToggleGroupItem>
            </ToggleGroup>
            <Typography variant="small" color="muted" className={styles.hint}>
              {POLICY_HINT[askPolicy]}
            </Typography>
          </CardSection.Action>
        </CardSection.Row>

        <CardSection.Row className={styles.cardRow}>
          <CardSection.Info className={styles.rowInfo}>
            <Typography variant="p" weight="medium">
              Fast-path utilities
            </Typography>
            <Typography variant="small" color="muted">
              Stdin-only utilities that may run without approval when policy is
              Standard. Interpreters belong in exec approvals, not this list.
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
                    aria-label={`Remove ${bin}`}
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
                    ? "Enter a command and press Enter..."
                    : "Add command..."
                }
                value={newBinInput}
                onChange={(e) => setNewBinInput(e.target.value)}
                onKeyDown={handleAddBin}
                disabled={!loaded}
              />
            </Flex>
            {interpreterWarnings.length > 0 ? (
              <Typography variant="small" className={styles.warning}>
                Avoid interpreters in fast-path: {interpreterWarnings.join(", ")}
              </Typography>
            ) : null}
          </CardSection.Action>
        </CardSection.Row>

        <CardSection.Row noBorder className={styles.cardRow}>
          <CardSection.Info className={styles.rowInfo}>
            <Typography variant="p" weight="medium">
              Default timeout
            </Typography>
            <Typography variant="small" color="muted">
              Maximum seconds a shell command may run before the gateway stops it.
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
              Something went wrong. Try again.
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
              ? "Saving..."
              : saveStatus === "saved"
                ? "Saved"
                : "Save changes"}
          </Button>
        </CardSection.Footer>
      </CardSection>
    </Flex>
  );
}
