import { Typography } from "@/components/ui";
import { Flex } from "@/components/layout";

interface TitleSectionProps {
  title: string;
  description?: string;
}

export function TitleSection({ title, description }: TitleSectionProps) {
  return (
    <Flex direction="column" gap={4}>
      <Typography variant="h3" weight="medium">{title}</Typography>
      {description && (
        <Typography variant="small" color="muted">
          {description}
        </Typography>
      )}
    </Flex>
  );
}
