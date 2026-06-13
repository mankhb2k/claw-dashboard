"use client";

import { Plus } from "lucide-react";
import { Button, Typography, Spinner } from "@/components/ui";
import { Flex } from "@/components/layout";
import styles from "./no-api-key.module.css";

interface NoApiKeyProps {
  isLoading?: boolean;
  onAdd: () => void;
}

export function NoApiKey({ isLoading = false, onAdd }: NoApiKeyProps) {
  return (
    <Flex
      direction="column"
      center
      gap={16}
      p={40}
      radius="lg"
      color="surface"
      className={`${styles.notConnectedBorder} ${isLoading ? styles.loadingBox : ""}`}
    >
      {isLoading ? (
        <>
          <Spinner size="lg" />
          <Typography color="muted">Loading...</Typography>
        </>
      ) : (
        <Button size="lg" onClick={onAdd}>
          <Plus size={18} />
          Add key
        </Button>
      )}
    </Flex>
  );
}
