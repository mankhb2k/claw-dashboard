import { Flex } from "@/components/layout";
import { isOssRuntime } from "@/lib/runtime-mode";
import { ClientSetupPage } from "./_components/ClientSetupPage/ClientSetupPage";

export default function SetupPage() {
  const oss = isOssRuntime();

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      fullWidth
      style={{
        minHeight: "100vh",
        padding: "var(--space-6)",
        background: "var(--color-background)",
      }}
    >
      <Flex align="stretch" style={{ width: "100%", maxWidth: "440px" }}>
        <ClientSetupPage oss={oss} />
      </Flex>
    </Flex>
  );
}
