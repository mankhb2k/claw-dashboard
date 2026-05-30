"use client";

import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
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

  const mode = watch("instructionsMode");
  const [section, setSection] = useState<SimpleSection>("rules");

  return (
    <Card className={styles.card} disableHover>
      <Flex justify="between" align="center" className={styles.header}>
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(value) => {
            if (value === "simple" || value === "advanced") {
              setValue("instructionsMode", value, { shouldDirty: true });
            }
          }}
          size="md"
          className={styles.modeToggle}
        >
          <ToggleGroupItem value="simple" className={styles.modeItem}>
            <LayoutList size={14} aria-hidden />
            Editor
          </ToggleGroupItem>
          <ToggleGroupItem value="advanced" className={styles.modeItem}>
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
          Tối ưu bằng AI
        </Button>
      </Flex>
      <Typography variant="p" weight="bold" className={styles.cardTitle}>
        Instructions for operation agent (AGENTS.md)
      </Typography>

      {mode === "simple" ? (
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
                size="default"
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
                "Luôn xác nhận trước khi xóa dữ liệu\nƯu tiên trả lời ngắn gọn"
              }
              {...register("instructionsRules")}
            />
          ) : null}

          {section === "constraints" ? (
            <Textarea
              fill
              id="instructions-constraints"
              label="Constraints (one line per constraint)"
              placeholder={"Không tiết lộ API key\nKhông chạy lệnh nguy hiểm"}
              {...register("instructionsConstraints")}
            />
          ) : null}

          {section === "output" ? (
            <Textarea
              fill
              id="instructions-output"
              label="Output format (optional)"
              placeholder="VD: Trả lời bằng tiếng Việt, có bullet khi liệt kê."
              {...register("instructionsOutputFormat")}
            />
          ) : null}

          {section === "tools" ? (
            <Textarea
              fill
              id="tools-notes"
              label="Environment notes (optional)"
              placeholder="VD: Tên camera, host SSH, giọng TTS ưa thích..."
              hint="Ghi chú đặc thù setup — không thay thế cấu hình trong openclaw.json."
              {...register("toolsNotes")}
            />
          ) : null}
        </Flex>
      ) : (
        <Flex direction="column" className={styles.markdownFields}>
          <Textarea
            fill
            id="instructions-advanced"
            label="AGENTS.md (Markdown)"
            className={styles.textareaTall}
            placeholder={"# Vai trò\n..."}
            error={errors.instructionsAdvanced?.message}
            {...register("instructionsAdvanced")}
          />
        </Flex>
      )}
    </Card>
  );
}
