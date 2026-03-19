import { useEffect, useState } from 'react';
import {
  SimpleGrid,
  Title,
  Text,
  Paper,
  Group,
  ThemeIcon,
  Badge,
  Loader,
  Center,
} from '@mantine/core';
import { IconServer, IconNetwork } from '@tabler/icons-react';
import { controllerClient } from '@/common/controller-client';
import type { SettingsV1Node } from '@/common/controller-client';
import { notifications } from '@mantine/notifications';

export default function Nodes() {
  const [nodes, setNodes] = useState<SettingsV1Node[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    controllerClient
      .listNodes()
      .then(setNodes)
      .catch(() => {
        notifications.show({
          title: 'Error',
          message: 'Failed to fetch nodes',
          color: 'red',
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Center py="xl">
        <Loader size="lg" />
      </Center>
    );
  }

  if (nodes.length === 0) {
    return null;
  }

  return (
    <>
      <Title order={3}>Nodes</Title>
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
    </>
  );
}
