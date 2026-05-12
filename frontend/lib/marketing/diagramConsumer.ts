/**
 * diagramConsumer, frontend consumer for the Phanes diagram pipeline
 * (`/api/diagram/{repo_id}` + WebSocket `/api/ws/diagram-events`). Phase 1
 * MVP: fetch artifact, expose typed accessor, optional WS hot-swap.
 *
 * PRD Section 17.3 line 1089 LOCKED: mermaid-py + graphviz + eralchemy
 * renderer pipeline produces JSON the city renderer reads. Consumer here
 * lives in `frontend/lib/marketing/` next to `cityEngine.ts` (Iris ownership)
 * so the city scene can pull diagram-derived building geometry without a
 * cross-package roundtrip.
 *
 * Phanes Wave-Fixing #2 cycle 1 rescue (Bug #11 silent Lock 3 violation).
 */

export interface DiagramNode {
  id: string;
  label: string;
  type: 'file' | 'module' | 'class' | 'function' | 'schema' | 'table' | 'external';
  metadata: Record<string, string | number | boolean>;
}

export interface DiagramEdge {
  src: string;
  dst: string;
  kind: 'import' | 'call' | 'inherit' | 'reference' | 'fk' | 'relation';
  weight: number;
}

export interface DiagramArtifact {
  schema_version: string;
  repo_id: string;
  generated_at_iso: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  /** Base64-encoded SVG bytes per renderer. Keys: architecture, dependency, erd. */
  svg_blobs: Record<string, string>;
  stats: Record<string, number>;
  render_errors: string[];
}

export interface DiagramConsumerOptions {
  /** API base URL. Defaults to '' (same-origin Next.js API proxy). */
  apiBase?: string;
  /** Repo identifier; matches backend registry key. */
  repoId: string;
  /** Optional auth token for WS handshake (query param). */
  token?: string;
  /** Callback fired when artifact arrives (initial + after WS update). */
  onUpdate?: (artifact: DiagramArtifact) => void;
  /** Callback fired on transport error (HTTP or WS). */
  onError?: (err: Error) => void;
}

export interface DiagramConsumer {
  /** Fetch the artifact once. Resolves with the artifact or rejects on error. */
  fetchOnce(): Promise<DiagramArtifact>;
  /** Subscribe to WS hot-swap events. Returns dispose function. */
  subscribe(): () => void;
  /** Convert one of the base64 SVG blobs to a data URL for `<img src=...>`. */
  blobToDataUrl(key: 'architecture' | 'dependency' | 'erd'): string | null;
  /** Latest artifact snapshot (null until first fetch). */
  current(): DiagramArtifact | null;
  /** Dispose all open connections. */
  dispose(): void;
}

/**
 * Create a DiagramConsumer for a repo. Wires fetch + optional WebSocket
 * hot-swap. Frontend caller composes this with cityEngine.ts (Iris) via the
 * `onUpdate` callback to apply node/edge deltas to the running scene.
 *
 * Example:
 *   const consumer = createDiagramConsumer({ repoId: 'demo' });
 *   await consumer.fetchOnce();
 *   const dispose = consumer.subscribe();
 *   // ...later
 *   dispose();
 */
export function createDiagramConsumer(
  options: DiagramConsumerOptions,
): DiagramConsumer {
  const apiBase = options.apiBase ?? '';
  const repoId = options.repoId;
  let latest: DiagramArtifact | null = null;
  let ws: WebSocket | null = null;
  let disposed = false;

  function notifyError(err: Error) {
    if (options.onError) {
      try {
        options.onError(err);
      } catch {
        // ignore handler throws
      }
    }
  }

  async function fetchOnce(): Promise<DiagramArtifact> {
    const url = `${apiBase}/api/diagram/${encodeURIComponent(repoId)}`;
    const resp = await fetch(url, { method: 'GET' });
    if (!resp.ok) {
      const err = new Error(
        `diagram fetch failed status=${resp.status} repo=${repoId}`,
      );
      notifyError(err);
      throw err;
    }
    const data = (await resp.json()) as DiagramArtifact;
    if (!data.schema_version || !data.schema_version.startsWith('v1.')) {
      const err = new Error(
        `diagram schema_version mismatch: ${data.schema_version}`,
      );
      notifyError(err);
      throw err;
    }
    latest = data;
    if (options.onUpdate) {
      try {
        options.onUpdate(data);
      } catch {
        // ignore handler throws
      }
    }
    return data;
  }

  function subscribe(): () => void {
    if (typeof WebSocket === 'undefined') {
      // SSR or non-browser env; subscription is a no-op.
      return () => {};
    }
    if (ws !== null) {
      return () => disposeWs();
    }

    // Build WS URL. Convert http(s) to ws(s).
    let wsBase = apiBase;
    if (!wsBase) {
      // Same-origin: assemble from window.location.
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsBase = `${proto}//${window.location.host}`;
    } else {
      wsBase = wsBase.replace(/^http/, 'ws');
    }
    const tokenParam = options.token
      ? `?token=${encodeURIComponent(options.token)}`
      : '';
    const url = `${wsBase}/api/ws/diagram-events${tokenParam}`;
    try {
      ws = new WebSocket(url);
    } catch (err) {
      notifyError(err instanceof Error ? err : new Error(String(err)));
      ws = null;
      return () => {};
    }

    ws.onmessage = (evt) => {
      if (disposed) return;
      try {
        const payload = JSON.parse(evt.data as string) as {
          kind?: string;
          repo_id?: string;
        };
        if (payload.kind === 'diagram-update' && payload.repo_id === repoId) {
          // Re-fetch fresh artifact on update notification.
          void fetchOnce().catch((err: unknown) =>
            notifyError(err instanceof Error ? err : new Error(String(err))),
          );
        }
      } catch (err) {
        notifyError(err instanceof Error ? err : new Error(String(err)));
      }
    };
    ws.onerror = () => {
      notifyError(new Error(`diagram WS error repo=${repoId}`));
    };
    ws.onclose = () => {
      ws = null;
    };

    return () => disposeWs();
  }

  function disposeWs(): void {
    if (ws !== null) {
      try {
        ws.close();
      } catch {
        // ignore
      }
      ws = null;
    }
  }

  function blobToDataUrl(
    key: 'architecture' | 'dependency' | 'erd',
  ): string | null {
    if (!latest) return null;
    const b64 = latest.svg_blobs[key];
    if (!b64) return null;
    return `data:image/svg+xml;base64,${b64}`;
  }

  function dispose(): void {
    disposed = true;
    disposeWs();
  }

  return {
    fetchOnce,
    subscribe,
    blobToDataUrl,
    current: () => latest,
    dispose,
  };
}

/**
 * cityEngine integration helper. cityEngine.ts (Iris) calls this after the
 * diagram artifact arrives to derive building-geometry hooks (`buildingId =
 * node.id`, `loc = node.metadata.loc`, `module = node.metadata.module`). The
 * marketing landing currently uses a vendored procedural city so this helper
 * is the wire point for the production `/city` scene to opt in.
 */
export function diagramToBuildingGeometry(
  artifact: DiagramArtifact,
): Array<{
  id: string;
  label: string;
  module: string;
  loc: number;
  language: string;
  symbolCount: number;
  incomingEdgeWeight: number;
  outgoingEdgeWeight: number;
}> {
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, number>();
  for (const e of artifact.edges) {
    incoming.set(e.dst, (incoming.get(e.dst) ?? 0) + e.weight);
    outgoing.set(e.src, (outgoing.get(e.src) ?? 0) + e.weight);
  }
  return artifact.nodes.map((n) => ({
    id: n.id,
    label: n.label,
    module: String(n.metadata.module ?? 'root'),
    loc: Number(n.metadata.loc ?? 0),
    language: String(n.metadata.language ?? 'unknown'),
    symbolCount: Number(n.metadata.symbol_count ?? 0),
    incomingEdgeWeight: incoming.get(n.id) ?? 0,
    outgoingEdgeWeight: outgoing.get(n.id) ?? 0,
  }));
}
