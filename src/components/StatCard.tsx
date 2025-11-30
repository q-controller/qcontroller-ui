import { Text, Paper, Group, ThemeIcon } from '@mantine/core';

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
          <Text c="dimmed" size="sm" tt="uppercase" fw={700} mb={2}>
            {title}
          </Text>
          <Text fw={700} size="xl" style={{ wordBreak: 'break-word' }}>
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
