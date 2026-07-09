import { useCallback, useContext, useEffect, useState } from 'react';
import {
  Stack,
  Group,
  Text,
  TextInput,
  Button,
  ActionIcon,
  Tooltip,
  Table,
  Alert,
  Center,
} from '@mantine/core';
import {
  IconCamera,
  IconRestore,
  IconTrash,
  IconInfoCircle,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import prettyBytes from 'pretty-bytes';
import { controllerClient } from '@/common/controller-client';
import type { ServicesProcessV1Snapshot } from '@/common/controller-client';
import { UpdatesContext } from '@/common/updates-context';
import { SnapshotEvent_Phase } from '@/common/updates';

export default function Snapshots({
  node,
  name,
  running,
}: {
  node: string;
  name: string;
  running: boolean;
}) {
  const { subscribe } = useContext(UpdatesContext);
  const [snapshots, setSnapshots] = useState<ServicesProcessV1Snapshot[]>([]);
  const [tag, setTag] = useState('');
  // An operation is in flight; cleared by its completion or error event.
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!running) return;
    try {
      const list = await controllerClient.snapshotList(node, name);
      setSnapshots(list);
    } catch {
      // Listing needs a running instance; ignore transient failures.
    }
  }, [node, name, running]);

  useEffect(() => {
    (async () => {
      await refresh();
    })();
  }, [refresh]);

  // Save/Load/Delete are async on the backend; completion and failures arrive
  // over the event stream as SnapshotEvents.
  useEffect(() => {
    return subscribe((event) => {
      if (event.node !== node) return;
      const snap = event.update?.snapshotEvent;
      if (!snap || snap.instance !== name) return;
      if (snap.phase === SnapshotEvent_Phase.PHASE_COMPLETED) {
        notifications.show({
          title: 'Snapshot',
          message: snap.message,
          color: 'green',
        });
        setBusy(false);
        void refresh();
      } else if (snap.phase === SnapshotEvent_Phase.PHASE_FAILED) {
        notifications.show({
          title: 'Snapshot failed',
          message: snap.message,
          color: 'red',
        });
        setBusy(false);
        void refresh();
      }
    });
  }, [subscribe, node, name, refresh]);

  const handleSave = async () => {
    const t = tag.trim();
    if (!t) return;
    setBusy(true);
    try {
      await controllerClient.snapshotSave(node, name, t);
      setTag('');
      notifications.show({
        title: 'Snapshot',
        message: `Saving snapshot "${t}"...`,
        color: 'blue',
      });
    } catch {
      setBusy(false);
      notifications.show({
        title: 'Error',
        message: `Failed to start snapshot "${t}"`,
        color: 'red',
      });
    }
  };

  const handleLoad = async (t: string) => {
    setBusy(true);
    try {
      await controllerClient.snapshotLoad(node, name, t);
      notifications.show({
        title: 'Snapshot',
        message: `Restoring "${t}"...`,
        color: 'blue',
      });
    } catch {
      setBusy(false);
      notifications.show({
        title: 'Error',
        message: `Failed to restore "${t}"`,
        color: 'red',
      });
    }
  };

  const handleDelete = async (t: string) => {
    setBusy(true);
    try {
      await controllerClient.snapshotDelete(node, name, t);
      notifications.show({
        title: 'Snapshot',
        message: `Deleting "${t}"...`,
        color: 'blue',
      });
    } catch {
      setBusy(false);
      notifications.show({
        title: 'Error',
        message: `Failed to delete "${t}"`,
        color: 'red',
      });
    }
  };

  if (!running) {
    return (
      <Center h="100%">
        <Alert icon={<IconInfoCircle size={16} />} color="gray" variant="light">
          Snapshots are only available while the instance is running.
        </Alert>
      </Center>
    );
  }

  return (
    <Stack gap="md">
      <Group>
        <TextInput
          placeholder="Snapshot name"
          value={tag}
          onChange={(e) => setTag(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void handleSave();
          }}
          disabled={busy}
          style={{ flex: 1 }}
        />
        <Button
          leftSection={<IconCamera size={16} />}
          onClick={handleSave}
          loading={busy}
          disabled={!tag.trim()}
        >
          Save snapshot
        </Button>
      </Group>

      {snapshots.length === 0 ? (
        <Text c="dimmed" size="sm">
          No snapshots yet.
        </Text>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Created</Table.Th>
              <Table.Th>VM state</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {snapshots.map((s) => (
              <Table.Tr key={s.tag}>
                <Table.Td>{s.tag}</Table.Td>
                <Table.Td>
                  {s.dateSec
                    ? new Date(Number(s.dateSec) * 1000).toLocaleString()
                    : '-'}
                </Table.Td>
                <Table.Td>
                  {s.vmStateSize
                    ? prettyBytes(Number(s.vmStateSize), { binary: true })
                    : '-'}
                </Table.Td>
                <Table.Td>
                  <Group gap="xs" justify="flex-end">
                    <Tooltip label="Restore (reverts the running VM)">
                      <ActionIcon
                        variant="light"
                        color="blue"
                        onClick={() => handleLoad(s.tag ?? '')}
                        disabled={busy || !s.tag}
                      >
                        <IconRestore size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Delete">
                      <ActionIcon
                        variant="light"
                        color="red"
                        onClick={() => handleDelete(s.tag ?? '')}
                        disabled={busy || !s.tag}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <Text c="dimmed" size="xs">
        Snapshots live inside the instance&apos;s disk. Removing the instance
        also destroys them.
      </Text>
    </Stack>
  );
}
