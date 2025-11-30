import { Configuration, ImageServiceApi } from '@/generated/image-client/src';

export class VMImage {
  id: string;
  size: number;
  uploadedAt: Date;

  constructor(id: string, size: number, uploadedAt: Date) {
    this.id = id;
    this.size = size;
    this.uploadedAt = uploadedAt;
  }
}

export interface UploadRequest {
  file: Blob;
  id: string;
}

const imageApi = new ImageServiceApi(
  new Configuration({
    basePath: '',
  })
);

export const imageClient = {
  async upload({ file, id }: UploadRequest): Promise<void> {
    await imageApi.v1ImagesPost({
      file: file,
      id: id,
    });
  },

  async list(): Promise<VMImage[]> {
    const response = await imageApi.v1ImagesGet();

    const images: VMImage[] =
      response.images?.map(
        (image) => new VMImage(image.imageId, image.size, image.uploadedAt)
      ) || [];

    return images.sort(
      (a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()
    );
  },

  async delete(id: string): Promise<void> {
    await imageApi.v1ImagesImageIdDelete({ imageId: id });
  },
};
