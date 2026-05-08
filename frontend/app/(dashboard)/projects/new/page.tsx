"use client";

import { useRouter } from "next/navigation";
import { Header } from "@/components/dashboard/Header/Header";
import { CreateProjectFormCard } from "@/components/project/CreateProjectFormCard/CreateProjectFormCard";
import styles from "./new-project.module.css";

export default function NewProjectPage() {
  const router = useRouter();

  return (
    <>
      <Header title="Tạo project mới" />

      <div className={styles.page}>
        <div className={styles.card}>
          <CreateProjectFormCard
            title="Cấu hình project"
            onSuccess={() => router.push("/dashboard")}
            onCancel={() => router.back()}
          />
        </div>

        <div className={styles.info}>
          <h3 className={styles.infoTitle}>Thông tin</h3>
          <ul className={styles.infoList}>
            <li>Container: 256MB RAM · 0.25 vCPU</li>
            <li>Storage: 4GB SSD</li>
            <li>Auto-shutdown sau 10 phút không hoạt động</li>
            <li>Tự động cấp SSL qua Cloudflare</li>
          </ul>
        </div>
      </div>
    </>
  );
}
