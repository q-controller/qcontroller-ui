import { AppShell, Burger, Group, Title, NavLink } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconDashboard,
  IconPhoto,
  IconServer,
} from '@tabler/icons-react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import {
  DASHBOARD_PATH,
  IMAGES_PATH,
  INSTANCES_PATH,
  NODES_PATH,
} from '@/common/paths';
import { useContext, useEffect } from 'react';
import { UpdatesContext } from '@/common/updates-context';
import { VMEvent_EventType } from '@/common/updates';

export default function App() {
  const [opened, { toggle }] = useDisclosure(false);
  const location = useLocation();
  const navigate = useNavigate();
  const updates = useContext(UpdatesContext);

  useEffect(() => {
    if (
      updates?.vmEvent?.type === VMEvent_EventType.EVENT_TYPE_REMOVED &&
      updates.vmEvent.info?.name &&
      location.pathname === `${INSTANCES_PATH}/${updates.vmEvent.info.name}`
    ) {
      navigate(DASHBOARD_PATH, { replace: true });
    }
  }, [updates, location.pathname, navigate]);

  return (
    <AppShell
      padding="md"
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
    >
      <AppShell.Header bg="blue.7" px="md">
        <Group h="100%" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
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
          label="Nodes"
          mb="xs"
          leftSection={<IconServer size={16} stroke={1.5} />}
          variant={location.pathname === NODES_PATH ? 'filled' : 'subtle'}
          component={Link}
          to={NODES_PATH}
          active
        />
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
