import {
  Configuration,
  ControllerServiceApi,
  type ServicesV1CreateRequest,
  type ServicesV1Info,
} from '@/generated/controller-client/src';

const controllerApi = new ControllerServiceApi(
  new Configuration({
    basePath: '',
  })
);

export const controllerClient = {
  async list(): Promise<Array<ServicesV1Info>> {
    const response = await controllerApi.controllerServiceInfo({
      name: '',
    });
    if (response.info) {
      return response.info;
    }

    return [];
  },

  async get(name: string): Promise<ServicesV1Info | null> {
    const response = await controllerApi.controllerServiceInfo({
      name: name,
    });
    if (response.info && response.info.length > 0) {
      return response.info[0];
    }
    return null;
  },

  async start(name: string): Promise<void> {
    await controllerApi.controllerServiceStart({
      name: name,
      servicesV1StartRequest: {
        name: name,
      },
    });
  },

  async stop(name: string): Promise<void> {
    await controllerApi.controllerServiceStop({
      name: name,
      servicesV1StopRequest: {
        name: name,
        force: false,
      },
    });
  },

  async delete(name: string): Promise<void> {
    await controllerApi.controllerServiceRemove({
      name: name,
    });
  },

  async create(req: ServicesV1CreateRequest): Promise<void> {
    await controllerApi.controllerServiceCreate({
      servicesV1CreateRequest: req,
    });
  },
};

export type { SettingsV1VM } from '@/generated/controller-client/src';
export type { ServicesV1Info } from '@/generated/controller-client/src';
export type { ServicesV1CreateRequest } from '@/generated/controller-client/src/models/ServicesV1CreateRequest';
