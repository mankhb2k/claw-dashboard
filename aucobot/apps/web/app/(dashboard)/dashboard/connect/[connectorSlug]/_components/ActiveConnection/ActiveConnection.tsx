"use client";

import { ChevronDown, ExternalLink } from "lucide-react";
import {
  Button,
  Typography,
  Card,
  ToggleGroup,
  ToggleGroupItem,
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui";
import { Container, Flex, Box } from "@/components/layout";
import { BackButton } from "@/components/dashboard";
import {
  MOCK_PERMISSION_GROUPS,
  PERMISSION_GROUP_LABELS,
  type PermissionGroupData,
} from "../../../projectConnectData";
import { type PermissionMode } from "../ClientConnectorPage/ClientConnectorPage";
import styles from "./active-connection.module.css";

interface Props {
  service: any;
  groupMode: Record<string, PermissionMode>;
  toolMode: Record<string, PermissionMode>;
  groupExpanded: Record<string, boolean>;
  onGroupModeChange: (groupId: string, mode: PermissionMode) => void;
  onToolModeChange: (tool: string, mode: PermissionMode) => void;
  onToggleGroup: (groupId: string) => void;
  onDisconnect: () => void;
}

export function ActiveConnection({
  service,
  groupMode,
  toolMode,
  groupExpanded,
  onGroupModeChange,
  onToolModeChange,
  onToggleGroup,
  onDisconnect,
}: Props) {
  return (
    <div className={styles.page}>
      <Container size="md">
        <Box py={48}>
          <Flex direction="column" gap={32}>
            <BackButton href="/dashboard/connect">{service.name}</BackButton>

            <header>
              <Flex align="start" justify="between" gap={4}>
                <Flex align="center" gap={16}>
                  <div className={styles.serviceIcon}>
                    {service.iconSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={service.iconSrc} alt={service.name} />
                    ) : (
                      <span className={styles.serviceIconFallback}>
                        {service.name.slice(0, 1)}
                      </span>
                    )}
                  </div>
                  <Flex direction="column">
                    <Typography variant="small" color="muted">
                      {service.author} • {service.type}
                    </Typography>
                  </Flex>
                </Flex>

                <Flex align="center" gap={2}>
                  {service.supportUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      iconOnly
                      asChild
                      title="Support"
                    >
                      <a
                        href={service.supportUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink size={18} />
                      </a>
                    </Button>
                  )}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="danger" size="sm">
                        Disconnect
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Disconnect {service.name}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This will disconnect the agent from this service. Related
                          tools will be unavailable until you connect again.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          variant="danger"
                          onClick={onDisconnect}
                        >
                          Confirm disconnect
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </Flex>
              </Flex>
            </header>

            <section>
              <Flex direction="column" gap={16}>
                <Box>
                  <Typography variant="h4" weight="bold">
                    Tool permissions
                  </Typography>
                  <Typography variant="small" color="muted">
                    Set what the agent may do with tools from this service.
                  </Typography>
                </Box>

                <Flex direction="column" gap={16}>
                  {MOCK_PERMISSION_GROUPS.map((group: PermissionGroupData) => {
                    const expanded = groupExpanded[group.id] ?? true;
                    return (
                      <Card key={group.id} className={styles.groupCard}>
                        <Flex direction="column">
                          <Flex
                            align="center"
                            justify="between"
                            p={16}
                            className={styles.groupHeader}
                          >
                            <button
                              type="button"
                              className={styles.group__title}
                              onClick={() => onToggleGroup(group.id)}
                            >
                              <ChevronDown
                                size={18}
                                className={`${styles.group__chevron} ${
                                  expanded
                                    ? styles["group__chevron--open"]
                                    : styles["group__chevron--closed"]
                                }`}
                              />
                              <span>
                                {PERMISSION_GROUP_LABELS[group.id] ?? group.id}
                              </span>
                              <span className={styles.group__count}>
                                {group.tools.length}
                              </span>
                            </button>

                            <ToggleGroup
                              type="single"
                              size="sm"
                              value={groupMode[group.id]}
                              onValueChange={(val) =>
                                val &&
                                onGroupModeChange(
                                  group.id,
                                  val as PermissionMode,
                                )
                              }
                            >
                              <ToggleGroupItem value="allow">
                                Always allow
                              </ToggleGroupItem>
                              <ToggleGroupItem value="ask">
                                Require approval
                              </ToggleGroupItem>
                              <ToggleGroupItem value="block">
                                Blocked
                              </ToggleGroupItem>
                            </ToggleGroup>
                          </Flex>

                          {expanded && (
                            <Box px={16} className={styles.groupContent}>
                              <Flex direction="column">
                                {group.tools.map((tool: string) => (
                                  <Flex
                                    key={tool}
                                    align="center"
                                    justify="between"
                                    py={16}
                                    className={styles.toolRow}
                                  >
                                    <Typography
                                      variant="small"
                                      color="muted"
                                      className={styles.tool__name}
                                    >
                                      {tool}
                                    </Typography>
                                    <ToggleGroup
                                      type="single"
                                      size="sm"
                                      value={
                                        toolMode[tool] ?? groupMode[group.id]
                                      }
                                      onValueChange={(val) =>
                                        val &&
                                        onToolModeChange(
                                          tool,
                                          val as PermissionMode,
                                        )
                                      }
                                    >
                                      <ToggleGroupItem value="allow">
                                        Allow
                                      </ToggleGroupItem>
                                      <ToggleGroupItem value="ask">
                                        Ask
                                      </ToggleGroupItem>
                                      <ToggleGroupItem value="block">
                                        Block
                                      </ToggleGroupItem>
                                    </ToggleGroup>
                                  </Flex>
                                ))}
                              </Flex>
                            </Box>
                          )}
                        </Flex>
                      </Card>
                    );
                  })}
                </Flex>
              </Flex>
            </section>
          </Flex>
        </Box>
      </Container>
    </div>
  );
}
