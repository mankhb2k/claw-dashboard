"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Typography } from "@/components/ui";
import { Copy, Check } from "lucide-react";
import { Flex } from "@/components/layout";
import { projectApi } from "@/lib/api/project";
import type { Project } from "@/schemas/project.schema";
import styles from "./GeneralSection.module.css";
import { CardSection } from "../CardSection/CardSection";
import { TitleSection } from "../TitleSection/TitleSection";

interface Props {
  project: Project;
}

const formSchema = z.object({
  displayName: z
    .string()
    .min(3, "Project name must be at least 3 characters")
    .max(50, "Project name must be at most 50 characters"),
});

type FormValues = z.infer<typeof formSchema>;

export function GeneralSection({ project }: Props) {
  const [copied, setCopied] = useState<"subdomain" | "id" | null>(null);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(project.createdAt));

  const subdomainValue = `${project.subdomain}.openclaw.ai`;

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty, errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: project.displayName,
    },
  });

  const onSubmit = async (data: FormValues) => {
    setSaveStatus("saving");
    try {
      await projectApi.updateDisplayName(project.id, data.displayName);
      setSaveStatus("saved");
      reset(data);
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
    }
  };

  const copyToClipboard = (text: string, type: "subdomain" | "id") => {
    void navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const renderCopyField = (
    value: string,
    type: "subdomain" | "id",
    ariaLabel: string,
  ) => (
    <Flex align="center" gap={2} fullWidth className={styles.valueWithCopy}>
      <Input
        labelPosition="none"
        size="md"
        readOnly
        value={value}
        className={styles.monoField}
      />
      <Button
        type="button"
        variant="outline"
        size="md"
        iconOnly
        className={styles.copyBtn}
        aria-label={ariaLabel}
        onClick={() => copyToClipboard(value, type)}
      >
        {copied === type ? (
          <Check size={14} aria-hidden />
        ) : (
          <Copy size={14} aria-hidden />
        )}
      </Button>
    </Flex>
  );

  return (
    <Flex direction="column" gap={24}>
      <TitleSection title="General settings" />

      <CardSection>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardSection.Row className={styles.cardRow}>
            <CardSection.Info className={styles.rowInfo}>
              <Typography variant="p" weight="medium">
                Project name
              </Typography>
              <Typography variant="small" color="muted">
                Display name used across the system.
              </Typography>
            </CardSection.Info>
            <CardSection.Action className={styles.rowAction}>
              <Input
                id="displayName"
                type="text"
                placeholder="Enter project name..."
                className={styles.input}
                error={errors.displayName?.message}
                {...register("displayName")}
              />
            </CardSection.Action>
          </CardSection.Row>

          <CardSection.Row className={styles.cardRow}>
            <CardSection.Info className={styles.rowInfo}>
              <Typography variant="p" weight="medium">
                Project ID
              </Typography>
              <Typography variant="small" color="muted">
                Unique identifier for this project.
              </Typography>
            </CardSection.Info>
            <CardSection.Action className={styles.rowAction}>
              {renderCopyField(project.id, "id", "Copy project ID")}
            </CardSection.Action>
          </CardSection.Row>

          <CardSection.Row className={styles.cardRow}>
            <CardSection.Info className={styles.rowInfo}>
              <Typography variant="p" weight="medium">
                Subdomain
              </Typography>
              <Typography variant="small" color="muted">
                Subdomain dedicated to this project.
              </Typography>
            </CardSection.Info>
            <CardSection.Action className={styles.rowAction}>
              {renderCopyField(
                subdomainValue,
                "subdomain",
                "Copy subdomain",
              )}
            </CardSection.Action>
          </CardSection.Row>

          <CardSection.Row noBorder className={styles.cardRow}>
            <CardSection.Info className={styles.rowInfo}>
              <Typography variant="p" weight="medium">
                Created at
              </Typography>
            </CardSection.Info>
            <CardSection.Action className={styles.rowAction}>
              <Typography variant="p">{formattedDate}</Typography>
            </CardSection.Action>
          </CardSection.Row>

          <CardSection.Footer>
            {saveStatus === "error" && (
              <Typography variant="small" className={styles.fieldError}>
                Something went wrong. Please try again.
              </Typography>
            )}
            <Button
              type="submit"
              variant="primary"
              disabled={!isDirty || saveStatus === "saving"}
              size="sm"
            >
              {saveStatus === "saving"
                ? "Saving..."
                : saveStatus === "saved"
                  ? "Saved"
                  : "Save changes"}
            </Button>
          </CardSection.Footer>
        </form>
      </CardSection>
    </Flex>
  );
}
