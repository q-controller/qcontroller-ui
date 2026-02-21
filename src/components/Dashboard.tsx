import React, { useContext, useEffect, useReducer } from 'react';
import { SimpleGrid, Stack, Title, Container, Text } from '@mantine/core';
import {
  IconServer,
  IconCpu,
  IconDatabase,
  IconStack,
} from '@tabler/icons-react';
const CreateVMWidget = React.lazy(() => import('@/components/CreateVM'));
import ResourcePieCharts from '@/components/ResourcePieCharts';
import StatCard from './StatCard';
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
      if (!action.payload.name) {
        return state;
      }

      if (!action.payload.details) {
        return state;
      }

      const newState = { ...state };
      newState[action.payload.name] = action.payload;
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
  const updates = useContext(UpdatesContext);

  useEffect(() => {
    controllerClient.list().then((data) => {
      for (const vm of data) {
        if (vm.details) {
          dispatch({
            type: VMEvent_EventType.EVENT_TYPE_UPDATED,
            payload: vm,
          });
        }
      }
    });
  }, []);

  useEffect(() => {
    if (updates?.vmEvent) {
      switch (updates.vmEvent.type) {
        case VMEvent_EventType.EVENT_TYPE_UPDATED:
          if (updates.vmEvent.info?.name) {
            controllerClient.get(updates.vmEvent.info.name).then((data) => {
              if (data) {
                dispatch({
                  type: VMEvent_EventType.EVENT_TYPE_UPDATED,
                  payload: data,
                });
              }
            });
          }
          break;
        case VMEvent_EventType.EVENT_TYPE_REMOVED:
          if (updates.vmEvent.info?.name) {
            dispatch({
              type: VMEvent_EventType.EVENT_TYPE_REMOVED,
              payload: updates.vmEvent.info.name,
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
        <div>
          <Title order={1} mb="xs">
            Dashboard
          </Title>
          <Text c="dimmed" size="lg">
            Monitor your virtual machines and create new instances
          </Text>
        </div>

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
            value={`${Object.values(vms).reduce((sum, vm) => sum + (vm.details?.cpus || 0), 0)}`}
            icon={<IconCpu size={20} />}
            color="green"
          />
          <StatCard
            title="Total Storage"
            value={`${prettyBytes(mbToBytes(Object.values(vms).reduce((sum, vm) => sum + (vm.details?.disk || 0), 0)), { binary: true })}`}
            icon={<IconDatabase size={20} />}
            color="orange"
          />
          <StatCard
            title="Total RAM"
            value={`${prettyBytes(mbToBytes(Object.values(vms).reduce((sum, vm) => sum + (vm.details?.memory || 0), 0)), { binary: true })}`}
            icon={<IconStack size={20} />}
            color="red"
          />
        </SimpleGrid>

        {/* Resource Overview */}
        <ResourcePieCharts vms={vms} />

        {/* Create VM */}
        <CreateVMWidget />
      </Stack>
    </Container>
  );
}
