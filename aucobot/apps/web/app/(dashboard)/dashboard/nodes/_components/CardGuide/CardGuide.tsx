"use client";

import { Card, Typography } from "@/components/ui";
import styles from "./CardGuide.module.css";

export function CardGuide() {
  return (
    <Card className={styles.stepsCard}>
      <ol className={styles.steps}>
        <li>
          <span className={styles.stepNum}>1</span>
          <div>
            <Typography variant="small" weight="medium">
              Cài OpenClaw Node
            </Typography>
            <Typography variant="small" color="muted">
              macOS hoặc Windows — app companion cho gateway.
            </Typography>
          </div>
        </li>
        <li>
          <span className={styles.stepNum}>2</span>
          <div>
            <Typography variant="small" weight="medium">
              Dán mã vào app → Connect
            </Typography>
            <Typography variant="small" color="muted">
              Chọn kết nối bằng mã invite trong app node-device.
            </Typography>
          </div>
        </li>
        <li>
          <span className={styles.stepNum}>3</span>
          <div>
            <Typography variant="small" weight="medium">
              Duyệt thiết bị
            </Typography>
            <Typography variant="small" color="muted">
              Khi app báo chờ duyệt — phê duyệt device (WS) rồi node trong card
              quản lý thiết bị bên dưới.
            </Typography>
          </div>
        </li>
      </ol>
    </Card>
  );
}
