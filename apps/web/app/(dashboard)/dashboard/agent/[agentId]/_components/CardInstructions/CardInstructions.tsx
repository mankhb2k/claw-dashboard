"use client";

import { compileAgentsMd } from "@claw-dashboard/workspace-sync/agent-workspace-compile";
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
import { useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";

import styles from "./CardInstructions.module.css";
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
import { useI18n } from "@/lib/i18n";
import { useAgentEditorStore } from "@/stores/agent/agent-editor.store";

import type { AgentFormInput } from "@/schemas/agent-form.schema";

type InstructionsView = "editor" | "markdown";

type SimpleSection = "rules" | "constraints" | "output" | "tools";

export function CardInstructions() {
  const { t } = useI18n();
  const simpleSections = useMemo(
    (): { id: SimpleSection; label: string; icon: LucideIcon }[] => [
      { id: "rules", label: t("agent.instructions.sections.rules"), icon: ListChecks },
      { id: "constraints", label: t("agent.instructions.sections.constraints"), icon: ShieldAlert },
      { id: "output", label: t("agent.instructions.sections.outputFormat"), icon: TextQuote },
      { id: "tools", label: t("agent.instructions.sections.environmentNotes"), icon: Wrench },
    ],
    [t],
  );

  const requestOptimizeFlow = useAgentEditorStore(
    (s) => s.requestOptimizeFlow,
  );
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
  const effectiveView: InstructionsView =
    instructionsMode === "advanced" ? "markdown" : view;

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
          value={effectiveView}
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
            {t("agent.instructions.editor")}
          </ToggleGroupItem>
          <ToggleGroupItem value="markdown" className={styles.modeItem}>
            <FileText size={14} aria-hidden />
            {t("agent.instructions.markdownView")}
          </ToggleGroupItem>
        </ToggleGroup>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={styles.aiBtn}
          onClick={() => requestOptimizeFlow()}
        >
          <Zap size={14} />
          {t("agent.instructions.optimizeWithAi")}
        </Button>
      </Flex>
      <Typography variant="p" weight="bold" className={styles.cardTitle}>
        {t("agent.instructions.title")}
      </Typography>

      {effectiveView === "editor" ? (
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
                {t("agent.instructions.role.label")}
              </Typography>
              <Input
                id="instructions-role"
                placeholder={t("agent.instructions.role.placeholder")}
                error={errors.instructionsRole?.message}
                {...register("instructionsRole")}
              />
            </Flex>

            <ButtonGroup className={styles.sectionGroup}>
              {simpleSections.map(({ id, label, icon: Icon }) => (
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
                label={t("agent.instructions.rules.label")}
                placeholder={t("agent.instructions.rules.placeholder")}
                {...register("instructionsRules")}
              />
            ) : null}

            {section === "constraints" ? (
              <Textarea
                fill
                id="instructions-constraints"
                label={t("agent.instructions.constraints.label")}
                placeholder={t("agent.instructions.constraints.placeholder")}
                {...register("instructionsConstraints")}
              />
            ) : null}

            {section === "output" ? (
              <Textarea
                fill
                id="instructions-output"
                label={t("agent.instructions.outputFormat.label")}
                placeholder={t("agent.instructions.outputFormat.placeholder")}
                {...register("instructionsOutputFormat")}
              />
            ) : null}

            {section === "tools" ? (
              <Textarea
                fill
                id="tools-notes"
                label={t("agent.instructions.environmentNotes.label")}
                placeholder={t("agent.instructions.environmentNotes.placeholder")}
                hint={t("agent.instructions.environmentNotes.hint")}
                {...register("toolsNotes")}
              />
          ) : null}
        </Flex>
      ) : instructionsMode === "advanced" ? (
        <Flex direction="column" className={styles.markdownFields}>
          <Textarea
            fill
            id="instructions-advanced"
            label={t("agent.instructions.markdown.label")}
            className={styles.textareaTall}
            placeholder={t("agent.instructions.markdown.placeholder")}
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
            label={t("agent.instructions.markdown.preview")}
            className={`${styles.textareaTall} ${styles.preview}`}
            value={agentsMdPreview}
            hint={t("agent.instructions.markdown.previewHint")}
          />
        </Flex>
      )}

    </Card>
  );
}
