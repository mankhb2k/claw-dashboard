"use client";

import Link from "next/link";
import { ChevronDown, ChevronLeft, ExternalLink } from "lucide-react";
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
import {
  MOCK_PERMISSION_GROUPS,
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
            {/* --- ĐIỀU HƯỚNG --- */}
            <nav>
              <Link
                href={`/dashboard/connect`}
                className={styles.backBtn}
              >
                <ChevronLeft size={16} /> Quay lại tất cả kết nối
              </Link>
            </nav>

            {/* --- HEADER: THÔNG TIN DỊCH VỤ & THAO TÁC CHÍNH --- */}
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
                    <Typography variant="h2" weight="bold">
                      {service.name}
                    </Typography>
                    <Typography variant="small" color="muted">
                      {service.author} • {service.type}
                    </Typography>
                  </Flex>
                </Flex>

                <Flex align="center" gap={2}>
                  {service.supportUrl && (
                    <Button
                      variant="ghost"
                      size="icon_sm"
                      asChild
                      title="Hỗ trợ"
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
                        Gỡ kết nối
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Gỡ bỏ kết nối {service.name}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Hành động này sẽ ngắt kết nối giữa Agent và dịch vụ
                          này. Các công cụ liên quan sẽ không khả dụng cho đến
                          khi được kết nối lại.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy bỏ</AlertDialogCancel>
                        <AlertDialogAction
                          variant="danger"
                          onClick={onDisconnect}
                        >
                          Xác nhận gỡ bỏ
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </Flex>
              </Flex>
            </header>

            {/* --- SECTION: PHÂN QUYỀN CÔNG CỤ --- */}
            <section>
              <Flex direction="column" gap={16}>
                <Box>
                  <Typography variant="h4" weight="bold">
                    Phân quyền công cụ
                  </Typography>
                  <Typography variant="small" color="muted">
                    Thiết lập quyền hạn cho Agent khi sử dụng các công cụ từ
                    dịch vụ này.
                  </Typography>
                </Box>

                {/* --- DANH SÁCH CÁC NHÓM CÔNG CỤ (MOCK) --- */}
                <Flex direction="column" gap={16}>
                  {MOCK_PERMISSION_GROUPS.map((group: PermissionGroupData) => {
                    const expanded = groupExpanded[group.id] ?? true;
                    return (
                      <Card key={group.id} className={styles.groupCard}>
                        <Flex direction="column">
                          {/* 1. Group Header: Tên nhóm & Chọn quyền nhanh cho cả nhóm */}
                          <Flex
                            align="center"
                            justify="between"
                            p={16}
                            color="surface"
                            style={{ background: "var(--color-surface-1)" }}
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
                                {group.id === "read"
                                  ? "Công cụ chỉ đọc"
                                  : "Công cụ ghi/xóa"}
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
                                Luôn cho phép
                              </ToggleGroupItem>
                              <ToggleGroupItem value="ask">
                                Cần phê duyệt
                              </ToggleGroupItem>
                              <ToggleGroupItem value="block">
                                Bị chặn
                              </ToggleGroupItem>
                            </ToggleGroup>
                          </Flex>

                          {/* 2. Group Content: Danh sách từng công cụ cụ thể */}
                          {expanded && (
                            <Box
                              px={16}
                              style={{
                                borderTop: "1px solid var(--color-border)",
                              }}
                            >
                              <Flex direction="column">
                                {group.tools.map((tool: string) => (
                                  <Flex
                                    key={tool}
                                    align="center"
                                    justify="between"
                                    py={16}
                                    style={{
                                      borderBottom:
                                        "1px solid var(--color-border-subtle)",
                                    }}
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
                                        Cho phép
                                      </ToggleGroupItem>
                                      <ToggleGroupItem value="ask">
                                        Hỏi
                                      </ToggleGroupItem>
                                      <ToggleGroupItem value="block">
                                        Chặn
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
