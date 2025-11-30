import { useState, useRef, useEffect } from 'react';
import {
  Table,
  Button,
  Group,
  ActionIcon,
  FileButton,
  ThemeIcon,
  Loader,
  Overlay,
  Text,
  Stack,
  Card,
  Modal,
  TextInput,
} from '@mantine/core';
import { IconPhoto, IconTrash, IconUpload } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { imageClient, VMImage } from '@/common/image-client';

const UI_TEXTS = {
  UPLOAD_BUTTON: 'Add VM Image',
  UPLOADING: 'Uploading...',
  ERROR_INVALID_ID: 'Please enter a valid image ID',
} as const;

// Utility functions
const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

// Reusable Upload Button Component
interface UploadButtonProps {
  onFileSelect: (file: File) => void;
  loading?: boolean;
  variant?: 'filled' | 'light';
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const UploadButton = ({
  onFileSelect,
  loading = false,
  variant = 'filled',
  size = 'md',
}: UploadButtonProps) => {
  const fileButtonRef = useRef<() => void>(null);

  return (
    <FileButton
      onChange={(file) => file && onFileSelect(file)}
      resetRef={fileButtonRef}
      disabled={loading}
    >
      {(props) => (
        <Button
          leftSection={
            loading ? <Loader size={16} /> : <IconUpload size={16} />
          }
          loading={loading}
          disabled={loading}
          variant={variant}
          size={size}
          {...props}
        >
          {loading ? UI_TEXTS.UPLOADING : UI_TEXTS.UPLOAD_BUTTON}
        </Button>
      )}
    </FileButton>
  );
};

export default function Images() {
  const [images, setImages] = useState<VMImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Upload dialog state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customId, setCustomId] = useState('');
  const [idError, setIdError] = useState<string | null>(null);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const imgs = await imageClient.list();
      setImages(imgs);
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to load images',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setCustomId(file.name);
    setUploadDialogOpen(true);
    setIdError(null);
  };

  const handleUploadConfirm = async () => {
    if (!selectedFile || !customId.trim()) {
      setIdError(UI_TEXTS.ERROR_INVALID_ID);
      return;
    }

    try {
      setIdError(null);
      setUploading(true);
      await imageClient.upload({
        file: selectedFile,
        id: customId.trim(),
      });
      // Optimistic update
      const imgs = await imageClient.list();
      setImages(imgs);
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setCustomId('');
      notifications.show({
        title: 'Success',
        message: 'VM image uploaded successfully',
        color: 'green',
      });
    } catch (err) {
      notifications.show({
        title: 'Upload Error',
        message: err instanceof Error ? err.message : 'Failed to upload image',
        color: 'red',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleUploadCancel = () => {
    setUploadDialogOpen(false);
    setSelectedFile(null);
    setCustomId('');
    setIdError(null);
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleting(id);
      await imageClient.delete(id);
      const imgs = await imageClient.list();
      setImages(imgs);
      notifications.show({
        title: 'Success',
        message: 'VM image deleted successfully',
        color: 'green',
      });
    } catch (err) {
      notifications.show({
        title: 'Delete Error',
        message: err instanceof Error ? err.message : 'Failed to delete image',
        color: 'red',
      });
    } finally {
      setDeleting(null);
    }
  };

  // Loading state
  if (loading && images.length === 0) {
    return (
      <Stack align="center" py="xl">
        <Loader size="lg" />
        <Text c="dimmed">Loading VM images...</Text>
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      {/* Upload Dialog */}
      <Modal
        opened={uploadDialogOpen}
        onClose={handleUploadCancel}
        title="Upload VM Image"
        centered
      >
        <Stack gap="md">
          {selectedFile && (
            <Card withBorder p="md">
              <Group>
                <ThemeIcon color="blue" size={32} radius="md" variant="light">
                  <IconPhoto size={16} />
                </ThemeIcon>
                <Stack gap={2} style={{ flex: 1 }}>
                  <Text fw={500} size="sm" truncate="end">
                    {selectedFile.name}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {formatFileSize(selectedFile.size)}
                  </Text>
                </Stack>
              </Group>
            </Card>
          )}

          <TextInput
            label="Image ID"
            placeholder="Enter a unique identifier for this image"
            value={customId}
            onChange={(e) => {
              setCustomId(e.currentTarget.value);
              setIdError(null);
            }}
            error={idError}
            required
          />

          <Group justify="flex-end">
            <Button
              variant="light"
              onClick={handleUploadCancel}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button onClick={handleUploadConfirm} loading={uploading}>
              Upload
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Group justify="space-between" align="center">
        <div>
          <Text size="lg" fw={600}>
            VM Images
          </Text>
          <Text size="sm" c="dimmed">
            {images.length} image{images.length !== 1 ? 's' : ''} available
          </Text>
        </div>

        {images.length > 0 && (
          <UploadButton onFileSelect={handleFileSelect} loading={uploading} />
        )}
      </Group>

      {/* Content */}
      {images.length === 0 && !loading ? (
        <Card withBorder radius="md" p="xl">
          <Stack align="center" gap="md">
            <ThemeIcon size={60} radius="xl" color="gray" variant="light">
              <IconPhoto size={30} />
            </ThemeIcon>
            <Stack align="center" gap="xs">
              <Text fw={500} size="lg">
                No VM images uploaded
              </Text>
              <Text c="dimmed" ta="center" size="sm">
                Upload your first VM image to get started.
              </Text>
            </Stack>
            <UploadButton
              onFileSelect={handleFileSelect}
              loading={uploading}
              variant="light"
            />
          </Stack>
        </Card>
      ) : (
        <div style={{ position: 'relative' }}>
          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>Size</Table.Th>
                <Table.Th>Uploaded</Table.Th>
                <Table.Th style={{ width: 100 }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {images.map((img) => {
                const isDeleting = deleting === img.id;
                return (
                  <Table.Tr
                    key={img.id}
                    style={isDeleting ? { opacity: 0.6 } : {}}
                  >
                    <Table.Td>
                      <Group gap="xs" align="center">
                        <Text fw={500} size="sm">
                          {img.id}
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {formatFileSize(img.size)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {img.uploadedAt.toLocaleString()}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <ActionIcon
                        color="red"
                        variant="light"
                        onClick={() => handleDelete(img.id)}
                        disabled={isDeleting || uploading}
                        loading={isDeleting}
                        aria-label={`Delete ${img.id}`}
                      >
                        {isDeleting ? (
                          <Loader size={16} />
                        ) : (
                          <IconTrash size={16} />
                        )}
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>

          {/* Subtle loading overlay for refreshes */}
          {loading && images.length > 0 && (
            <Overlay blur={1} opacity={0.1} zIndex={5} center>
              <Loader size={24} />
            </Overlay>
          )}
        </div>
      )}
    </Stack>
  );
}
