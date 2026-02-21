import React, { useEffect, useState } from 'react';
import {
  Card,
  Title,
  Stack,
  Group,
  Progress,
  Text,
  Badge,
  ActionIcon,
  Indicator,
} from '@mantine/core';
import {
  IconCpu,
  IconDatabase,
  IconDeviceDesktop,
  IconChevronLeft,
  IconChevronRight,
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
}: {
  title: string;
  icon: React.ReactNode;
  data: VMData[];
  unit: string;
  color: string;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group mb="md">
        {icon}
        <Title order={4}>{title}</Title>
      </Group>

      <Stack gap="xs">
        {data.map((item) => {
          const percentage = total > 0 ? (item.value / total) * 100 : 0;
          const hasUsage = item.used !== undefined;
          const usedPct = hasUsage
            ? Math.min((item.used! / item.value) * 100, 100)
            : 0;

          return (
            <div key={item.label}>
              <Group justify="space-between" mb={4} wrap="wrap" gap="xs">
                <Group gap="xs" style={{ flex: '1', minWidth: '0' }}>
                  <Badge size="xs" color={item.color} variant="filled" />
                  <Text size="sm" style={{ wordBreak: 'break-word' }}>
                    {item.label}
                  </Text>
                </Group>
                <Text size="sm" fw={500} style={{ flexShrink: 0 }}>
                  {hasUsage ? (
                    <>
                      {prettyBytes(item.used!, { binary: true })} /{' '}
                      {prettyBytes(item.value, { binary: true })}
                    </>
                  ) : (
                    <>
                      {item.value}
                      {unit}
                    </>
                  )}
                </Text>
              </Group>
              {hasUsage ? (
                <Progress.Root size="sm" radius="xl">
                  <Progress.Section value={usedPct} color={item.color} />
                  <Progress.Section value={100 - usedPct} color="gray.2" />
                </Progress.Root>
              ) : (
                <Progress
                  value={percentage}
                  color={item.color}
                  size="sm"
                  radius="xl"
                />
              )}
            </div>
          );
        })}

        <Group
          justify="space-between"
          mt="md"
          pt="md"
          style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}
        >
          <Text fw={700}>Total</Text>
          <Text fw={700}>
            {data.some((d) => d.used !== undefined)
              ? prettyBytes(total, { binary: true })
              : `${total}${unit}`}
          </Text>
        </Group>
      </Stack>
    </Card>
  );
}

function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

export default function ResourcePieCharts({ vms }: { vms: Stats }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [colors, setColors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    setTimeout(() => {
      const newColors = { ...colors };
      for (const name of Object.keys(colors)) {
        if (!vms[name]) {
          delete newColors[name];
        }
      }
      for (const name of Object.keys(vms)) {
        if (!newColors[name]) {
          newColors[name] = getRandomColor();
        }
      }
      setColors(newColors);
    }, 0);
  }, [colors, vms]);

  const ramData: VMData[] = [];
  const diskData: VMData[] = [];
  const cpusData: VMData[] = [];

  for (const name of Object.keys(vms)) {
    const vm = vms[name];
    const color = colors[name];
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
      title: 'Memory Usage',
      icon: <IconDeviceDesktop size={20} />,
      data: ramData,
      unit: ' GB',
      color: 'blue',
    },
    {
      title: 'Storage Usage',
      icon: <IconDatabase size={20} />,
      data: diskData,
      unit: ' GB',
      color: 'green',
    },
    {
      title: 'CPU Allocation',
      icon: <IconCpu size={20} />,
      data: cpusData,
      unit: ' cores',
      color: 'orange',
    },
  ];

  const nextChart = () => {
    setActiveIndex((prev) => (prev + 1) % charts.length);
  };

  const prevChart = () => {
    setActiveIndex((prev) => (prev - 1 + charts.length) % charts.length);
  };

  const currentChart = charts[activeIndex];

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
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group justify="space-between" align="center" mb="lg" wrap="wrap">
        <Title order={3}>Resource Usage</Title>
        {charts.length > 1 && (
          <Group gap="xs" style={{ flexShrink: 0 }}>
            <ActionIcon variant="light" size="sm" onClick={prevChart}>
              <IconChevronLeft size={16} />
            </ActionIcon>
            <Group gap={4}>
              {charts.map((_, index) => (
                <Indicator
                  key={index}
                  size={8}
                  color={index === activeIndex ? 'blue' : 'gray'}
                  onClick={() => setActiveIndex(index)}
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </Group>
            <ActionIcon variant="light" size="sm" onClick={nextChart}>
              <IconChevronRight size={16} />
            </ActionIcon>
          </Group>
        )}
      </Group>

      <ResourceCard
        title={currentChart.title}
        icon={currentChart.icon}
        data={currentChart.data}
        unit={currentChart.unit}
        color={currentChart.color}
      />
    </Card>
  );
}
