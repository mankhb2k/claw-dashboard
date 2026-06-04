jest.mock('../gateway/gateway-rpc.service', () => ({
  GatewayRpcService: class GatewayRpcService {},
}));

import { GatewayRpcService } from '../gateway/gateway-rpc.service';
import { NodesService } from './nodes.service';

describe('NodesService', () => {
  const userId = 'user_1';
  const projectId = 'proj_1';

  let gateway: jest.Mocked<Pick<GatewayRpcService, 'call'>>;
  let service: NodesService;

  beforeEach(() => {
    gateway = { call: jest.fn() };
    service = new NodesService(gateway as unknown as GatewayRpcService);
  });

  it('lists nodes via node.list', async () => {
    gateway.call.mockResolvedValue({
      ts: 1,
      nodes: [{ nodeId: 'n1', connected: true }],
    });

    const result = await service.list(userId, projectId);

    expect(gateway.call).toHaveBeenCalledWith(userId, projectId, 'node.list', {});
    expect(result.nodes).toHaveLength(1);
  });

  it('loads pairing via device.pair.list and node.pair.list', async () => {
    gateway.call
      .mockResolvedValueOnce({
        pending: [{ requestId: 'd1', deviceId: 'dev1', role: 'node' }],
        paired: [{ deviceId: 'dev1', tokens: { node: { token: 'secret', role: 'node' } } }],
      })
      .mockResolvedValueOnce({
        pending: [{ requestId: 'n1', nodeId: 'node-1', requiredApproveScopes: ['operator.pairing'] }],
        paired: [{ nodeId: 'node-1', token: 'node-secret' }],
      });

    const result = await service.getPairing(userId, projectId);

    expect(gateway.call).toHaveBeenNthCalledWith(
      1,
      userId,
      projectId,
      'device.pair.list',
      {},
    );
    expect(gateway.call).toHaveBeenNthCalledWith(2, userId, projectId, 'node.pair.list', {});
    expect(result.devices.pending).toHaveLength(1);
    expect(result.nodes.pending[0].requiredApproveScopes).toEqual(['operator.pairing']);
    expect((result.nodes.paired[0] as Record<string, unknown>).token).toBeUndefined();
    const tokens = (result.devices.paired[0] as Record<string, unknown>).tokens as Record<
      string,
      Record<string, unknown>
    >;
    expect(tokens.node.token).toBeUndefined();
  });

  it('approves device and node pairing with correct RPC methods', async () => {
    gateway.call.mockResolvedValueOnce({ status: 'approved', requestId: 'd1' });
    gateway.call.mockResolvedValueOnce({ requestId: 'n1', node: { nodeId: 'node-1', token: 'x' } });

    await service.approveDevicePairing(userId, projectId, 'd1');
    await service.approveNodePairing(userId, projectId, 'n1');

    expect(gateway.call).toHaveBeenCalledWith(userId, projectId, 'device.pair.approve', {
      requestId: 'd1',
    });
    expect(gateway.call).toHaveBeenCalledWith(userId, projectId, 'node.pair.approve', {
      requestId: 'n1',
    });
  });

  it('removes companion from device and node pairing stores', async () => {
    gateway.call
      .mockResolvedValueOnce({ deviceId: 'node-1' })
      .mockResolvedValueOnce({ nodeId: 'node-1' });
    gateway.call.mockResolvedValueOnce({ nodeId: 'node-1', displayName: 'Phone' });

    await service.removeNode(userId, projectId, 'node-1');
    await service.renameNode(userId, projectId, 'node-1', '  Phone  ');

    expect(gateway.call).toHaveBeenNthCalledWith(1, userId, projectId, 'device.pair.remove', {
      deviceId: 'node-1',
    });
    expect(gateway.call).toHaveBeenNthCalledWith(2, userId, projectId, 'node.pair.remove', {
      nodeId: 'node-1',
    });
    expect(gateway.call).toHaveBeenCalledWith(userId, projectId, 'node.rename', {
      nodeId: 'node-1',
      displayName: 'Phone',
    });
  });

  it('remove succeeds when only device pairing exists', async () => {
    gateway.call
      .mockResolvedValueOnce({ deviceId: 'dev-hex' })
      .mockRejectedValueOnce(new Error('unknown nodeId'));

    await expect(service.removeNode(userId, projectId, 'dev-hex')).resolves.toEqual({
      ok: true,
    });
  });

  it('remove throws when neither pairing store has the id', async () => {
    gateway.call
      .mockRejectedValueOnce(new Error('unknown deviceId'))
      .mockRejectedValueOnce(new Error('unknown nodeId'));

    await expect(service.removeNode(userId, projectId, 'missing')).rejects.toThrow(
      'unknown nodeId',
    );
  });

  it('propagates gateway RPC failures from GatewayRpcService', async () => {
    gateway.call.mockRejectedValue(new Error('gateway down'));

    await expect(service.list(userId, projectId)).rejects.toThrow('gateway down');
  });
});
