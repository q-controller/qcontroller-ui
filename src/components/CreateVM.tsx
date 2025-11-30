import React, { useState } from 'react';
import type { ServicesV1CreateRequest } from '@/common/controller-client';
import {
  Card,
  TextInput,
  Button,
  Title,
  Group,
  Stack,
  NumberInput,
  Checkbox,
  Select,
} from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { controllerClient } from '@/common/controller-client';
import { imageClient } from '@/common/image-client';
import { notifications } from '@mantine/notifications';
import {
  convertFromMB,
  convertToMB,
  getUnitOptions,
  type MemoryUnit,
} from '@/common/unit-conversion';

const defaultForm: ServicesV1CreateRequest = {
  name: '',
  image: '',
  start: true,
  vm: {
    cpus: 1,
    disk: convertToMB(40, 'G'), // 40GB
    memory: convertToMB(1, 'G'), // 1GB
  },
};

export default function CreateVMWidget() {
  const [imageOptions, setImageOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [diskUnit, setDiskUnit] = useState<MemoryUnit>('G');
  const [memoryUnit, setMemoryUnit] = useState<MemoryUnit>('G');
  const [form, setForm] = useState<ServicesV1CreateRequest>(defaultForm);

  const handleCreate = async () => {
    setLoading(true);
    try {
      await controllerClient.create(form);
      setForm(defaultForm);
    } catch {
      notifications.show({
        title: 'Error',
        message: `Failed to create VM`,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Title order={3} mb="md">
        Create VM
      </Title>
      <Stack gap="md">
        <TextInput
          label="VM Name"
          placeholder="Enter VM name"
          value={form.name || ''}
          onChange={(e) =>
            setForm((f) => ({ ...f, name: e.currentTarget?.value }))
          }
          disabled={loading}
          required
        />
        <Select
          label="Image"
          placeholder="Select image"
          data={imageOptions}
          value={form.image || ''}
          onChange={(val) => setForm((f) => ({ ...f, image: val || '' }))}
          disabled={loading}
          required
          searchable
          onFocus={async () => {
            if (imageOptions.length === 0) {
              try {
                const imgs = await imageClient.list();
                setImageOptions(
                  imgs.map((img) => ({ value: img.id, label: img.id }))
                );
              } catch {
                notifications.show({
                  title: 'Error',
                  message: 'Failed to fetch images',
                  color: 'red',
                });
              }
            }
          }}
        />
        <Checkbox
          label="Start after creation"
          checked={form.start || false}
          onChange={(e) =>
            setForm((f) => ({ ...f, start: e.currentTarget.checked }))
          }
          disabled={loading}
        />
        <NumberInput
          label="CPUs"
          placeholder="Number of CPUs"
          value={form.vm?.cpus ?? ''}
          onChange={(val) =>
            setForm((f) => ({
              ...f,
              vm: { ...f.vm, cpus: parseInt(String(val)) },
            }))
          }
          min={1}
          disabled={loading}
        />
        <Group gap="xs" grow>
          <NumberInput
            label="Disk size"
            placeholder="e.g. 40"
            value={convertFromMB(form.vm?.disk || 0, diskUnit)}
            onChange={(val) =>
              setForm((f) => ({
                ...f,
                vm: { ...f.vm, disk: convertToMB(Number(val) || 0, diskUnit) },
              }))
            }
            min={0}
            step={0.1}
            decimalSeparator="."
            disabled={loading}
            required
          />
          <Select
            label="Disk unit"
            data={getUnitOptions()}
            value={diskUnit}
            onChange={(val) => {
              setDiskUnit((val ?? 'G') as MemoryUnit);
            }}
            disabled={loading}
            required
          />
        </Group>
        <Group gap="xs" grow>
          <NumberInput
            label="Memory size"
            placeholder="e.g. 2"
            value={convertFromMB(form.vm?.memory || 0, memoryUnit)}
            onChange={(val) =>
              setForm((f) => ({
                ...f,
                vm: {
                  ...f.vm,
                  memory: convertToMB(Number(val) || 0, memoryUnit),
                },
              }))
            }
            min={0}
            step={0.1}
            decimalSeparator="."
            disabled={loading}
            required
          />
          <Select
            label="Memory unit"
            data={getUnitOptions()}
            value={memoryUnit}
            onChange={(val) => {
              setMemoryUnit((val ?? 'G') as MemoryUnit);
            }}
            disabled={loading}
            required
          />
        </Group>
        <Group justify="flex-end">
          <Button
            leftSection={<IconPlus size={18} />}
            onClick={handleCreate}
            loading={loading}
            disabled={
              !(form.name && form.name.trim()) ||
              !form.image ||
              !form.vm?.cpus ||
              !form.vm?.disk ||
              !form.vm?.memory ||
              loading
            }
          >
            Create
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}
