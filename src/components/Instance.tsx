import React from 'react';
const YamlEditor = React.lazy(() => import('@/components/YamlEditor'));
import {
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
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
  Tabs,
} from '@mantine/core';
import {
  IconPlayerPlay,
  IconPlayerStop,
  IconTrash,
  IconCpu,
  IconDeviceDesktop,
  IconDatabase,
  IconNetwork,
} from '@tabler/icons-react';
import { LogTerminal, type LogTerminalHandle } from '@/components/InstanceLogs';
import Snapshots from '@/components/Snapshots';
import { Kind } from '@/generated/proto/services/process/v1/messages';
import { UpdatesContext } from '@/common/updates-context';
import { LogsContext } from '@/common/logs-context';
import { controllerClient } from '@/common/controller-client';
import type { ServicesV1Info } from '@/common/controller-client';
import { VMEvent_EventType } from '@/common/updates';
import { State, stateFromJSON } from '@/common/updates';
import tokens from '@/generated/tokens';
import { notifications } from '@mantine/notifications';
import prettyBytes from 'pretty-bytes';
import { mbToBytes } from '@/common/unit-conversion';

interface UpdateAction {
  type: VMEvent_EventType.EVENT_TYPE_UPDATED;
  payload: ServicesV1Info;
}

const fillColumn: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
};

type VmStatusKind = 'running' | 'stopped' | 'pending' | 'error';

const vmStatusKind = (state: State): VmStatusKind => {
  switch (state) {
    case State.STATE_RUNNING:
      return 'running';
    case State.STATE_STOPPED:
      return 'stopped';
    case State.STATE_STARTING:
    case State.STATE_REQUESTINGSTOP:
      return 'pending';
    default:
      return 'error';
  }
};

const getStatusBadge = (status: string) => {
  const kind = vmStatusKind(stateFromJSON(status));
  return (
    <Badge
      leftSection={
        <span
          style={{
            display: 'block',
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: `var(--color-semantic-vm-${kind}-indicator)`,
          }}
        />
      }
      styles={{
        root: {
          backgroundColor: `var(--color-semantic-vm-${kind}-bg)`,
          color: `var(--color-semantic-vm-${kind}-text)`,
          borderRadius: 'var(--radius-pill)',
          fontSize: 'var(--font-size-xs)',
          fontWeight: Number(tokens.font.weight.semibold.$value),
          textTransform: 'uppercase',
        },
      }}
    >
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

export default function Instance({
  instanceName,
  initialData,
}: {
  instanceName: string;
  initialData?: Partial<ServicesV1Info>;
}) {
  const { subscribe } = useContext(UpdatesContext);
  const { subscribeLogs } = useContext(LogsContext);
  const [state, dispatch] = useReducer(instanceReducer, {
    name: instanceName,
    ...initialData,
  } as ServicesV1Info);

  const nodeName = state.node || '';
  const vmName = instanceName.startsWith(nodeName + ':')
    ? instanceName.substring(nodeName.length + 1)
    : instanceName;

  const [tab, setTab] = useState<string | null>('info');
  // Mount the terminals only once a logs tab is opened, then keep them mounted
  // so neither stream is dropped while the other tab is active.
  const [logsOpened, setLogsOpened] = useState(false);
  const stdoutRef = useRef<LogTerminalHandle>(null);
  const stderrRef = useRef<LogTerminalHandle>(null);

  const onReset = useCallback(() => {
    stdoutRef.current?.clear();
    stderrRef.current?.clear();
  }, []);
  const onData = useCallback((kind: Kind, data: string, rotated: boolean) => {
    const term = kind === Kind.KIND_STDERR ? stderrRef : stdoutRef;
    if (rotated) {
      term.current?.clear();
    }
    term.current?.write(data);
  }, []);

  // Stream while the terminals are mounted (i.e. logs were opened) and the node
  // is known. Tied to logsOpened, not the active tab, so flipping between Info
  // and the log tabs does not drop the socket and replay the whole backlog.
  useEffect(() => {
    if (!logsOpened || nodeName === '') return;
    return subscribeLogs(nodeName, vmName, { onReset, onData });
  }, [subscribeLogs, nodeName, vmName, logsOpened, onReset, onData]);

  const handleStart = async () => {
    try {
      await controllerClient.start(nodeName, vmName);
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
      await controllerClient.stop(nodeName, vmName, force);
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
      await controllerClient.delete(nodeName, vmName);
    } catch {
      notifications.show({
        title: 'Error',
        message: `Failed to delete instance ${instanceName}`,
        color: 'red',
      });
    }
  };

  useEffect(() => {
    return subscribe((event) => {
      const vmEvent = event.update?.vmEvent;
      const eventName = vmEvent?.info?.name;
      const eventNode = event.node;
      const eventKey = eventNode ? `${eventNode}:${eventName}` : eventName;
      if (eventKey === instanceName && vmEvent?.info) {
        dispatch({
          type: VMEvent_EventType.EVENT_TYPE_UPDATED,
          payload: { node: eventNode, info: vmEvent.info } as ServicesV1Info,
        });
      }
    });
  }, [subscribe, instanceName]);

  return (
    <Card withBorder shadow="sm" radius="md" p="lg" style={fillColumn}>
      <Group justify="space-between" mb="lg" wrap="wrap" gap="md">
        <Title
          order={2}
          style={{ wordBreak: 'break-word', minWidth: 0, flex: 1 }}
        >
          {state.info?.name}
        </Title>
        <Group gap="xs" style={{ flexShrink: 0 }}>
          <Tooltip label="Start">
            <ActionIcon
              variant="filled"
              className="action-primary"
              size="lg"
              onClick={handleStart}
              disabled={
                stateFromJSON(state.info?.status?.state) !== State.STATE_STOPPED
              }
            >
              <IconPlayerPlay size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Stop (soft)">
            <ActionIcon
              variant="outline"
              className="action-danger"
              size="lg"
              onClick={() => handleStop(false)}
              disabled={
                stateFromJSON(state.info?.status?.state) === State.STATE_STOPPED
              }
            >
              <IconPlayerStop size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Force Stop">
            <ActionIcon
              variant="filled"
              className="action-danger-solid"
              size="lg"
              onClick={() => handleStop(true)}
              disabled={
                stateFromJSON(state.info?.status?.state) === State.STATE_STOPPED
              }
            >
              <IconPlayerStop size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete">
            <ActionIcon
              variant="outline"
              className="action-danger"
              size="lg"
              onClick={handleDelete}
              disabled={
                stateFromJSON(state.info?.status?.state) !== State.STATE_STOPPED
              }
            >
              <IconTrash size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      <Tabs
        value={tab}
        onChange={(value) => {
          setTab(value);
          if (value === 'stdout' || value === 'stderr') {
            setLogsOpened(true);
          }
        }}
        variant="outline"
        style={fillColumn}
      >
        <Tabs.List mb="md">
          <Tabs.Tab value="info">Info</Tabs.Tab>
          <Tabs.Tab value="stdout">stdout</Tabs.Tab>
          <Tabs.Tab value="stderr">stderr</Tabs.Tab>
          <Tabs.Tab value="snapshots">Snapshots</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel
          value="info"
          style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}
        >
          <Stack gap="lg">
            <Group>
              <Text fw={500}>Status:</Text>
              {getStatusBadge(state.info?.status?.state ?? 'Unknown')}
              {state.node && (
                <Badge color="cyan" variant="light">
                  {state.node}
                </Badge>
              )}
            </Group>

            {state.info?.spec?.vm && (
              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                {state.info?.spec?.vm.cpus && (
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
                      {state.info?.spec?.vm.cpus} cores
                    </Text>
                  </Paper>
                )}
                {state.info?.spec?.vm.memory &&
                  (() => {
                    const memStats =
                      state.info?.status?.runtimeInfo?.memoryStats;
                    const allocatedBytes = mbToBytes(
                      state.info!.spec!.vm!.memory!
                    );
                    const allocated = prettyBytes(allocatedBytes, {
                      binary: true,
                    });
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
                        <Group
                          justify="space-between"
                          align="center"
                          wrap="nowrap"
                        >
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
                {state.info?.spec?.vm.disk &&
                  (() => {
                    const diskStats =
                      state.info?.status?.runtimeInfo?.diskStats;
                    const allocatedBytes = mbToBytes(
                      state.info!.spec!.vm!.disk!
                    );
                    const allocated = prettyBytes(allocatedBytes, {
                      binary: true,
                    });
                    const hasUsage = !!diskStats?.usedBytes;
                    const used = hasUsage ? Number(diskStats!.usedBytes) : 0;
                    const usedPct = hasUsage
                      ? Math.round(Math.min((used / allocatedBytes) * 100, 100))
                      : 0;

                    return (
                      <Paper shadow="xs" p="md" radius="md" withBorder>
                        <Group
                          justify="space-between"
                          align="center"
                          wrap="nowrap"
                        >
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

            {(state.info?.status?.runtimeInfo?.ipaddresses?.length ||
              state.info?.status?.hwaddr) && (
              <Card withBorder radius="sm" p="md">
                <Group mb="sm">
                  <ThemeIcon color="cyan" size={28} radius="md" variant="light">
                    <IconNetwork size={16} />
                  </ThemeIcon>
                  <Text fw={500}>Network</Text>
                </Group>
                <Stack gap="xs">
                  {state.info?.status?.runtimeInfo?.ipaddresses &&
                    state.info?.status?.runtimeInfo.ipaddresses.length > 0 && (
                      <Group wrap="wrap" gap="sm">
                        <Text size="sm" c="dimmed" style={{ flexShrink: 0 }}>
                          IP Addresses:
                        </Text>
                        <Group gap="xs" style={{ flex: 1 }}>
                          {state.info?.status?.runtimeInfo.ipaddresses.map(
                            (ip: string, index: number) => (
                              <Badge key={index} variant="light" color="blue">
                                {ip}
                              </Badge>
                            )
                          )}
                        </Group>
                      </Group>
                    )}
                  {state.info?.status?.hwaddr && (
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
                        {state.info?.status?.hwaddr}
                      </Badge>
                    </Group>
                  )}
                </Stack>
              </Card>
            )}

            {state.info?.spec?.cloudInit && (
              <Card withBorder radius="sm" p="md">
                <Text fw={500} mb="sm">
                  Cloud-init
                </Text>
                <Stack gap="xs">
                  <YamlEditor
                    label="User-data"
                    value={state?.info?.spec?.cloudInit?.userdata || ''}
                    editable={false}
                    onChange={() => {}}
                    style={{ minWidth: 0, width: '100%' }}
                  />
                  <YamlEditor
                    label="Network config"
                    value={state?.info?.spec?.cloudInit?.networkConfig || ''}
                    editable={false}
                    onChange={() => {}}
                    style={{ minWidth: 0, width: '100%' }}
                  />
                </Stack>
              </Card>
            )}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="stdout" style={fillColumn}>
          {logsOpened && <LogTerminal ref={stdoutRef} />}
        </Tabs.Panel>
        <Tabs.Panel value="stderr" style={fillColumn}>
          {logsOpened && <LogTerminal ref={stderrRef} />}
        </Tabs.Panel>
        <Tabs.Panel
          value="snapshots"
          style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}
        >
          <Snapshots
            node={nodeName}
            name={vmName}
            running={
              stateFromJSON(state.info?.status?.state) === State.STATE_RUNNING
            }
          />
        </Tabs.Panel>
      </Tabs>
    </Card>
  );
}
