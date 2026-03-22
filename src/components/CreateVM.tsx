import React, { type RefObject, useContext, useEffect, useState } from 'react';
import {
  TextInput,
  Button,
  Group,
  Stack,
  NumberInput,
  Checkbox,
  Select,
  Progress,
  Text,
} from '@mantine/core';
import type { ServicesV1CreateRequest } from '@/common/controller-client';
const YamlEditor = React.lazy(() => import('@/components/YamlEditor'));
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
import { UpdatesContext } from '@/common/updates-context';

const defaultForm: ServicesV1CreateRequest = {
  node: '',
  spec: {
    image: '',
    vm: {
      cpus: 1,
      disk: convertToMB(40, 'G'), // 40GB
      memory: convertToMB(1, 'G'), // 1GB
    },
    cloudInit: {
      networkConfig: '',
      userdata: '',
    },
  },
  name: '',
  start: true,
};

export default function CreateVMWidget({
  abortRef,
  onCancel,
}: {
  abortRef: RefObject<AbortController | null>;
  onCancel?: () => void;
}) {
  const [nodeOptions, setNodeOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [imageOptions, setImageOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [progressPercent, setProgressPercent] = useState<number | null>(null);
  const [progressMessage, setProgressMessage] = useState('');
  const [diskUnit, setDiskUnit] = useState<MemoryUnit>('G');
  const [memoryUnit, setMemoryUnit] = useState<MemoryUnit>('G');
  const [form, setForm] = useState<ServicesV1CreateRequest>(defaultForm);
  const updates = useContext(UpdatesContext);

  // Listen for progress events while creating.
  useEffect(() => {
    const progress = updates?.update?.progressEvent;
    if (!loading || !progress) return;
    setProgressPercent(progress.percent);
    setProgressMessage(progress.message);
  }, [updates, loading]);

  const handleCreate = async () => {
    const abort = new AbortController();
    abortRef.current = abort;
    setLoading(true);
    setProgressPercent(null);
    setProgressMessage('');
    try {
      await controllerClient.create(form, abort.signal);
      setForm(defaultForm);
    } catch {
      if (abort.signal.aborted) return;
      notifications.show({
        title: 'Error',
        message: `Failed to create VM`,
        color: 'red',
      });
    } finally {
      setLoading(false);
      setProgressPercent(null);
      setProgressMessage('');
      abortRef.current = null;
    }
  };

  const handleCancel = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setLoading(false);
    setProgressPercent(null);
    setProgressMessage('');
    onCancel?.();
  };

  return (
    <Stack gap="md">
      <TextInput
        label="VM Name"
        placeholder="Enter VM name"
        value={form.name || ''}
        onChange={(e) =>
          setForm((f) => ({
            ...f,
            name: e.currentTarget?.value,
          }))
        }
        disabled={loading}
        required
      />
      <Select
        label="Image"
        placeholder="Select image"
        data={imageOptions}
        value={form.spec?.image || null}
        onChange={(val) =>
          setForm((f) => ({ ...f, spec: { ...f.spec, image: val || '' } }))
        }
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
      <Select
        label="Node"
        placeholder="Auto (scheduler picks)"
        data={nodeOptions}
        value={form.node || null}
        onChange={(val) => setForm((f) => ({ ...f, node: val || '' }))}
        disabled={loading}
        clearable
        onFocus={async () => {
          if (nodeOptions.length === 0) {
            try {
              const nodes = await controllerClient.listNodes();
              setNodeOptions(
                nodes.map((n) => ({ value: n.name || '', label: n.name || '' }))
              );
            } catch {
              notifications.show({
                title: 'Error',
                message: 'Failed to fetch nodes',
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
      <Stack gap="xs">
        <YamlEditor
          value={form.spec?.cloudInit?.userdata || ''}
          onChange={(val) =>
            setForm((f) => ({
              ...f,
              spec: {
                ...f.spec,
                cloudInit: { ...f.spec?.cloudInit, userdata: val },
              },
            }))
          }
          editable={!loading}
          label="Cloud-init user-data (YAML)"
        />
        <YamlEditor
          value={form.spec?.cloudInit?.networkConfig || ''}
          onChange={(val) =>
            setForm((f) => ({
              ...f,
              spec: {
                ...f.spec,
                cloudInit: { ...f.spec?.cloudInit, networkConfig: val },
              },
            }))
          }
          editable={!loading}
          label="Cloud-init network-config (YAML)"
        />
      </Stack>
      <NumberInput
        label="CPUs"
        placeholder="Number of CPUs"
        value={form.spec?.vm?.cpus ?? ''}
        onChange={(val) =>
          setForm((f) => ({
            ...f,
            spec: {
              ...f.spec,
              vm: { ...f.spec?.vm, cpus: parseInt(String(val)) },
            },
          }))
        }
        min={1}
        disabled={loading}
      />
      <Group gap="xs" grow>
        <NumberInput
          label="Disk size"
          placeholder="e.g. 40"
          value={convertFromMB(form.spec?.vm?.disk || 0, diskUnit)}
          onChange={(val) =>
            setForm((f) => ({
              ...f,
              spec: {
                ...f.spec,
                vm: {
                  ...f.spec?.vm,
                  disk: convertToMB(Number(val) || 0, diskUnit),
                },
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
          value={convertFromMB(form.spec?.vm?.memory || 0, memoryUnit)}
          onChange={(val) =>
            setForm((f) => ({
              ...f,
              spec: {
                ...f.spec,
                vm: {
                  ...f.spec?.vm,
                  memory: convertToMB(Number(val) || 0, memoryUnit),
                },
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

      {loading && progressPercent !== null && (
        <Stack gap={4}>
          <Text size="sm" c="dimmed">
            {progressMessage} — {progressPercent}%
          </Text>
          <Progress value={progressPercent} size="sm" radius="xl" animated />
        </Stack>
      )}

      <Group justify="flex-end">
        {loading && (
          <Button variant="subtle" color="gray" onClick={handleCancel}>
            Cancel
          </Button>
        )}
        <Button
          leftSection={<IconPlus size={18} />}
          onClick={handleCreate}
          loading={loading}
          disabled={
            !(form.name && form.name.trim()) ||
            !form.spec?.image ||
            !form.spec?.vm?.cpus ||
            !form.spec?.vm?.disk ||
            !form.spec?.vm?.memory ||
            loading
          }
        >
          Create
        </Button>
      </Group>
    </Stack>
  );
}
