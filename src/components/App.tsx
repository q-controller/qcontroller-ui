import { AppShell, Burger, Group, Title, NavLink } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconCpu, IconDashboard, IconPhoto } from '@tabler/icons-react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { DASHBOARD_PATH, IMAGES_PATH, INSTANCES_PATH } from '@/common/paths';
import { useContext, useEffect, useReducer } from 'react';
import { controllerClient } from '@/common/controller-client';
import type { ServicesV1Info } from '@/common/controller-client';
import { UpdatesContext } from '@/common/updates-context';
import { VMEvent_EventType } from '@/common/updates';

interface UpdateAction {
  type: VMEvent_EventType.EVENT_TYPE_UPDATED;
  payload: Array<ServicesV1Info>;
}

interface RemoveAction {
  type: VMEvent_EventType.EVENT_TYPE_REMOVED;
  payload: string;
}

function instancesReducer(
  state: Array<ServicesV1Info>,
  action: UpdateAction | RemoveAction
) {
  switch (action.type) {
    case VMEvent_EventType.EVENT_TYPE_REMOVED:
      return state.filter((inst) => inst.name !== action.payload);
    case VMEvent_EventType.EVENT_TYPE_UPDATED: {
      const newState = [...state];
      for (const updatedInst of action.payload) {
        const index = state.findIndex((inst) => inst.name === updatedInst.name);
        if (index === -1) {
          newState.push(updatedInst);
        } else {
          newState[index] = updatedInst;
        }
      }
      return newState;
    }
    default:
      return state;
  }
}

export default function App() {
  const [opened, { toggle }] = useDisclosure(false);
  const [instances, dispatch] = useReducer(instancesReducer, []);
  const location = useLocation();
  const navigate = useNavigate();
  const updates = useContext(UpdatesContext);

  useEffect(() => {
    const fetchInstances = async () => {
      const insts = await controllerClient.list();
      dispatch({
        type: VMEvent_EventType.EVENT_TYPE_UPDATED,
        payload: insts,
      });
    };
    fetchInstances();
  }, []);

  useEffect(() => {
    if (updates && updates.vmEvent) {
      switch (updates.vmEvent.type) {
        case VMEvent_EventType.EVENT_TYPE_REMOVED: {
          if (updates.vmEvent?.info?.name) {
            dispatch({
              type: VMEvent_EventType.EVENT_TYPE_REMOVED,
              payload: updates.vmEvent?.info?.name,
            });
            const removedName = updates.vmEvent?.info?.name;
            if (location.pathname === `${INSTANCES_PATH}/${removedName}`) {
              navigate(DASHBOARD_PATH, { replace: true });
            }
          }
          break;
        }
        default:
          if (updates.vmEvent?.info) {
            dispatch({
              type: VMEvent_EventType.EVENT_TYPE_UPDATED,
              payload: [updates.vmEvent.info as ServicesV1Info],
            });
          }
          break;
      }
    }
  }, [updates, location.pathname, navigate]);

  return (
    <AppShell
      padding="md"
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm', // Hides navbar below 'sm' (mobile)
        collapsed: { mobile: !opened },
      }}
    >
      {/* HEADER */}
      <AppShell.Header bg="blue.7" px="md">
        <Group h="100%" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm" // Only show on mobile
              size="sm"
              color="white"
            />
            <Title order={3} c="white">
              VM Control Panel
            </Title>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar bg="gray.0" p="md">
        <NavLink
          label="Dashboard"
          mb="xs"
          leftSection={<IconDashboard size={16} stroke={1.5} />}
          variant={location.pathname === DASHBOARD_PATH ? 'filled' : 'subtle'}
          component={Link}
          to={DASHBOARD_PATH}
          active
        />
        <NavLink
          label="VM instances"
          mb="xs"
          leftSection={<IconCpu size={16} stroke={1.5} />}
          variant={location.pathname === INSTANCES_PATH ? 'filled' : 'subtle'}
          active
        >
          {instances.map((inst) => (
            <NavLink
              key={inst.name}
              label={inst.name}
              mb="xs"
              leftSection={<IconCpu size={16} stroke={1.5} />}
              variant={
                location.pathname === `${INSTANCES_PATH}/${inst.name}`
                  ? 'filled'
                  : 'subtle'
              }
              component={Link}
              to={`${INSTANCES_PATH}/${inst.name}`}
              active
            />
          ))}
        </NavLink>
        <NavLink
          label="VM Images"
          mb="xs"
          leftSection={<IconPhoto size={16} stroke={1.5} />}
          variant={location.pathname === IMAGES_PATH ? 'filled' : 'subtle'}
          component={Link}
          to={IMAGES_PATH}
          active
        />
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
