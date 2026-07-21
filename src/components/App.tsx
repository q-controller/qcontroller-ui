import {
  AppShell,
  Burger,
  Group,
  Title,
  NavLink,
  Menu,
  ActionIcon,
  Text,
  useMantineColorScheme,
  useComputedColorScheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconDashboard,
  IconPhoto,
  IconUserCircle,
  IconLogout,
  IconMoon,
  IconSun,
} from '@tabler/icons-react';
import { Outlet, Link, useLocation } from 'react-router';
import { DASHBOARD_PATH, IMAGES_PATH } from '@/common/paths';
import { useAuth } from '@/common/auth-context';

export default function App() {
  const [opened, { toggle }] = useDisclosure(false);
  const location = useLocation();
  const { identity, logout } = useAuth();
  const { setColorScheme } = useMantineColorScheme();
  const colorScheme = useComputedColorScheme('light');

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
      <AppShell.Header bg="var(--color-semantic-surface-header)" px="md">
        <Group h="100%" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
              color="var(--color-semantic-text-on-header)"
            />
            <Title order={3} c="var(--color-semantic-text-on-header)">
              VM Control Panel
            </Title>
          </Group>
          <Group gap="xs">
            <ActionIcon
              variant="subtle"
              c="var(--color-semantic-text-on-header)"
              size="lg"
              aria-label="Toggle color scheme"
              onClick={() =>
                setColorScheme(colorScheme === 'light' ? 'dark' : 'light')
              }
            >
              {colorScheme === 'light' ? (
                <IconMoon size={20} />
              ) : (
                <IconSun size={20} />
              )}
            </ActionIcon>
            {identity && (
              <Menu position="bottom-end" withArrow>
                <Menu.Target>
                  <ActionIcon
                    variant="subtle"
                    c="var(--color-semantic-text-on-header)"
                    size="lg"
                    aria-label="User menu"
                  >
                    <IconUserCircle size={24} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>
                    <Text size="sm" fw={500}>
                      {identity.name || identity.email || identity.subject}
                    </Text>
                    {identity.email && identity.name && (
                      <Text size="xs" c="dimmed">
                        {identity.email}
                      </Text>
                    )}
                  </Menu.Label>
                  <Menu.Divider />
                  <Menu.Item
                    leftSection={<IconLogout size={14} />}
                    onClick={() => {
                      void logout();
                    }}
                  >
                    Log out
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            )}
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar bg="var(--color-semantic-surface-page)" p="md">
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
