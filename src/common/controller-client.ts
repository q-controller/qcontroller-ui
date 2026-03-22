import {
  Configuration,
  OrchestratorServiceApi,
  type ServicesOrchestratorV1CreateRequest,
  type ServicesOrchestratorV1Info,
  type SettingsV1Node,
} from '@/generated/controller-client/src';

const api = new OrchestratorServiceApi(
  new Configuration({
    basePath: '',
  })
);

export const controllerClient = {
  async list(node: string): Promise<Array<ServicesOrchestratorV1Info>> {
    const response = await api.orchestratorServiceInfo({
      node,
      name: '',
    });
    return response.info || [];
  },

  async get(
    node: string,
    name: string
  ): Promise<ServicesOrchestratorV1Info | null> {
    const response = await api.orchestratorServiceInfo({
      node,
      name,
    });
    if (response.info && response.info.length > 0) {
      return response.info[0];
    }
    return null;
  },

  async start(node: string, name: string): Promise<void> {
    await api.orchestratorServiceStart({
      node,
      name,
      servicesOrchestratorV1StartRequest: {},
    });
  },

  async stop(
    node: string,
    name: string,
    force: boolean = false
  ): Promise<void> {
    await api.orchestratorServiceStop({
      node,
      name,
      servicesOrchestratorV1StopRequest: {
        force,
      },
    });
  },

  async delete(node: string, name: string): Promise<void> {
    await api.orchestratorServiceRemove({
      node,
      name,
    });
  },

  async create(
    req: ServicesOrchestratorV1CreateRequest,
    signal?: AbortSignal
  ): Promise<void> {
    const overrides = signal ? { signal } : undefined;
    await api.orchestratorServiceCreate(
      {
        node: req.node || '',
        servicesOrchestratorV1CreateRequest: req,
      },
      overrides
    );
  },

  async listNodes(): Promise<Array<SettingsV1Node>> {
    const response = await api.orchestratorServiceListNodes();
    return response.nodes || [];
  },
};

export type { SettingsV1VM } from '@/generated/controller-client/src';
export type { ServicesOrchestratorV1Info as ServicesV1Info } from '@/generated/controller-client/src';
export type { ServicesOrchestratorV1CreateRequest as ServicesV1CreateRequest } from '@/generated/controller-client/src';
export type { SettingsV1Node } from '@/generated/controller-client/src';
