"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Container, Flex } from "@/components/layout";
import { Typography, Button } from "@/components/ui";
import {
  agentFormSchema,
  agentTemplateToDefaults,
  buildAgentFormDefaults,
  type AgentFormInput,
} from "@/schemas/agentForm.schema";
import { projectApi } from "@/lib/api/project";
import { useProjectStore } from "@/stores/project.store";
import {
  ArrowLeft,
  PanelRightClose,
  PanelRightOpen,
  Save,
  UserRoundPen,
  Brain,
  Wrench,
  Users,
  Rocket,
  type LucideIcon,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { CardIdentity } from "../CardIdentity/CardIdentity";
import { CardInstructions } from "../CardInstructions/CardInstructions";
import { CardCapabilities } from "../CardCapabilities/CardCapabilities";
import { CardTeam } from "../CardTeam/CardTeam";
import { CardIntegrations } from "../CardIntegrations/CardIntegrations";
import styles from "./EditPanel.module.css";

interface EditPanelProps {
  /** Required when editing an existing agent; omitted on create flow. */
  agentId?: string;
  isEditing?: boolean;
  previewOpen?: boolean;
  onTogglePreview?: () => void;
}

type EditTab =
  | "identity"
  | "instructions"
  | "capabilities"
  | "team"
  | "integrations";

const AGENT_FORM_ID = "agent-edit-form";

const TABS_LIST: { id: EditTab; label: string; icon: LucideIcon }[] = [
  { id: "identity", label: "Identity", icon: UserRoundPen },
  { id: "instructions", label: "Instructions", icon: Brain },
  { id: "team", label: "Team", icon: Users },
  { id: "capabilities", label: "Capabilities", icon: Wrench },
  { id: "integrations", label: "Integrations", icon: Rocket },
];

/** Panel trái: form chỉnh sửa / tạo Agent (header + tabs + nội dung card). */
export function EditPanel({
  agentId,
  isEditing,
  previewOpen = true,
  onTogglePreview,
}: EditPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template");
  const projectId = useProjectStore((s) => s.projects[0]?.id ?? "");
  const fetchProjects = useProjectStore((s) => s.fetchProjects);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formReady, setFormReady] = useState(!isEditing && !templateId);

  const formMethods = useForm<AgentFormInput>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: buildAgentFormDefaults(),
  });

  const { handleSubmit, setValue, watch, reset } = formMethods;

  useEffect(() => {
    void fetchProjects({ silent: true });
  }, [fetchProjects]);

  useEffect(() => {
    if (!projectId) return;

    if (isEditing && agentId) {
      setFormReady(false);
      void projectApi
        .getAgent(projectId, agentId)
        .then((detail) => {
          reset(detail.formData);
          setLoadError(null);
        })
        .catch((err) => {
          setLoadError(
            err instanceof Error ? err.message : "Không tải được agent",
          );
        })
        .finally(() => setFormReady(true));
      return;
    }

    if (templateId) {
      setFormReady(false);
      void projectApi
        .getAgentTemplate(projectId, templateId)
        .then((template) => {
          reset(buildAgentFormDefaults(agentTemplateToDefaults(template)));
          setLoadError(null);
        })
        .catch((err) => {
          reset(buildAgentFormDefaults());
          setLoadError(
            err instanceof Error ? err.message : "Không tải template",
          );
        })
        .finally(() => setFormReady(true));
      return;
    }

    reset(buildAgentFormDefaults());
    setFormReady(true);
  }, [projectId, isEditing, agentId, templateId, reset]);

  /* ── Tab đang chọn (Identity / Instructions / …) ─────────────────────── */
  const [activeTab, setActiveTab] = useState<EditTab>("identity");
  const tabListRef = useRef<HTMLDivElement>(null);
  const tabButtonRefs = useRef<Partial<Record<EditTab, HTMLButtonElement>>>({});
  const [tabIndicator, setTabIndicator] = useState({ left: 0, width: 0 });

  const updateTabIndicator = useCallback(() => {
    const list = tabListRef.current;
    const activeButton = tabButtonRefs.current[activeTab];
    if (!list || !activeButton) return;

    const listRect = list.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();
    setTabIndicator({
      left: buttonRect.left - listRect.left,
      width: buttonRect.width,
    });
  }, [activeTab]);

  useLayoutEffect(() => {
    updateTabIndicator();
  }, [updateTabIndicator]);

  useEffect(() => {
    window.addEventListener("resize", updateTabIndicator);
    return () => window.removeEventListener("resize", updateTabIndicator);
  }, [updateTabIndicator]);

  const model = watch("model");
  const sandboxEnabled = watch("sandboxEnabled");
  const askPolicy = watch("askPolicy");
  const safeBins = watch("safeBins");
  const timeoutSec = watch("timeoutSec");

  const [newTagInput, setNewTagInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const savedHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  /* ── Handlers: thêm / xóa lệnh trong allowlist sandbox ──────────────── */
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = newTagInput.trim().toLowerCase();
      if (val && !safeBins.includes(val)) {
        setValue("safeBins", [...safeBins, val], { shouldDirty: true });
      }
      setNewTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setValue(
      "safeBins",
      safeBins.filter((t) => t !== tag),
      { shouldDirty: true },
    );
  };

  useEffect(() => {
    return () => {
      if (savedHideTimeoutRef.current) {
        clearTimeout(savedHideTimeoutRef.current);
      }
    };
  }, []);

  const onSubmit = async (data: AgentFormInput) => {
    if (!projectId) {
      setLoadError("Chưa có project — hãy tạo project trước.");
      return;
    }

    if (savedHideTimeoutRef.current) {
      clearTimeout(savedHideTimeoutRef.current);
      savedHideTimeoutRef.current = null;
    }
    setShowSaved(false);
    setIsSaving(true);
    setLoadError(null);

    try {
      if (isEditing && agentId) {
        await projectApi.updateAgent(projectId, agentId, { formData: data });
      } else {
        const created = await projectApi.createAgent(projectId, {
          formData: data,
          enabled: true,
        });
        router.replace(`/dashboard/agent/${created.slug}`);
      }

      setShowSaved(true);
      savedHideTimeoutRef.current = setTimeout(() => {
        setShowSaved(false);
        savedHideTimeoutRef.current = null;
      }, 3000);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Lưu agent thất bại");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    router.push(`/dashboard/agent`);
  };

  const tabContent = (
    <>
      {activeTab === "identity" && <CardIdentity />}
      {activeTab === "instructions" && <CardInstructions />}
      {activeTab === "capabilities" && (
        <CardCapabilities
          model={model}
          setModel={(val) => setValue("model", val, { shouldDirty: true })}
          sandboxEnabled={sandboxEnabled}
          setSandboxEnabled={(val) =>
            setValue("sandboxEnabled", val, { shouldDirty: true })
          }
          askPolicy={askPolicy}
          setAskPolicy={(val) =>
            setValue("askPolicy", val, { shouldDirty: true })
          }
          safeBins={safeBins}
          newTagInput={newTagInput}
          setNewTagInput={setNewTagInput}
          timeoutSec={timeoutSec}
          setTimeoutSec={(val) =>
            setValue("timeoutSec", val, { shouldDirty: true })
          }
          handleAddTag={handleAddTag}
          handleRemoveTag={handleRemoveTag}
        />
      )}
      {activeTab === "team" && <CardTeam />}
      {activeTab === "integrations" && (
        <CardIntegrations agentId={agentId ?? "new-agent"} />
      )}
    </>
  );

  if (!formReady) {
    return (
      <Flex
        align="center"
        justify="center"
        className={`${styles.root} ${!previewOpen ? styles.rootExpanded : ""}`}
      >
        <Typography variant="small" color="muted">
          Đang tải…
        </Typography>
      </Flex>
    );
  }

  const panelMain = (
    <>
      {loadError && (
        <Typography variant="small" color="muted" className={styles.loadError}>
          {loadError}
        </Typography>
      )}
      <div className={styles.header}>
        <Flex align="center" gap={3}>
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft size={18} />
          </Button>
          <Typography variant="p" weight="bold">
            {isEditing ? "Chỉnh sửa Agent" : "Tạo Agent mới"}
          </Typography>
        </Flex>
        <Flex align="center" gap={8}>
          {showSaved && (
            <Typography
              variant="small"
              italic
              weight="regular"
              className={styles.saveStatus}
            >
              Đã lưu ✓
            </Typography>
          )}
          <Button
            type="submit"
            form={AGENT_FORM_ID}
            size="sm"
            className={styles.saveBtn}
            disabled={isSaving || !projectId}
          >
            <Save size={16} />
            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </Flex>
      </div>

      <form
        id={AGENT_FORM_ID}
        className={styles.form}
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div className={styles.tabBar}>
          <div className={styles.tabList} ref={tabListRef}>
            <span
              className={styles.tabIndicator}
              style={{
                transform: `translateX(${tabIndicator.left}px)`,
                width: tabIndicator.width,
              }}
              aria-hidden
            />
            {TABS_LIST.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  ref={(node) => {
                    tabButtonRefs.current[tab.id] = node ?? undefined;
                  }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ""}`}
                >
                  <Icon size={16} aria-hidden />
                  {tab.label}
                </button>
              );
            })}
          </div>
          {onTogglePreview ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={styles.previewToggle}
              onClick={onTogglePreview}
              aria-label={previewOpen ? "Ẩn preview" : "Hiện preview"}
              aria-pressed={previewOpen}
              title={previewOpen ? "Ẩn preview" : "Hiện preview"}
            >
              {previewOpen ? (
                <PanelRightClose size={18} />
              ) : (
                <PanelRightOpen size={18} />
              )}
            </Button>
          ) : null}
        </div>

        <div
          className={`${styles.body} ${!previewOpen ? styles.bodyConstrained : ""}`}
        >
          <div className={styles.bodyInner}>{tabContent}</div>
        </div>
      </form>
    </>
  );

  return (
    <FormProvider {...formMethods}>
      <div
        className={`${styles.root} ${!previewOpen ? styles.rootExpanded : ""}`}
      >
        {!previewOpen ? (
          <Container size="md" display="flex" className={styles.constrainedShell}>
            {panelMain}
          </Container>
        ) : (
          panelMain
        )}
      </div>
    </FormProvider>
  );
}
