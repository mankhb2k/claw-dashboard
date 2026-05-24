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
import styles from "./SettingGeneralSection.module.css";
import { CardSection } from "../CardSection/CardSection";
import { TitleSection } from "../TitleSection/TitleSection";

interface Props {
  project: Project;
}

const formSchema = z.object({
  displayName: z.string().min(3, "Tên dự án phải từ 3 ký tự").max(50, "Tên dự án tối đa 50 ký tự"),
});

type FormValues = z.infer<typeof formSchema>;

export function SettingGeneralSection({ project }: Props) {
  const [copied, setCopied] = useState<"subdomain" | "id" | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const formattedDate = new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(project.createdAt));

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
      reset(data); // Đặt lại trạng thái isDirty với giá trị mới
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
    }
  };

  const copyToClipboard = (text: string, type: "subdomain" | "id") => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Flex direction="column" gap={24}>
      <TitleSection title="General settings" />

      <CardSection>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Tên hiển thị */}
          <CardSection.Row className={styles.cardRow}>
            <CardSection.Info className={styles.rowInfo}>
              <Typography variant="p" weight="medium">Project name</Typography>
              <Typography variant="small" color="muted">
                Tên hiển thị của dự án trên toàn hệ thống.
              </Typography>
            </CardSection.Info>
            <CardSection.Action className={styles.rowAction}>
              <Input
                id="displayName"
                type="text"
                placeholder="Nhập tên dự án..."
                className={styles.input}
                error={errors.displayName?.message}
                {...register("displayName")}
              />
            </CardSection.Action>
          </CardSection.Row>

          {/* Project ID */}
          <CardSection.Row className={styles.cardRow}>
            <CardSection.Info className={styles.rowInfo}>
              <Typography variant="p" weight="medium">Project ID</Typography>
              <Typography variant="small" color="muted">
                Mã định danh duy nhất của dự án.
              </Typography>
            </CardSection.Info>
            <CardSection.Action className={styles.rowAction}>
              <div className={styles.valueWithCopy}>
                <code className={styles.code}>{project.id}</code>
                <button
                  type="button"
                  className={styles.copyBtn}
                  onClick={() => copyToClipboard(project.id, "id")}
                >
                  {copied === "id" ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </CardSection.Action>
          </CardSection.Row>

          {/* Subdomain */}
          <CardSection.Row className={styles.cardRow}>
            <CardSection.Info className={styles.rowInfo}>
              <Typography variant="p" weight="medium">Subdomain</Typography>
              <Typography variant="small" color="muted">
                Tên miền phụ dành riêng cho dự án này.
              </Typography>
            </CardSection.Info>
            <CardSection.Action className={styles.rowAction}>
              <div className={styles.valueWithCopy}>
                <code className={styles.code}>{project.subdomain}.openclaw.ai</code>
                <button
                  type="button"
                  className={styles.copyBtn}
                  onClick={() => copyToClipboard(`${project.subdomain}.openclaw.ai`, "subdomain")}
                >
                  {copied === "subdomain" ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </CardSection.Action>
          </CardSection.Row>

          {/* Ngày tạo */}
          <CardSection.Row noBorder className={styles.cardRow}>
            <CardSection.Info className={styles.rowInfo}>
              <Typography variant="p" weight="medium">Ngày tạo</Typography>
            </CardSection.Info>
            <CardSection.Action className={styles.rowAction}>
              <Typography variant="p">{formattedDate}</Typography>
            </CardSection.Action>
          </CardSection.Row>

          <CardSection.Footer>
            {saveStatus === "error" && (
              <p className={styles.fieldError}>Có lỗi xảy ra, vui lòng thử lại.</p>
            )}
            <Button
              type="submit"
              variant="primary"
              disabled={!isDirty || saveStatus === "saving"}
              size="sm"
            >
              {saveStatus === "saving" ? "Đang lưu..." : saveStatus === "saved" ? "✓ Đã lưu" : "Lưu thay đổi"}
            </Button>
          </CardSection.Footer>
        </form>
      </CardSection>
    </Flex>
  );
}

