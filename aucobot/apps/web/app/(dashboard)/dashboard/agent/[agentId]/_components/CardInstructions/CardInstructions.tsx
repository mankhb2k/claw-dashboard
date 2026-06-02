"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { compileAgentsMd } from "@aucobot/workspace-sync/agent-workspace-compile";
import { Flex } from "@/components/layout";
import {
  Typography,
  Button,
  ButtonGroup,
  Card,
  Input,
  Textarea,
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui";
import {
  FileText,
  LayoutList,
  Zap,
  ListChecks,
  ShieldAlert,
  TextQuote,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { AgentFormInput } from "@/schemas/agentForm.schema";
import styles from "./CardInstructions.module.css";

type InstructionsView = "editor" | "markdown";

type SimpleSection = "rules" | "constraints" | "output" | "tools";

const SIMPLE_SECTIONS: {
  id: SimpleSection;
  label: string;
  icon: LucideIcon;
}[] = [
  { id: "rules", label: "Rules", icon: ListChecks },
  { id: "constraints", label: "Constraints", icon: ShieldAlert },
  { id: "output", label: "Output format", icon: TextQuote },
  { id: "tools", label: "Environment notes", icon: Wrench },
];

export function CardInstructions() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<AgentFormInput>();

  const instructionsMode = watch("instructionsMode");
  const instructionsRole = watch("instructionsRole");
  const instructionsRules = watch("instructionsRules");
  const instructionsConstraints = watch("instructionsConstraints");
  const instructionsOutputFormat = watch("instructionsOutputFormat");

  const [view, setView] = useState<InstructionsView>(
    instructionsMode === "advanced" ? "markdown" : "editor",
  );
  const [section, setSection] = useState<SimpleSection>("rules");

  useEffect(() => {
    if (instructionsMode === "advanced") {
      setView("markdown");
    }
  }, [instructionsMode]);

  const agentsMdPreview = useMemo(
    () =>
      compileAgentsMd({
        instructionsMode: "simple",
        instructionsRole,
        instructionsRules,
        instructionsConstraints,
        instructionsOutputFormat,
        instructionsAdvanced: "",
      }),
    [
      instructionsRole,
      instructionsRules,
      instructionsConstraints,
      instructionsOutputFormat,
    ],
  );

  return (
    <Card className={styles.card} disableHover>
      <Flex justify="between" align="center" className={styles.header}>
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(value) => {
            if (value === "editor") {
              setView("editor");
              if (instructionsMode === "advanced") {
                setValue("instructionsMode", "simple", { shouldDirty: true });
              }
            } else if (value === "markdown") {
              setView("markdown");
            }
          }}
          size="md"
          className={styles.modeToggle}
        >
          <ToggleGroupItem value="editor" className={styles.modeItem}>
            <LayoutList size={14} aria-hidden />
            Editor
          </ToggleGroupItem>
          <ToggleGroupItem value="markdown" className={styles.modeItem}>
            <FileText size={14} aria-hidden />
            Markdown
          </ToggleGroupItem>
        </ToggleGroup>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={styles.aiBtn}
        >
          <Zap size={14} />
          Optimize with AI
        </Button>
      </Flex>
      <Typography variant="p" weight="bold" className={styles.cardTitle}>
        Instructions for operation agent (AGENTS.md)
      </Typography>

      {view === "editor" ? (
        <Flex
          direction="column"
          gap="var(--space-4)"
          className={styles.simpleFields}
        >
            <Flex
              direction="column"
              gap="var(--space-2)"
              className={styles.roleBlock}
            >
              <Typography variant="h4" weight="medium">
                Agent Role
              </Typography>
              <Input
                id="instructions-role"
                placeholder="What does this agent do? Serving for whom?"
                error={errors.instructionsRole?.message}
                {...register("instructionsRole")}
              />
            </Flex>

            <ButtonGroup className={styles.sectionGroup}>
              {SIMPLE_SECTIONS.map(({ id, label, icon: Icon }) => (
                <Button
                  key={id}
                  type="button"
                  variant="outline"
                  size="sm"
                  className={styles.sectionBtn}
                  aria-pressed={section === id}
                  onClick={() => setSection(id)}
                >
                  <Icon size={14} aria-hidden />
                  {label}
                </Button>
              ))}
            </ButtonGroup>

            {section === "rules" ? (
              <Textarea
                fill
                id="instructions-rules"
                label="Rules (one line per rule)"
                placeholder={
                  "Always confirm before deleting data\nPrefer concise answers"
                }
                {...register("instructionsRules")}
              />
            ) : null}

            {section === "constraints" ? (
              <Textarea
                fill
                id="instructions-constraints"
                label="Constraints (one line per constraint)"
                placeholder={"Do not expose API keys\nDo not run dangerous commands"}
                {...register("instructionsConstraints")}
              />
            ) : null}

            {section === "output" ? (
              <Textarea
                fill
                id="instructions-output"
                label="Output format (optional)"
                placeholder="e.g. Reply in English, use bullets when listing."
                {...register("instructionsOutputFormat")}
              />
            ) : null}

            {section === "tools" ? (
              <Textarea
                fill
                id="tools-notes"
                label="Environment notes (optional)"
                placeholder="e.g. Camera name, SSH host, preferred TTS voice..."
                hint="Setup-specific notes — does not replace openclaw.json configuration."
                {...register("toolsNotes")}
              />
          ) : null}
        </Flex>
      ) : instructionsMode === "advanced" ? (
        <Flex direction="column" className={styles.markdownFields}>
          <Textarea
            fill
            id="instructions-advanced"
            label="AGENTS.md (Markdown)"
            className={styles.textareaTall}
            placeholder={"# Role\n..."}
            error={errors.instructionsAdvanced?.message}
            {...register("instructionsAdvanced")}
          />
        </Flex>
      ) : (
        <Flex direction="column" className={styles.markdownFields}>
          <Textarea
            fill
            readOnly
            id="instructions-preview"
            label="AGENTS.md (preview)"
            className={`${styles.textareaTall} ${styles.preview}`}
            value={agentsMdPreview}
            hint="Preview — on save, the backend compiles from Editor fields."
          />
        </Flex>
      )}

    </Card>
  );
}
