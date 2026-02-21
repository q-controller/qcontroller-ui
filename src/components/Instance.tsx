import React from 'react';
const YamlEditor = React.lazy(() => import('@/components/YamlEditor'));
import { useCallback, useContext, useEffect, useReducer } from 'react';
import { useParams } from 'react-router';
import {
  Card,
  Title,
  Badge,
  Group,
  Stack,
  Text,
  ActionIcon,
  Tooltip,
  SimpleGrid,
  Paper,
  ThemeIcon,
  RingProgress,
} from '@mantine/core';
import {
  IconRefresh,
  IconPlayerPlay,
  IconPlayerStop,
  IconTrash,
  IconCpu,
  IconDeviceDesktop,
  IconDatabase,
  IconNetwork,
} from '@tabler/icons-react';
import { UpdatesContext } from '@/common/updates-context';
import { controllerClient } from '@/common/controller-client';
import type { ServicesV1Info } from '@/common/controller-client';
import { VMEvent_EventType } from '@/common/updates';
import { State, stateFromJSON } from '@/common/updates';
import { notifications } from '@mantine/notifications';
import prettyBytes from 'pretty-bytes';
import { mbToBytes } from '@/common/unit-conversion';

interface UpdateAction {
  type: VMEvent_EventType.EVENT_TYPE_UPDATED;
  payload: ServicesV1Info;
}

const getStatusBadge = (status: string) => {
  const state = stateFromJSON(status);
  let color = 'gray';
  switch (state) {
    case State.STATE_RUNNING:
      color = 'green';
      break;
    case State.STATE_STOPPED:
      color = 'red';
      break;
    case State.STATE_STARTING:
      color = 'yellow';
      break;
    case State.STATE_REQUESTINGSTOP:
      color = 'orange';
      break;
  }
  return (
    <Badge color={color} variant="filled">
      {status || 'Unknown'}
    </Badge>
  );
};

function instanceReducer(state: ServicesV1Info, action: UpdateAction) {
  switch (action.type) {
    case VMEvent_EventType.EVENT_TYPE_UPDATED: {
      return { ...state, ...action.payload };
    }
    default:
      return state;
  }
}

export default function Instance() {
  const { instanceName } = useParams();
  const updates = useContext(UpdatesContext);
  const [state, dispatch] = useReducer(instanceReducer, {
    name: instanceName,
  } as ServicesV1Info);

  const handleStart = async () => {
    try {
      if (!instanceName) return;
      await controllerClient.start(instanceName);
      notifications.show({
        title: 'Success',
        message: `Instance ${instanceName} started`,
        color: 'green',
      });
    } catch {
      notifications.show({
        title: 'Error',
        message: `Failed to start instance ${instanceName}`,
        color: 'red',
      });
    }
  };

  const handleStop = async (force: boolean = false) => {
    try {
      if (!instanceName) return;
      await controllerClient.stop(instanceName, force);
    } catch {
      notifications.show({
        title: 'Error',
        message: `Failed to ${force ? 'force ' : ''}stop instance ${instanceName}`,
        color: 'red',
      });
    }
  };

  const handleDelete = async () => {
    try {
      if (!instanceName) return;
      await controllerClient.delete(instanceName);
    } catch {
      notifications.show({
        title: 'Error',
        message: `Failed to delete instance ${instanceName}`,
        color: 'red',
      });
    }
  };

  const handleRefresh = useCallback(async () => {
    try {
      if (!instanceName) return;
      const info = await controllerClient.get(instanceName);
      dispatch({
        type: VMEvent_EventType.EVENT_TYPE_UPDATED,
        payload: info || ({ name: instanceName } as ServicesV1Info),
      });
    } catch {
      notifications.show({
        title: 'Error',
        message: `Failed to fetch instance ${instanceName} details`,
        color: 'red',
      });
    }
  }, [instanceName]);

  useEffect(() => {
    if (!instanceName) return;
    handleRefresh();
  }, [instanceName, handleRefresh]);

  useEffect(() => {
    if (updates?.vmEvent?.info?.name === instanceName) {
      dispatch({
        type: VMEvent_EventType.EVENT_TYPE_UPDATED,
        payload: {
          details: updates?.vmEvent?.info?.details,
          runtimeInfo: updates?.vmEvent?.info?.runtimeInfo,
          name: updates?.vmEvent?.info?.name,
          state: updates?.vmEvent?.info?.state,
        } as ServicesV1Info,
      });
    }
  }, [updates, instanceName]);

  if (!instanceName) {
    return <></>;
  }

  return (
    <Card withBorder shadow="sm" radius="md" p="lg">
      <Group justify="space-between" mb="lg" wrap="wrap" gap="md">
        <Title
          order={2}
          style={{ wordBreak: 'break-word', minWidth: 0, flex: 1 }}
        >
          {state.name}
        </Title>
        <Group gap="xs" style={{ flexShrink: 0 }}>
          <Tooltip label="Start">
            <ActionIcon
              variant="filled"
              color="green"
              size="lg"
              onClick={handleStart}
              disabled={stateFromJSON(state.state) === State.STATE_RUNNING}
            >
              <IconPlayerPlay size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Stop (soft)">
            <ActionIcon
              variant="filled"
              color="red"
              size="lg"
              onClick={() => handleStop(false)}
              disabled={stateFromJSON(state.state) === State.STATE_STOPPED}
            >
              <IconPlayerStop size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Force Stop">
            <ActionIcon
              variant="outline"
              color="red"
              size="lg"
              onClick={() => handleStop(true)}
              disabled={stateFromJSON(state.state) === State.STATE_STOPPED}
            >
              <IconPlayerStop size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete">
            <ActionIcon
              variant="filled"
              color="gray"
              size="lg"
              onClick={handleDelete}
              disabled={stateFromJSON(state.state) !== State.STATE_STOPPED}
            >
              <IconTrash size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Refresh instance data">
            <ActionIcon variant="light" size="lg" onClick={handleRefresh}>
              <IconRefresh size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      <Stack gap="lg">
        <Group>
          <Text fw={500}>Status:</Text>
          {getStatusBadge(state.state ?? 'Unknown')}
        </Group>

        {state.details && (
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            {state.details.cpus && (
              <Paper shadow="xs" p="md" radius="md" withBorder>
                <Group justify="space-between" align="flex-start" mb="sm">
                  <Text c="dimmed" size="sm" tt="uppercase" fw={700}>
                    CPUs
                  </Text>
                  <ThemeIcon color="orange" size={32} radius="md">
                    <IconCpu size={18} />
                  </ThemeIcon>
                </Group>
                <Text fw={700} size="xl">
                  {state.details.cpus} cores
                </Text>
              </Paper>
            )}
            {state.details.memory &&
              (() => {
                const memStats = state.runtimeInfo?.memoryStats;
                const allocatedBytes = mbToBytes(state.details!.memory!);
                const allocated = prettyBytes(allocatedBytes, { binary: true });
                const hasUsage = !!(
                  memStats?.totalMemory &&
                  memStats?.freeMemory &&
                  memStats?.diskCaches
                );
                const used = hasUsage
                  ? Number(memStats!.totalMemory) -
                    Number(memStats!.freeMemory) -
                    Number(memStats!.diskCaches)
                  : 0;
                const usedPct = hasUsage
                  ? Math.round(Math.min((used / allocatedBytes) * 100, 100))
                  : 0;

                return (
                  <Paper shadow="xs" p="md" radius="md" withBorder>
                    <Group justify="space-between" align="center" wrap="nowrap">
                      <Stack gap={4}>
                        <Text c="dimmed" size="sm" tt="uppercase" fw={700}>
                          Memory
                        </Text>
                        <Text fw={700} size="xl">
                          {hasUsage
                            ? prettyBytes(used, { binary: true })
                            : allocated}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {hasUsage ? `of ${allocated}` : 'allocated'}
                        </Text>
                      </Stack>
                      {hasUsage ? (
                        <RingProgress
                          size={80}
                          thickness={8}
                          roundCaps
                          sections={[{ value: usedPct, color: 'blue' }]}
                          label={
                            <Text ta="center" size="xs" fw={700}>
                              {usedPct}%
                            </Text>
                          }
                        />
                      ) : (
                        <ThemeIcon
                          color="blue"
                          size={40}
                          radius="xl"
                          variant="light"
                        >
                          <IconDeviceDesktop size={20} />
                        </ThemeIcon>
                      )}
                    </Group>
                  </Paper>
                );
              })()}
            {state.details.disk &&
              (() => {
                const diskStats = state.runtimeInfo?.diskStats;
                const allocatedBytes = mbToBytes(state.details!.disk!);
                const allocated = prettyBytes(allocatedBytes, { binary: true });
                const hasUsage = !!diskStats?.usedBytes;
                const used = hasUsage ? Number(diskStats!.usedBytes) : 0;
                const usedPct = hasUsage
                  ? Math.round(Math.min((used / allocatedBytes) * 100, 100))
                  : 0;

                return (
                  <Paper shadow="xs" p="md" radius="md" withBorder>
                    <Group justify="space-between" align="center" wrap="nowrap">
                      <Stack gap={4}>
                        <Text c="dimmed" size="sm" tt="uppercase" fw={700}>
                          Disk
                        </Text>
                        <Text fw={700} size="xl">
                          {hasUsage
                            ? prettyBytes(used, { binary: true })
                            : allocated}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {hasUsage ? `of ${allocated}` : 'allocated'}
                        </Text>
                      </Stack>
                      {hasUsage ? (
                        <RingProgress
                          size={80}
                          thickness={8}
                          roundCaps
                          sections={[{ value: usedPct, color: 'green' }]}
                          label={
                            <Text ta="center" size="xs" fw={700}>
                              {usedPct}%
                            </Text>
                          }
                        />
                      ) : (
                        <ThemeIcon
                          color="green"
                          size={40}
                          radius="xl"
                          variant="light"
                        >
                          <IconDatabase size={20} />
                        </ThemeIcon>
                      )}
                    </Group>
                  </Paper>
                );
              })()}
          </SimpleGrid>
        )}

        {(state.runtimeInfo?.ipaddresses?.length || state.hwaddr) && (
          <Card withBorder radius="sm" p="md">
            <Group mb="sm">
              <ThemeIcon color="cyan" size={28} radius="md" variant="light">
                <IconNetwork size={16} />
              </ThemeIcon>
              <Text fw={500}>Network</Text>
            </Group>
            <Stack gap="xs">
              {state.runtimeInfo?.ipaddresses &&
                state.runtimeInfo.ipaddresses.length > 0 && (
                  <Group wrap="wrap" gap="sm">
                    <Text size="sm" c="dimmed" style={{ flexShrink: 0 }}>
                      IP Addresses:
                    </Text>
                    <Group gap="xs" style={{ flex: 1 }}>
                      {state.runtimeInfo.ipaddresses.map(
                        (ip: string, index: number) => (
                          <Badge key={index} variant="light" color="blue">
                            {ip}
                          </Badge>
                        )
                      )}
                    </Group>
                  </Group>
                )}
              {state.hwaddr && (
                <Group wrap="wrap" gap="sm">
                  <Text size="sm" c="dimmed" style={{ flexShrink: 0 }}>
                    MAC Address:
                  </Text>
                  <Badge
                    color="blue"
                    variant="light"
                    radius="sm"
                    style={{ fontFamily: 'monospace' }}
                  >
                    {state.hwaddr}
                  </Badge>
                </Group>
              )}
            </Stack>
          </Card>
        )}

        {state.cloudInit && (
          <Card withBorder radius="sm" p="md">
            <Text fw={500} mb="sm">
              Cloud-init
            </Text>
            <Stack gap="xs">
              <YamlEditor
                label="User-data"
                value={state?.cloudInit?.userdata || ''}
                editable={false}
                onChange={() => {}}
                style={{ minWidth: 0, width: '100%' }}
              />
              <YamlEditor
                label="Network config"
                value={state?.cloudInit?.networkConfig || ''}
                editable={false}
                onChange={() => {}}
                style={{ minWidth: 0, width: '100%' }}
              />
            </Stack>
          </Card>
        )}
      </Stack>
    </Card>
  );
}
