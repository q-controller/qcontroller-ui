import React from 'react';
import {
  Card,
  Title,
  Stack,
  Group,
  Progress,
  Text,
  RingProgress,
  SimpleGrid,
  ThemeIcon,
} from '@mantine/core';
import {
  IconCircleFilled,
  IconCpu,
  IconDatabase,
  IconDeviceDesktop,
} from '@tabler/icons-react';
import type { Stats } from '@/common/stats';
import prettyBytes from 'pretty-bytes';

interface VMData {
  label: string;
  value: number;
  color: string;
  used?: number;
}

function ResourceCard({
  title,
  icon,
  data,
  unit,
  color,
  onItemClick,
}: {
  title: string;
  icon: React.ReactNode;
  data: VMData[];
  unit: string;
  color: string;
  onItemClick?: (name: string) => void;
}) {
  const totalAllocated = data.reduce((sum, item) => sum + item.value, 0);
  const totalUsed = data.reduce((sum, item) => sum + (item.used || 0), 0);
  const hasUsage = data.some((d) => d.used !== undefined && d.used > 0);
  const usedPct =
    hasUsage && totalAllocated > 0
      ? Math.round(Math.min((totalUsed / totalAllocated) * 100, 100))
      : 0;

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group mb="md">
        {icon}
        <Title order={4}>{title}</Title>
      </Group>

      <Stack align="center" mb="md">
        {hasUsage ? (
          <>
            <RingProgress
              size={120}
              thickness={12}
              roundCaps
              sections={[{ value: usedPct, color }]}
              label={
                <Text ta="center" fw={700} size="lg">
                  {usedPct}%
                </Text>
              }
            />
            <Text size="sm" c="dimmed">
              {prettyBytes(totalUsed, { binary: true })} of{' '}
              {prettyBytes(totalAllocated, { binary: true })}
            </Text>
          </>
        ) : (
          <>
            <ThemeIcon color={color} size={64} radius="xl" variant="light">
              {icon}
            </ThemeIcon>
            <Text fw={700} size="xl">
              {data.some((d) => d.used !== undefined)
                ? prettyBytes(totalAllocated, { binary: true })
                : `${totalAllocated}${unit}`}
            </Text>
            <Text size="sm" c="dimmed">
              allocated
            </Text>
          </>
        )}
      </Stack>

      <Stack gap="xs">
        {data.map((item) => {
          const hasItemUsage = item.used !== undefined && item.used > 0;
          const itemUsedPct =
            hasItemUsage && item.value > 0
              ? Math.round(Math.min((item.used! / item.value) * 100, 100))
              : 0;
          const allocationPct =
            totalAllocated > 0 ? (item.value / totalAllocated) * 100 : 0;

          return (
            <div
              key={item.label}
              onClick={onItemClick ? () => onItemClick(item.label) : undefined}
              style={onItemClick ? { cursor: 'pointer' } : undefined}
            >
              <Group justify="space-between" mb={4} wrap="wrap" gap="xs">
                <Group gap="xs" style={{ flex: '1', minWidth: '0' }}>
                  <IconCircleFilled
                    size={12}
                    style={{ color: item.color, flexShrink: 0 }}
                  />
                  <Text size="sm" style={{ wordBreak: 'break-word' }}>
                    {item.label}
                  </Text>
                </Group>
                <Text size="sm" fw={500} style={{ flexShrink: 0 }}>
                  {hasItemUsage
                    ? `${prettyBytes(item.used!, { binary: true })} / ${prettyBytes(item.value, { binary: true })}`
                    : item.used !== undefined
                      ? prettyBytes(item.value, { binary: true })
                      : `${item.value}${unit}`}
                </Text>
              </Group>
              <Progress
                value={hasItemUsage ? itemUsedPct : allocationPct}
                color={item.color}
                size="sm"
                radius="xl"
              />
            </div>
          );
        })}
      </Stack>
    </Card>
  );
}

// Derives a stable color from a VM name by hashing it to a hue on the
// HSL color wheel (0-360). The same name always produces the same color,
// and with 360 possible hues collisions are unlikely for typical VM counts.
// Uses extra bit-mixing (integer finalizer with constant 0x45d9f3b) so that
// similar names (e.g. worker-node-1 vs worker-node-2) still produce
// visually distinct colors. See https://nullprogram.com/blog/2018/07/31/
function getColorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  hash = (((hash >>> 16) ^ hash) * 0x45d9f3b) | 0;
  hash = (((hash >>> 16) ^ hash) * 0x45d9f3b) | 0;
  hash = (hash >>> 16) ^ hash;
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 50%)`;
}

export default function ResourcePieCharts({
  vms,
  onInstanceClick,
}: {
  vms: Stats;
  onInstanceClick?: (name: string) => void;
}) {
  const ramData: VMData[] = [];
  const diskData: VMData[] = [];
  const cpusData: VMData[] = [];

  for (const name of Object.keys(vms)) {
    const vm = vms[name];
    const color = getColorForName(name);
    const allocatedBytes = (vm.details?.memory || 0) * 1024 * 1024;
    const memStats = vm.runtimeInfo?.memoryStats;
    const usedBytes =
      memStats?.totalMemory && memStats?.freeMemory && memStats?.diskCaches
        ? Number(memStats.totalMemory) -
          Number(memStats.freeMemory) -
          Number(memStats.diskCaches)
        : 0;

    ramData.push({
      label: name,
      value: allocatedBytes,
      color,
      used: usedBytes,
    });
    const allocatedDiskBytes = (vm.details?.disk || 0) * 1024 * 1024;
    const diskStats = vm.runtimeInfo?.diskStats;
    const usedDiskBytes = diskStats?.usedBytes
      ? Number(diskStats.usedBytes)
      : 0;

    diskData.push({
      label: name,
      value: allocatedDiskBytes,
      color,
      used: usedDiskBytes,
    });
    cpusData.push({
      label: name,
      value: vm.details?.cpus || 0,
      color,
    });
  }

  const charts = [
    {
      title: 'Memory',
      icon: <IconDeviceDesktop size={20} />,
      data: ramData,
      unit: ' GB',
      color: 'blue',
    },
    {
      title: 'Storage',
      icon: <IconDatabase size={20} />,
      data: diskData,
      unit: ' GB',
      color: 'green',
    },
    {
      title: 'CPU',
      icon: <IconCpu size={20} />,
      data: cpusData,
      unit: ' cores',
      color: 'orange',
    },
  ];

  // Handle empty state
  if (Object.keys(vms).length === 0) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Title order={3} mb="lg">
          Resource Usage
        </Title>
        <Text c="dimmed" ta="center" py="xl">
          No VMs running. Create a VM to see resource usage.
        </Text>
      </Card>
    );
  }

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
      {charts.map((chart) => (
        <ResourceCard
          key={chart.title}
          title={chart.title}
          icon={chart.icon}
          data={chart.data}
          unit={chart.unit}
          color={chart.color}
          onItemClick={onInstanceClick}
        />
      ))}
    </SimpleGrid>
  );
}
