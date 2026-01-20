import React from 'react';
const YamlEditor = React.lazy(() => import('@/components/YamlEditor'));
import { useCallback, useContext, useEffect, useReducer } from 'react';
import { useParams } from 'react-router';
import {
  Card,
  Title,
  Badge,
  Table,
  Group,
  Stack,
  Text,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconRefresh,
  IconPlayerPlay,
  IconPlayerStop,
  IconTrash,
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
      // Merge only defined properties from payload into state
      const filteredPayload = Object.fromEntries(
        Object.entries(action.payload).filter(([, v]) => v !== undefined)
      );
      return { ...state, ...filteredPayload };
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
          ipaddresses: updates?.vmEvent?.info?.ipaddresses,
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

      <Stack gap="md">
        <Group>
          <Text fw={500}>Status:</Text>
          {getStatusBadge(state.state ?? 'Unknown')}
        </Group>

        {state.ipaddresses && state.ipaddresses.length > 0 && (
          <Group wrap="wrap" gap="sm">
            <Text fw={500} style={{ flexShrink: 0 }}>
              IP Addresses:
            </Text>
            <Group gap="xs" style={{ flex: 1 }}>
              {state.ipaddresses.map((ip, index) => (
                <Badge key={index} variant="light" color="blue">
                  {ip}
                </Badge>
              ))}
            </Group>
          </Group>
        )}

        {state.details && (
          <div>
            <Text fw={500} mb="sm">
              Configuration:
            </Text>
            <Card withBorder radius="sm" p="sm">
              <Table style={{ tableLayout: 'fixed', width: '100%' }}>
                <Table.Tbody>
                  {state.details.cpus && (
                    <Table.Tr>
                      <Table.Td fw={500} w="40%">
                        CPUs
                      </Table.Td>
                      <Table.Td>{state.details.cpus}</Table.Td>
                    </Table.Tr>
                  )}
                  {state.details.memory && (
                    <Table.Tr>
                      <Table.Td fw={500} w="40%">
                        Memory
                      </Table.Td>
                      <Table.Td style={{ wordBreak: 'break-word' }}>
                        {prettyBytes(mbToBytes(state.details.memory), {
                          binary: true,
                        })}
                      </Table.Td>
                    </Table.Tr>
                  )}
                  {state.details.disk && (
                    <Table.Tr>
                      <Table.Td fw={500} w="40%">
                        Disk
                      </Table.Td>
                      <Table.Td style={{ wordBreak: 'break-word' }}>
                        {prettyBytes(mbToBytes(state.details.disk), {
                          binary: true,
                        })}
                      </Table.Td>
                    </Table.Tr>
                  )}
                  {state.hwaddr && (
                    <Table.Tr>
                      <Table.Td fw={500} w="40%">
                        MAC Address
                      </Table.Td>
                      <Table.Td style={{ wordBreak: 'break-word' }}>
                        <Group gap="xs">
                          <Badge
                            color="blue"
                            variant="light"
                            radius="sm"
                            style={{ fontFamily: 'monospace' }}
                          >
                            {state.hwaddr}
                          </Badge>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  )}
                  {state.cloudInit && (
                    <Table.Tr>
                      <Table.Td w="40%">Cloud-init</Table.Td>
                      <Table.Td style={{ minWidth: 0 }}>
                        <Stack gap="xs" style={{ width: '100%' }}>
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
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Card>
          </div>
        )}
      </Stack>
    </Card>
  );
}
