import { AppShell, Burger, Group, Title, NavLink } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconDashboard,
  IconPhoto,
  IconServer,
} from '@tabler/icons-react';
import { Outlet, Link, useLocation } from 'react-router';
import {
  DASHBOARD_PATH,
  IMAGES_PATH,
  NODES_PATH,
} from '@/common/paths';

export default function App() {
  const [opened, { toggle }] = useDisclosure(false);
  const location = useLocation();

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
