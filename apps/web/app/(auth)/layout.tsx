import Image from "next/image";

import styles from "./auth.module.css";
import { shouldUseUnoptimized } from "@/utils/image/app-image.utils";

const BRAND_ICON = "/claw-dashboard-icon.svg";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.shell}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <Image
            src={BRAND_ICON}
            alt=""
            aria-hidden
            className={styles.logoIcon}
            width={28}
            height={28}
            unoptimized={shouldUseUnoptimized(BRAND_ICON)}
          />
          <span className={styles.logoText}>CLAW DASHBOARD</span>
        </div>
        {children}
      </div>
    </div>
  );
}
