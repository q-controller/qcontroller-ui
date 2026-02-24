import { useEffect, useState } from 'react';
import {
  Container,
  SimpleGrid,
  Stack,
  Title,
  Text,
  Paper,
  Group,
  ThemeIcon,
  Badge,
} from '@mantine/core';
import { IconServer, IconNetwork } from '@tabler/icons-react';
import { controllerClient } from '@/common/controller-client';
import type { SettingsV1Node } from '@/common/controller-client';

export default function Nodes() {
  const [nodes, setNodes] = useState<SettingsV1Node[]>([]);

  useEffect(() => {
    controllerClient.listNodes().then(setNodes);
  }, []);

  return (
    <Container size="xl" py="xl" px="md">
      <Stack gap="xl">
        <div>
          <Title order={1} mb="xs">
            Nodes
          </Title>
          <Text c="dimmed" size="lg">
            QEMU backend nodes
          </Text>
        </div>

        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
          {nodes.map((node) => (
            <Paper key={node.name} shadow="xs" p="md" radius="md" withBorder>
              <Group justify="space-between" align="flex-start" mb="sm">
                <Text fw={700} size="lg">
                  {node.name}
                </Text>
                <ThemeIcon color="cyan" size={32} radius="md">
                  <IconServer size={18} />
                </ThemeIcon>
              </Group>
              <Group gap="xs">
                <IconNetwork size={14} color="gray" />
                <Badge variant="light" color="gray" size="lg" radius="sm">
                  {node.endpoint}
                </Badge>
              </Group>
            </Paper>
          ))}
        </SimpleGrid>
      </Stack>
    </Container>
  );
}
