import { Button, Center, Paper, Stack, Title, Text } from '@mantine/core';
import { IconLogin } from '@tabler/icons-react';
import type { AuthProvider } from '@/common/auth-client';

export interface LoginProps {
  providers: AuthProvider[];
}

export default function Login({ providers }: LoginProps) {
  return (
    <Center mih="100vh" bg="var(--color-semantic-surface-page)">
      <Paper shadow="md" p="xl" radius="md" withBorder maw={400} w="100%">
        <Stack>
          <Title order={3} ta="center">
            Sign in to qcontroller
          </Title>
          {providers.length === 0 ? (
            <Text c="dimmed" ta="center">
              No login providers configured.
            </Text>
          ) : (
            providers
              .filter(
                (p): p is AuthProvider & { name: string; loginUrl: string } =>
                  !!p.name && !!p.loginUrl
              )
              .map((p) => (
                <Button
                  key={p.name}
                  component="a"
                  href={p.loginUrl}
                  leftSection={<IconLogin size={16} />}
                  fullWidth
                >
                  Sign in with {p.displayName || p.name}
                </Button>
              ))
          )}
        </Stack>
      </Paper>
    </Center>
  );
}
