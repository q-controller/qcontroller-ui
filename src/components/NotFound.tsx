import { Container, Title, Text, Center, Stack } from '@mantine/core';

export default function NotFound() {
  return (
    <Container size="sm" py="xl">
      <Center>
        <Stack align="center" gap="md">
          <Title order={1} c="dimmed">
            404
          </Title>
          <Text size="lg" c="dimmed">
            Page not found
          </Text>
        </Stack>
      </Center>
    </Container>
  );
}
