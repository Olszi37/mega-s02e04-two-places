import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRpc, McpClient, findReceipt } from './mcp.mjs';

test('SSE parser skips notifications and selects the matching RPC response', () => {
  const stream = 'event: message\ndata: {"jsonrpc":"2.0","method":"notifications/message"}\n\nevent: message\ndata: {"jsonrpc":"2.0","id":7,"result":{"ok":true}}\n\n';
  assert.deepEqual(parseRpc(stream, 7).result, { ok: true });
  assert.throws(() => parseRpc(stream, 8));
});
test('client initializes, negotiates protocol, and propagates session headers', async () => {
  const requests = [];
  const fetcher = async (url, options) => {
    const body = JSON.parse(options.body); requests.push({ body, options });
    if (body.method === 'initialize') return new Response(JSON.stringify({ id: body.id, result: { protocolVersion: '2025-03-26' } }), { headers: { 'mcp-session-id': 'test-session' } });
    if (body.method === 'notifications/initialized') return new Response(null, { status: 202 });
    return new Response(`event: message\ndata: ${JSON.stringify({ id: body.id, result: { tools: [] } })}\n\n`);
  };
  const client = new McpClient('https://example.test/mcp', fetcher);
  await client.initialize();
  assert.deepEqual(await client.rpc('tools/list'), { tools: [] });
  assert.equal(requests[2].options.headers['Mcp-Session-Id'], 'test-session');
  assert.equal(requests[2].options.headers['MCP-Protocol-Version'], '2025-03-26');
  assert.equal(requests[1].body.id, undefined);
});
test('receipt finder preserves a proof nested in MCP text content', () => {
  assert.equal(findReceipt({ content: [{ type: 'text', text: JSON.stringify({ receipt: 'exact-proof', result: 'record' }) }] }), 'exact-proof');
  assert.equal(findReceipt({ content: [{ text: 'No accepted receipt' }] }), null);
});
