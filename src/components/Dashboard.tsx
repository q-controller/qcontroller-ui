import React, {
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
import {
  SimpleGrid,
  Stack,
  Title,
  Container,
  Text,
  Button,
  Modal,
  Group,
} from '@mantine/core';
import {
  IconServer,
  IconCpu,
  IconDatabase,
  IconStack,
  IconPlus,
} from '@tabler/icons-react';
const CreateVMWidget = React.lazy(() => import('@/components/CreateVM'));
const InstanceWidget = React.lazy(() => import('@/components/Instance'));
import ResourcePieCharts from '@/components/ResourcePieCharts';
import StatCard from './StatCard';
import Nodes from '@/components/Nodes';
import type { ServicesV1Info } from '@/common/controller-client';
import { VMEvent_EventType } from '@/common/updates';
import { controllerClient } from '@/common/controller-client';
import { UpdatesContext } from '@/common/updates-context';
import prettyBytes from 'pretty-bytes';
import type { Stats } from '@/common/stats';
import { mbToBytes } from '@/common/unit-conversion';

interface UpdateAction {
  type: VMEvent_EventType.EVENT_TYPE_UPDATED;
  payload: Partial<ServicesV1Info>;
}

interface RemoveAction {
  type: VMEvent_EventType.EVENT_TYPE_REMOVED;
  payload: string;
}

function vmsReducer(state: Stats, action: UpdateAction | RemoveAction) {
  switch (action.type) {
    case VMEvent_EventType.EVENT_TYPE_UPDATED: {
      const node = action.payload.node;
      const name = action.payload.info?.name;
      if (!name || !action.payload.info?.spec?.vm) {
        return state;
      }
      const key = node ? `${node}:${name}` : name;
      const newState = { ...state };
      newState[key] = action.payload;
      return newState;
    }
    case VMEvent_EventType.EVENT_TYPE_REMOVED: {
      const newState = { ...state };
      delete newState[action.payload];
      return newState;
    }
    default:
      return state;
  }
}

export default function Dashboard() {
  const [vms, dispatch] = useReducer(vmsReducer, {});
  const [createOpen, setCreateOpen] = useState(false);
  const createAbortRef = useRef<AbortController | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
  const updates = useContext(UpdatesContext);

  useEffect(() => {
    controllerClient
      .listNodes()
      .then((nodes) => {
        for (const node of nodes) {
          controllerClient
            .list(node.name || '')
            .then((data) => {
              for (const vm of data) {
                if (vm.info?.spec?.vm) {
                  dispatch({
                    type: VMEvent_EventType.EVENT_TYPE_UPDATED,
                    payload: vm,
                  });
                }
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const vmEvent = updates?.update?.vmEvent;
    if (vmEvent) {
      switch (vmEvent.type) {
        case VMEvent_EventType.EVENT_TYPE_UPDATED:
          if (vmEvent.info) {
            dispatch({
              type: VMEvent_EventType.EVENT_TYPE_UPDATED,
              payload: {
                node: updates?.node,
                info: vmEvent.info,
              } as Partial<ServicesV1Info>,
            });
          }
          break;
        case VMEvent_EventType.EVENT_TYPE_REMOVED:
          if (vmEvent.info?.name) {
            const removeKey = updates?.node
              ? `${updates.node}:${vmEvent.info.name}`
              : vmEvent.info.name;
            dispatch({
              type: VMEvent_EventType.EVENT_TYPE_REMOVED,
              payload: removeKey,
            });
          }
          break;
        default:
          break;
      }
    }
  }, [updates]);

  return (
    <Container size="xl" py="xl" px="md">
      <Stack gap="xl">
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={1} mb="xs">
              Dashboard
            </Title>
            <Text c="dimmed" size="lg">
              Monitor your virtual machines
            </Text>
          </div>
          <Button
            leftSection={<IconPlus size={18} />}
            size="md"
            onClick={() => setCreateOpen(true)}
          >
            Create VM
          </Button>
        </Group>

        <Modal
          opened={createOpen}
          onClose={() => {
            if (createAbortRef.current) {
              createAbortRef.current.abort();
              createAbortRef.current = null;
            }
            setCreateOpen(false);
          }}
          title="Create VM"
          size="lg"
        >
          <CreateVMWidget
            abortRef={createAbortRef}
            onCancel={() => setCreateOpen(false)}
          />
        </Modal>

        <Modal
          opened={selectedInstance !== null && selectedInstance in vms}
          onClose={() => setSelectedInstance(null)}
          size="xl"
          fullScreen
        >
          {selectedInstance && (
            <InstanceWidget
              instanceName={selectedInstance}
              initialData={vms[selectedInstance]}
            />
          )}
        </Modal>

        {/* Quick Stats */}
        <SimpleGrid cols={{ base: 1, xs: 2, sm: 2, md: 4 }} spacing="md">
          <StatCard
            title="Total VMs"
            value={`${Object.keys(vms).length}`}
            icon={<IconServer size={20} />}
            color="blue"
          />
          <StatCard
            title="Total CPUs"
            value={`${Object.values(vms).reduce((sum, vm) => sum + (vm.info?.spec?.vm?.cpus || 0), 0)}`}
            icon={<IconCpu size={20} />}
            color="green"
          />
          <StatCard
            title="Total Storage"
            value={`${prettyBytes(mbToBytes(Object.values(vms).reduce((sum, vm) => sum + (vm.info?.spec?.vm?.disk || 0), 0)), { binary: true })}`}
            icon={<IconDatabase size={20} />}
            color="orange"
          />
          <StatCard
            title="Total RAM"
            value={`${prettyBytes(mbToBytes(Object.values(vms).reduce((sum, vm) => sum + (vm.info?.spec?.vm?.memory || 0), 0)), { binary: true })}`}
            icon={<IconStack size={20} />}
            color="red"
          />
        </SimpleGrid>

        {/* Resource Overview */}
        <ResourcePieCharts
          vms={vms}
          onInstanceClick={(name) => setSelectedInstance(name)}
        />

        {/* Nodes */}
        <Nodes />
      </Stack>
    </Container>
  );
}
