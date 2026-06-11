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
              Install OpenClaw Node
            </Typography>
            <Typography variant="small" color="muted">
              macOS or Windows — companion app for the gateway.
            </Typography>
          </div>
        </li>
        <li>
          <span className={styles.stepNum}>2</span>
          <div>
            <Typography variant="small" weight="medium">
              Paste code in app → Connect
            </Typography>
            <Typography variant="small" color="muted">
              Choose invite-code connection in the node-device app.
            </Typography>
          </div>
        </li>
        <li>
          <span className={styles.stepNum}>3</span>
          <div>
            <Typography variant="small" weight="medium">
              Approve device
            </Typography>
            <Typography variant="small" color="muted">
              When the app shows pending approval — approve device (WS) then node in
              the device manager card below.
            </Typography>
          </div>
        </li>
      </ol>
    </Card>
  );
}
