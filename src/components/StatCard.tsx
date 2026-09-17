import { Text, Paper, Group, ThemeIcon } from '@mantine/core';
import { fontWeight } from '@/theme';

export default function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Paper shadow="xs" p="md" radius="md" withBorder>
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text c="dimmed" size="sm" tt="uppercase" fw={fontWeight.bold} mb={2}>
            {title}
          </Text>
          <Text
            fw={fontWeight.bold}
            size="xl"
            style={{ wordBreak: 'break-word' }}
          >
            {value}
          </Text>
        </div>
        <ThemeIcon
          color={color}
          size={38}
          radius="md"
          style={{ flexShrink: 0 }}
        >
          {icon}
        </ThemeIcon>
      </Group>
    </Paper>
  );
}
