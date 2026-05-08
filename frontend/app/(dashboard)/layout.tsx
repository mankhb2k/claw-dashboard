"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar/Sidebar";
import { CreateProjectModalHost } from "@/components/dashboard/CreateProjectModalHost/CreateProjectModalHost";
import styles from "./dashboard.layout.module.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);
  const hasProjectSidebar = pathname.startsWith("/project/");

  return (
    <div className={styles.shell}>
      <CreateProjectModalHost />
      {hasProjectSidebar ? (
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      ) : null}
      <div
        className={[
          styles.main,
          hasProjectSidebar ? "" : styles.mainNoSidebar,
          hasProjectSidebar && collapsed ? styles.mainCollapsed : "",
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );
}
