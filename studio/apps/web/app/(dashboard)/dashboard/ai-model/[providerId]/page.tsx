import { ClientProviderIdPage } from "./_components/ClientProviderIdPage/ClientProviderIdPage";
import styles from "./providerId.module.css";
import { Flex, Container } from "@/components/layout";

interface PageProps {
  params: Promise<{
    providerId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { providerId } = await params;

  return (
    <Flex direction="column" align="stretch" className={styles.page}>
      <Container size="md" display="flex" className={styles.content}>
        <ClientProviderIdPage providerId={providerId} />
      </Container>
    </Flex>
  );
}
