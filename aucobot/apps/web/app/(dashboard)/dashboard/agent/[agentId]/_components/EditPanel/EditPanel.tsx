"use client";

import React, { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Container, Flex } from "@/components/layout";
import { Typography, Button, toast, Tabs, type TabItem } from "@/components/ui";
import {
  agentFormSchema,
  agentTemplateToDefaults,
  buildAgentFormDefaults,
  type AgentFormInput,
} from "@/schemas/agentForm.schema";
import { projectApi } from "@/lib/api/project";
import { useProjectStore } from "@/stores/project.store";
import { useAgentEditorUiStore, type AgentEditTab } from "@/stores/agent-editor-ui.store";
import {
  AGENT_PANEL_APPLY_AGENTS_MD,
  type AgentPanelApplyAgentsMdDetail,
} from "@/lib/agent-editor/agent-panel-events";
import {
  PanelRightClose,
  PanelRightOpen,
  Save,
  UserRoundPen,
  Brain,
  Wrench,
  Rocket,
  CalendarClock,
  Activity,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BackButton } from "@/components/dashboard";
import { DASHBOARD_BASE_PATH } from "@/lib/dashboard-route";
import { Users } from "lucide-react";
import { CardIdentity } from "../CardIdentity/CardIdentity";
import { CardInstructions } from "../CardInstructions/CardInstructions";
import { CardCapabilities } from "../CardCapabilities/CardCapabilities";
import { CardSkill } from "../CardSkill/CardSkill";
import { CardIntegrations } from "../CardIntegrations/CardIntegrations";
import { CardSchedules } from "../CardSchedules/CardSchedules";
import { CardHeartbeat } from "../CardHeartbeat/CardHeartbeat";
import { JoinCollaborationOnCreate } from "../JoinCollaborationOnCreate/JoinCollaborationOnCreate";
import { addAgentToProjectCollaboration } from "@/lib/agent-collaboration";
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
  | "integrations"
  | "schedules"
  | "heartbeat";

const AGENT_FORM_ID = "agent-edit-form";

const EDIT_TABS = new Set<EditTab>([
  "identity",
  "instructions",
  "capabilities",
  "integrations",
  "schedules",
  "heartbeat",
]);

function tabFromSearchParams(params: URLSearchParams): EditTab {
  const value = params.get("tab");
  if (value && EDIT_TABS.has(value as EditTab)) {
    return value as EditTab;
  }
  return "identity";
}

const TABS_LIST: { id: EditTab; label: string; icon: LucideIcon }[] = [
  { id: "identity", label: "Identity", icon: UserRoundPen },
  { id: "instructions", label: "Instructions", icon: Brain },
  { id: "capabilities", label: "Capabilities", icon: Wrench },
  { id: "integrations", label: "Integrations", icon: Rocket },
  { id: "schedules", label: "Schedules", icon: CalendarClock },
  { id: "heartbeat", label: "Heartbeat", icon: Activity },
];

const PANEL_TAB_ITEMS: TabItem[] = TABS_LIST.map((tab) => {
  const Icon = tab.icon;
  return {
    value: tab.id,
    label: tab.label,
    icon: <Icon size={16} aria-hidden />,
  };
});

/** Left panel: edit / create agent form (header + tabs + card content). */
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
  const setFormSnapshot = useAgentEditorUiStore((s) => s.setFormSnapshot);
  const setActiveEditTab = useAgentEditorUiStore((s) => s.setActiveEditTab);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formReady, setFormReady] = useState(!isEditing && !templateId);

  const formMethods = useForm<AgentFormInput>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: buildAgentFormDefaults(),
  });

  const { handleSubmit, setValue, watch, reset } = formMethods;

  useEffect(() => {
    const sub = watch((values) => {
      setFormSnapshot(values as AgentFormInput);
    });
    return () => sub.unsubscribe();
  }, [watch, setFormSnapshot]);

  useEffect(() => {
    const onApply = (event: Event) => {
      const detail = (event as CustomEvent<AgentPanelApplyAgentsMdDetail>).detail;
      if (!detail?.markdown) return;
      if (detail.mode === "advanced") {
        setValue("instructionsMode", "advanced", { shouldDirty: true });
        setValue("instructionsAdvanced", detail.markdown, { shouldDirty: true });
        toast.success("Applied", "AGENTS.md → Instructions (Advanced markdown).");
        return;
      }
      setValue("instructionsMode", "simple", { shouldDirty: true });
      if (detail.fields?.instructionsRole) {
        setValue("instructionsRole", detail.fields.instructionsRole, {
          shouldDirty: true,
        });
      }
      if (detail.fields?.instructionsRules) {
        setValue("instructionsRules", detail.fields.instructionsRules, {
          shouldDirty: true,
        });
      }
      if (detail.fields?.instructionsConstraints) {
        setValue(
          "instructionsConstraints",
          detail.fields.instructionsConstraints,
          { shouldDirty: true },
        );
      }
      if (detail.fields?.instructionsOutputFormat) {
        setValue(
          "instructionsOutputFormat",
          detail.fields.instructionsOutputFormat,
          { shouldDirty: true },
        );
      }
      toast.success("Applied", "Content applied → Instructions (Editor).");
    };
    window.addEventListener(AGENT_PANEL_APPLY_AGENTS_MD, onApply);
    return () =>
      window.removeEventListener(AGENT_PANEL_APPLY_AGENTS_MD, onApply);
  }, [setValue]);

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
            err instanceof Error ? err.message : "Cannot load agent",
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
            err instanceof Error ? err.message : "Cannot load template",
          );
        })
        .finally(() => setFormReady(true));
      return;
    }

    reset(buildAgentFormDefaults());
    setFormReady(true);
  }, [projectId, isEditing, agentId, templateId, reset]);

  /* ── Selected tab (Identity / Instructions / …) ─────────────────────── */
  const [activeTab, setActiveTab] = useState<EditTab>(() =>
    tabFromSearchParams(searchParams),
  );

  useEffect(() => {
    setActiveTab(tabFromSearchParams(searchParams));
  }, [searchParams]);

  useEffect(() => {
    setActiveEditTab(activeTab as AgentEditTab);
  }, [activeTab, setActiveEditTab]);

  const model = watch("model");
  const shellExecEnabled = watch("shellExecEnabled");

  const [joinCollaborationOnCreate, setJoinCollaborationOnCreate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const onSubmit = async (data: AgentFormInput) => {
    if (!projectId) {
      toast.error("No project selected", "Create a project first.");
      return;
    }
    setIsSaving(true);
    setLoadError(null);

    try {
      if (isEditing && agentId) {
        await projectApi.updateAgent(projectId, agentId, { formData: data });
        toast.success("Agent updated", "Changes saved successfully.");
      } else {
        const created = await projectApi.createAgent(projectId, {
          formData: data,
          enabled: true,
        });
        if (joinCollaborationOnCreate) {
          try {
            await addAgentToProjectCollaboration(projectId, created.slug);
          } catch {
            /* agent created; collaboration update is best-effort */
          }
        }
        toast.success("Agent created", "New agent saved successfully.");
        router.replace(`/dashboard/agent/${created.slug}`);
      }
    } catch (err) {
      toast.error(
        "Save failed",
        err instanceof Error ? err.message : "Could not save agent.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const tabContent = (
    <>
      {activeTab === "identity" && (
        <CardIdentity
          collaborationSlot={
            isEditing ? (
              <Link
                href={`${DASHBOARD_BASE_PATH}/agent/collaboration`}
                className={styles.collaborationLink}
              >
                <Users size={14} aria-hidden />
                Collaboration
              </Link>
            ) : undefined
          }
          joinCollaborationSlot={
            !isEditing ? (
              <JoinCollaborationOnCreate
                checked={joinCollaborationOnCreate}
                onCheckedChange={setJoinCollaborationOnCreate}
              />
            ) : undefined
          }
        />
      )}
      {activeTab === "instructions" && (
        <CardInstructions />
      )}
      {activeTab === "capabilities" && (
        <>
          <CardCapabilities
            projectId={projectId}
            model={model}
            setModel={(val) => setValue("model", val, { shouldDirty: true })}
            shellExecEnabled={shellExecEnabled}
            setShellExecEnabled={(val) =>
              setValue("shellExecEnabled", val, { shouldDirty: true })
            }
          />
          <CardSkill />
        </>
      )}
      {activeTab === "integrations" && (
        <CardIntegrations agentId={agentId ?? "new-agent"} />
      )}
      {activeTab === "schedules" && (
        <CardSchedules agentId={agentId ?? "new-agent"} isEditing={Boolean(isEditing)} />
      )}
      {activeTab === "heartbeat" && (
        <CardHeartbeat agentId={agentId ?? "new-agent"} isEditing={Boolean(isEditing)} />
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
        <Container
          size={previewOpen ? "full" : "md"}
          display="flex"
          className={styles.shell}
        >
          <Typography variant="small" color="muted">
            Loading…
          </Typography>
        </Container>
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
        <BackButton href="/dashboard/agent">Back to Agents</BackButton>
        <Flex align="center" gap={8}>
          <Button
            type="submit"
            form={AGENT_FORM_ID}
            size="sm"
            className={styles.saveBtn}
            disabled={isSaving || !projectId}
          >
            <Save size={16} />
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </Flex>
      </div>

      <form
        id={AGENT_FORM_ID}
        className={styles.form}
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <Tabs
          items={PANEL_TAB_ITEMS}
          value={activeTab}
          onValueChange={(next) => {
            const tab = next as EditTab;
            setActiveTab(tab);
            setActiveEditTab(tab as AgentEditTab);
          }}
          variant="panel"
          showIndicator={false}
          aria-label="Agent form sections"
          trailing={
            onTogglePreview ? (
              <Button
                type="button"
                variant="ghost"
                size="md"
                iconOnly
                onClick={onTogglePreview}
                aria-label={previewOpen ? "Hide agent assistant" : "Show agent assistant"}
                aria-pressed={previewOpen}
                title={previewOpen ? "Hide agent assistant" : "Show agent assistant"}
              >
                {previewOpen ? (
                  <PanelRightClose size={18} />
                ) : (
                  <PanelRightOpen size={18} />
                )}
              </Button>
            ) : null
          }
        />
        <div
          className={`${styles.body} ${activeTab === "instructions" ? styles.bodyInstructions : ""}`}
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
        <Container
          size={previewOpen ? "full" : "md"}
          display="flex"
          className={styles.shell}
        >
          {panelMain}
        </Container>
      </div>
    </FormProvider>
  );
}
