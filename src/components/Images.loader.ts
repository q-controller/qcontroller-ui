import { imageClient, VMImage } from '@/common/image-client';

export async function loader(): Promise<VMImage[]> {
  return imageClient.list();
}
