import {
  Configuration,
  OrchestratorServiceApi,
  type ServicesOrchestratorV1CreateRequest,
  type ServicesOrchestratorV1Info,
  type ServicesProcessV1Snapshot,
  type SettingsV1Node,
} from '@/generated/controller-client/src';
import { authMiddleware, csrfHeaderMiddleware } from '@/common/auth-middleware';

const api = new OrchestratorServiceApi(
  new Configuration({
    basePath: '',
    middleware: [csrfHeaderMiddleware, authMiddleware],
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

  async snapshotList(
    node: string,
    name: string
  ): Promise<Array<ServicesProcessV1Snapshot>> {
    const response = await api.orchestratorServiceSnapshotList({ node, name });
    return response.snapshots || [];
  },

  async snapshotSave(node: string, name: string, tag: string): Promise<void> {
    await api.orchestratorServiceSnapshotSave({
      node,
      name,
      servicesOrchestratorV1SnapshotSaveRequest: { tag },
    });
  },

  async snapshotLoad(node: string, name: string, tag: string): Promise<void> {
    await api.orchestratorServiceSnapshotLoad({
      node,
      name,
      tag,
      servicesOrchestratorV1SnapshotLoadRequest: {},
    });
  },

  async snapshotDelete(node: string, name: string, tag: string): Promise<void> {
    await api.orchestratorServiceSnapshotDelete({ node, name, tag });
  },
};

export type { SettingsV1VM } from '@/generated/controller-client/src';
export type { ServicesOrchestratorV1Info as ServicesV1Info } from '@/generated/controller-client/src';
export type { ServicesOrchestratorV1CreateRequest as ServicesV1CreateRequest } from '@/generated/controller-client/src';
export type { SettingsV1Node } from '@/generated/controller-client/src';
export type { ServicesProcessV1Snapshot } from '@/generated/controller-client/src';
