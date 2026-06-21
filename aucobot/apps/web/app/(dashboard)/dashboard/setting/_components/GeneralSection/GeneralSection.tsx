"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Check } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import styles from "./GeneralSection.module.css";
import { CardSection } from "../CardSection/CardSection";
import { TitleSection } from "../TitleSection/TitleSection";
import { Flex } from "@/components/layout";
import { Button, Input, Select, Typography } from "@/components/ui";
import { projectApi } from "@/lib/api/project";
import {
  useI18n,
  SUPPORTED_LOCALES,
  writeLocale,
  type Locale,
} from "@/lib/i18n";
import { isOssRuntime } from "@/lib/runtime/runtime-mode";

import type { Project } from "@/schemas/project.schema";

interface Props {
  project: Project;
}

type FormValues = {
  displayName: string;
};

export function GeneralSection({ project }: Props) {
  const { t, locale } = useI18n();
  const isOss = isOssRuntime();
  const [pendingLocale, setPendingLocale] = useState<Locale>(locale);
  const [trackedLocale, setTrackedLocale] = useState(locale);
  const [copied, setCopied] = useState<"subdomain" | "id" | null>(null);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  if (locale !== trackedLocale) {
    setTrackedLocale(locale);
    setPendingLocale(locale);
  }

  const formSchema = useMemo(
    () =>
      z.object({
        displayName: z
          .string()
          .min(3, t("settings.general.projectName.validation.min"))
          .max(50, t("settings.general.projectName.validation.max")),
      }),
    [t],
  );

  const formattedDate = new Intl.DateTimeFormat(
    locale === "vi" ? "vi-VN" : "en-US",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(new Date(project.createdAt));

  const subdomainValue = `${project.subdomain}.openclaw.ai`;

  const languageOptions = useMemo(
    () =>
      SUPPORTED_LOCALES.map((code) => ({
        value: code,
        label: t(`settings.general.language.options.${code}`),
      })),
    [t],
  );

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

  const isLocaleDirty = pendingLocale !== locale;

  const onSubmit = async (data: FormValues) => {
    setSaveStatus("saving");
    try {
      if (isDirty) {
        await projectApi.updateDisplayName(project.id, data.displayName);
        reset(data);
      }
      if (isLocaleDirty) {
        writeLocale(pendingLocale);
        window.location.reload();
        return;
      }
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
    }
  };

  const copyToClipboard = async (text: string, type: "subdomain" | "id") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard blocked — do not show false "copied" state.
    }
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
        onClick={() => void copyToClipboard(value, type)}
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
      <TitleSection title={t("settings.general.title")} />

      <CardSection>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardSection.Row className={styles.cardRow}>
            <CardSection.Info className={styles.rowInfo}>
              <Typography variant="p" weight="medium">
                {t("settings.general.projectName.label")}
              </Typography>
              <Typography variant="small" color="muted">
                {t("settings.general.projectName.description")}
              </Typography>
            </CardSection.Info>
            <CardSection.Action className={styles.rowAction}>
              <Input
                id="displayName"
                type="text"
                placeholder={t("settings.general.projectName.placeholder")}
                className={styles.input}
                error={errors.displayName?.message}
                {...register("displayName")}
              />
            </CardSection.Action>
          </CardSection.Row>

          <CardSection.Row className={styles.cardRow}>
            <CardSection.Info className={styles.rowInfo}>
              <Typography variant="p" weight="medium">
                {t("settings.general.projectId.label")}
              </Typography>
              <Typography variant="small" color="muted">
                {t("settings.general.projectId.description")}
              </Typography>
            </CardSection.Info>
            <CardSection.Action className={styles.rowAction}>
              {renderCopyField(
                project.id,
                "id",
                t("settings.general.projectId.copyAria"),
              )}
            </CardSection.Action>
          </CardSection.Row>

          {!isOss ? (
            <CardSection.Row className={styles.cardRow}>
              <CardSection.Info className={styles.rowInfo}>
                <Typography variant="p" weight="medium">
                  {t("settings.general.subdomain.label")}
                </Typography>
                <Typography variant="small" color="muted">
                  {t("settings.general.subdomain.description")}
                </Typography>
              </CardSection.Info>
              <CardSection.Action className={styles.rowAction}>
                {renderCopyField(
                  subdomainValue,
                  "subdomain",
                  t("settings.general.subdomain.copyAria"),
                )}
              </CardSection.Action>
            </CardSection.Row>
          ) : null}

          <CardSection.Row className={styles.cardRow}>
            <CardSection.Info className={styles.rowInfo}>
              <Typography variant="p" weight="medium">
                {t("settings.general.language.label")}
              </Typography>
              <Typography variant="small" color="muted">
                {t("settings.general.language.description")}
              </Typography>
            </CardSection.Info>
            <CardSection.Action className={styles.rowAction}>
              <Select
                id="interface-language"
                options={languageOptions}
                value={pendingLocale}
                onValueChange={(value) => setPendingLocale(value as Locale)}
              />
            </CardSection.Action>
          </CardSection.Row>

          <CardSection.Row noBorder className={styles.cardRow}>
            <CardSection.Info className={styles.rowInfo}>
              <Typography variant="p" weight="medium">
                {t("settings.general.createdAt.label")}
              </Typography>
            </CardSection.Info>
            <CardSection.Action className={styles.rowAction}>
              <Typography variant="p">{formattedDate}</Typography>
            </CardSection.Action>
          </CardSection.Row>

          <CardSection.Footer>
            {saveStatus === "error" && (
              <Typography variant="small" className={styles.fieldError}>
                {t("settings.general.save.error")}
              </Typography>
            )}
            <Button
              type="submit"
              variant="primary"
              disabled={(!isDirty && !isLocaleDirty) || saveStatus === "saving"}
              size="sm"
            >
              {saveStatus === "saving"
                ? t("settings.general.save.saving")
                : saveStatus === "saved"
                  ? t("settings.general.save.saved")
                  : t("settings.general.save.submit")}
            </Button>
          </CardSection.Footer>
        </form>
      </CardSection>
    </Flex>
  );
}
