export function parseRpc(text, id) {
  try { return JSON.parse(text); } catch {}
  for (const event of text.split(/\r?\n\r?\n/)) {
    const data = event.split(/\r?\n/).filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
    if (!data || data === '[DONE]') continue;
    try { const reply = JSON.parse(data); if (reply.id === id) return reply; } catch {}
  }
  throw new Error('MCP returned no matching JSON-RPC response');
}

export class McpClient {
  constructor(url, fetcher = fetch, log = async () => {}) {
    this.url = url; this.fetcher = fetcher; this.log = log; this.id = 0;
  }
  async rpc(method, params = {}, notification = false) {
    const request = { jsonrpc: '2.0', ...(notification ? {} : { id: ++this.id }), method, params };
    await this.log({ direction: 'mcp-request', body: request });
    const response = await this.fetcher(this.url, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(120000),
      headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream',
        ...(this.session ? { 'Mcp-Session-Id': this.session } : {}),
        ...(this.version ? { 'MCP-Protocol-Version': this.version } : {}) },
      body: JSON.stringify(request)
    });
    if (response.headers.get('mcp-session-id')) this.session = response.headers.get('mcp-session-id');
    const raw = await response.text();
    await this.log({ direction: 'mcp-response', status: response.status, body: raw });
    if (!response.ok) throw new Error(`MCP HTTP ${response.status}`);
    if (notification) return;
    const reply = parseRpc(raw, request.id);
    if (reply.error) throw new Error(`MCP error ${reply.error.code}; see encrypted transcript`);
    return reply.result;
  }
  async initialize() {
    const result = await this.rpc('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'mega-s02e04-github-worker', version: '1.0.0' } });
    this.version = result.protocolVersion;
    await this.rpc('notifications/initialized', {}, true);
  }
}

export function findReceipt(value) {
  if (typeof value === 'string') { try { return findReceipt(JSON.parse(value)); } catch { return null; } }
  if (!value || typeof value !== 'object') return null;
  if (typeof value.receipt === 'string' && value.receipt) return value.receipt;
  for (const child of Object.values(value)) { const found = findReceipt(child); if (found) return found; }
  return null;
}
