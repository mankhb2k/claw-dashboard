import Link from "next/link";
import { IconProvider, Button, Typography } from "@/components/ui";
import { Flex } from "@/components/layout";
import { CardChip } from "./_components/CardChip/CardChip";
import { ClientPage } from "./_components/ClientPage";
import { GEMINI_DEFAULT_OPENCLAW_MODEL } from "@/lib/ai-models/gemini-models";
import { OPENAI_DEFAULT_OPENCLAW_MODEL } from "@/lib/ai-models/openai-models";
import { APIKEY_PROVIDERS, type ModelDef } from "../providersData";
import styles from "./provider-detail.module.css";

const TIER_ORDER = ["stable", "preview", "deprecated"] as const;
const TIER_TITLE: Record<(typeof TIER_ORDER)[number], string> = {
  stable: "Stable — dùng production",
  preview: "Preview — có thể đổi / deprecate",
  deprecated: "Deprecated — nên migrate",
};

const CATALOG_SOURCE: Record<string, { href: string; label: string; note: string }> = {
  gemini: {
    href: "https://ai.google.dev/gemini-api/docs/models",
    label: "Google Gemini API",
    note: "Chỉ model chat/agent (không gồm TTS, image, video, Live).",
  },
  openai: {
    href: "https://developers.openai.com/api/docs/models",
    label: "OpenAI API",
    note: "Dòng GPT-5 frontier cho chat/agent (không gồm image, realtime, TTS).",
  },
};

function groupModelsByTier(models: ModelDef[]) {
  const groups = new Map<string, ModelDef[]>();
  for (const tier of TIER_ORDER) {
    const list = models.filter((m) => (m.tier ?? "stable") === tier);
    if (list.length) groups.set(tier, list);
  }
  const other = models.filter(
    (m) => m.tier && !TIER_ORDER.includes(m.tier as (typeof TIER_ORDER)[number]),
  );
  if (other.length) groups.set("other", other);
  return groups;
}

export default async function Page({
  params,
}: {
  params: Promise<{ providerId: string }>;
}) {
  const { providerId } = await params;

  const providerData = APIKEY_PROVIDERS.find((p) => p.id === providerId);

  if (!providerData) {
    return (
      <div className={styles.page}>
        <div className={styles.state}>
          <span className={`material-symbols-outlined ${styles.errorIcon}`}>
            error_outline
          </span>
          <p>Provider không tìm thấy</p>
          <Link href={`/dashboard/ai-model`}>
            <Button variant="outline" size="sm">
              ← Quay lại
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const models: ModelDef[] = providerData.models ?? [];
  const openclawProviderId =
    providerData.openclawProviderId ?? providerData.id;

  const modelGroups = groupModelsByTier(models);

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <Link href={`/dashboard/ai-model`} className={styles.back}>
          <span className={`material-symbols-outlined ${styles.backIcon}`}>
            arrow_back
          </span>
          Quay lại danh sách
        </Link>

        <Flex align="center" gap={16} style={{ marginBottom: "1rem" }}>
          <IconProvider
            src={providerData.iconSrc}
            label={providerData.name}
            size="xl"
            shape="square"
            withBackground
            style={
              {
                "--icon-bg": `${providerData.color}18`,
                color: providerData.color,
              } as React.CSSProperties
            }
          />
          <div className={styles.headerMeta}>
            <h1 className={styles.headerTitle}>{providerData.name}</h1>
            <p className={styles.headerSub}>
              Quản lý API key · OpenClaw prefix{" "}
              <code>{openclawProviderId}</code>
            </p>
          </div>
        </Flex>

        <ClientPage
          providerId={providerId}
          providerData={{
            name: providerData.name,
            envKey: providerData.envKey,
            defaultModel:
              providerId === "gemini"
                ? GEMINI_DEFAULT_OPENCLAW_MODEL
                : providerId === "openai"
                  ? OPENAI_DEFAULT_OPENCLAW_MODEL
                  : providerData.models?.find((m) => m.recommended)?.openclawId ??
                    providerData.models?.[0]?.openclawId,
          }}
        />

        <div style={{ marginTop: "2.5rem" }}>
          <Typography
            variant="h3"
            weight="bold"
            style={{ marginBottom: "0.5rem" }}
          >
            Mô hình khả dụng
          </Typography>
          <Typography
            variant="small"
            color="muted"
            style={{ marginBottom: "1rem", display: "block" }}
          >
            {CATALOG_SOURCE[providerId] ? (
              <>
                Danh sách tham khảo từ{" "}
                <a
                  href={CATALOG_SOURCE[providerId].href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {CATALOG_SOURCE[providerId].label}
                </a>
                . {CATALOG_SOURCE[providerId].note}
              </>
            ) : (
              <>Catalog model tham khảo cho provider này.</>
            )}
          </Typography>

          <div className={styles.modelsWrapper}>
            {Array.from(modelGroups.entries()).map(([tier, tierModels]) => (
              <section key={tier} className={styles.modelTierSection}>
                <Typography
                  variant="small"
                  weight="bold"
                  className={styles.modelTierTitle}
                >
                  {TIER_TITLE[tier as keyof typeof TIER_TITLE] ?? tier}
                </Typography>
                <div className={styles.modelsList}>
                  {tierModels.map((model) => (
                    <CardChip
                      key={model.openclawId ?? model.id}
                      model={model}
                      openclawProviderId={openclawProviderId}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        <div className={styles.noteBox}>
          <Typography variant="small" className={styles.noteText}>
            <span className={`material-symbols-outlined ${styles.noteIcon}`}>
              info
            </span>
            <span>
              <strong>Catalog model</strong> chỉ cần trên frontend/API (metadata
              tĩnh). <strong>API key</strong> lưu DB + sync{" "}
              <code>openclaw.json</code>. Khi chọn model mặc định cho project,
              lưu <code>defaultModel</code> (ví dụ{" "}
              <code>google/gemini-2.5-flash</code>) — không cần bảng riêng cho
              từng model trong catalog.
            </span>
          </Typography>
        </div>
      </div>
    </div>
  );
}
