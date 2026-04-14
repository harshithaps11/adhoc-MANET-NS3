import { useEffect, useMemo, useState } from 'react';
import NetworkCanvas from './components/NetworkCanvas';
import ControlPanel from './components/ControlPanel';
import InfoPanel from './components/InfoPanel';
import type { Edge, NodePoint, RouteResponse } from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://manet-backend.onrender.com';
const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 540;

interface PacketState {
  from: number;
  to: number;
  progress: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function safeReadText(response: Response) {
  try {
    return await response.text();
  } catch {
    return '';
  }
}

function computeEdges(nodes: NodePoint[], range: number, linkFailureEnabled: boolean): Edge[] {
  const generated: Edge[] = [];

  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = nodes[i];
      const b = nodes[j];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (distance > range) {
        continue;
      }

      // When link failure is enabled we randomly drop some otherwise valid links.
      if (linkFailureEnabled && Math.random() < 0.2) {
        continue;
      }

      generated.push({ from: a.id, to: b.id });
    }
  }

  return generated;
}

export default function App() {
  const [nodes, setNodes] = useState<NodePoint[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [range, setRange] = useState(140);
  const [sourceId, setSourceId] = useState<number | null>(null);
  const [destinationId, setDestinationId] = useState<number | null>(null);
  const [routePath, setRoutePath] = useState<number[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [hopCount, setHopCount] = useState(0);
  const [latencyMs, setLatencyMs] = useState(0);
  const [nextNodeId, setNextNodeId] = useState(1);
  const [draggingNodeId, setDraggingNodeId] = useState<number | null>(null);
  const [packet, setPacket] = useState<PacketState | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [mobilityEnabled, setMobilityEnabled] = useState(false);
  const [linkFailureEnabled, setLinkFailureEnabled] = useState(false);

  const nodeIds = useMemo(() => nodes.map((n) => n.id), [nodes]);

  function addLog(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev].slice(0, 80));
  }

  async function syncEdgesToBackend(nextEdges: Edge[]) {
    try {
      await fetch(`${API_BASE}/connect-nodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ edges: nextEdges, replace: true }),
      });
    } catch {
      addLog('Backend not reachable while syncing edges. Start backend server first.');
    }
  }

  useEffect(() => {
    const nextEdges = computeEdges(nodes, range, linkFailureEnabled);
    setEdges(nextEdges);
    syncEdgesToBackend(nextEdges);
  }, [nodes, range, linkFailureEnabled]);

  useEffect(() => {
    if (!mobilityEnabled || isAnimating || nodes.length === 0) {
      return;
    }

    const interval = window.setInterval(() => {
      setNodes((prev) =>
        prev.map((node) => ({
          ...node,
          x: clamp(node.x + (Math.random() * 48 - 24), 28, CANVAS_WIDTH - 28),
          y: clamp(node.y + (Math.random() * 48 - 24), 28, CANVAS_HEIGHT - 28),
        })),
      );
    }, 900);

    return () => window.clearInterval(interval);
  }, [mobilityEnabled, isAnimating, nodes.length]);

  useEffect(() => {
    if (sourceId !== null && !nodeIds.includes(sourceId)) {
      setSourceId(null);
    }
    if (destinationId !== null && !nodeIds.includes(destinationId)) {
      setDestinationId(null);
    }
  }, [sourceId, destinationId, nodeIds]);

  async function handleAddNode(x: number, y: number) {
    const id = nextNodeId;
    const newNode: NodePoint = {
      id,
      x: clamp(x, 28, CANVAS_WIDTH - 28),
      y: clamp(y, 28, CANVAS_HEIGHT - 28),
    };

    // Register with backend FIRST before updating local state
    try {
      await fetch(`${API_BASE}/add-node`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch {
      addLog('Backend not reachable for node registration.');
      return; // Don't add node locally if backend failed
    }

    // Now update local state (triggers edge sync)
    setNodes((prev) => [...prev, newNode]);
    setNextNodeId((prev) => prev + 1);
    if (sourceId === null) {
      setSourceId(id);
    } else if (destinationId === null) {
      setDestinationId(id);
    }
    addLog(`Node ${id} joined the network.`);
  }

  function handleDrag(x: number, y: number) {
    if (draggingNodeId === null) {
      return;
    }

    setNodes((prev) =>
      prev.map((node) =>
        node.id === draggingNodeId
          ? {
              ...node,
              x: clamp(x, 28, CANVAS_WIDTH - 28),
              y: clamp(y, 28, CANVAS_HEIGHT - 28),
            }
          : node,
      ),
    );
  }

  async function animatePath(path: number[]) {
    setIsAnimating(true);
    for (let i = 0; i < path.length - 1; i += 1) {
      const from = path[i];
      const to = path[i + 1];
      for (let step = 0; step <= 25; step += 1) {
        setPacket({ from, to, progress: step / 25 });
        await sleep(32);
      }
      await sleep(120);
    }
    setPacket(null);
    setIsAnimating(false);
    addLog('Packet reached destination node.');
  }

  async function handleFindRoute() {
    if (sourceId === null || destinationId === null) {
      addLog('Select both source and destination nodes first.');
      return;
    }
    if (sourceId === destinationId) {
      addLog('Source and destination should be different nodes.');
      return;
    }

    try {
      let response: Response | null = null;

      // Render free instances can wake up slowly; retry once before failing.
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          response = await fetch(`${API_BASE}/find-route`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sourceId, destinationId }),
          });
          if (response.ok) {
            break;
          }
        } catch {
          // Continue to retry path below.
        }

        if (attempt === 0) {
          addLog('Backend waking up... retrying route request.');
          await sleep(1200);
        }
      }

      if (!response) {
        throw new Error('No response from backend');
      }

      if (!response.ok) {
        const text = await safeReadText(response);
        throw new Error(`HTTP ${response.status}${text ? `: ${text.slice(0, 80)}` : ''}`);
      }

      let data: RouteResponse;
      try {
        data = (await response.json()) as RouteResponse;
      } catch {
        const text = await safeReadText(response);
        throw new Error(`Invalid JSON response${text ? `: ${text.slice(0, 80)}` : ''}`);
      }

      setRoutePath(data.path);
      setHopCount(data.hopCount);
      setLatencyMs(data.latencyMs);
      setLogs((prev) => [...data.logs.map((line) => `[PROTO] ${line}`), ...prev].slice(0, 80));

      if (data.path.length === 0) {
        addLog('No route discovered for selected nodes.');
        return;
      }

      addLog(`Route discovered: ${data.path.join(' -> ')}. Sending packet...`);
      await animatePath(data.path);
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown error';
      addLog(`Backend routing request failed (${reason}).`);
    }
  }

  async function handleReset() {
    setNodes([]);
    setEdges([]);
    setSourceId(null);
    setDestinationId(null);
    setRoutePath([]);
    setLogs([]);
    setHopCount(0);
    setLatencyMs(0);
    setPacket(null);
    setIsAnimating(false);
    setMobilityEnabled(false);
    setLinkFailureEnabled(false);
    setNextNodeId(1);

    try {
      await fetch(`${API_BASE}/reset`, { method: 'POST' });
    } catch {
      // No-op. UI reset is still enough for demo use.
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>Adhoc Wireless Network Simulator (MANET)</h1>
          <p>Visualize node connectivity, BFS routing, and packet transfer in a mobile ad hoc network.</p>
        </div>
      </header>

      <section className="workspace-grid">
        <NetworkCanvas
          nodes={nodes}
          edges={edges}
          range={range}
          sourceId={sourceId}
          destinationId={destinationId}
          routePath={routePath}
          packet={packet}
          onCanvasClick={handleAddNode}
          onStartDrag={setDraggingNodeId}
          onDrag={handleDrag}
          onEndDrag={() => setDraggingNodeId(null)}
        />

        <div className="right-panels">
          <ControlPanel
            sourceId={sourceId}
            destinationId={destinationId}
            nodeIds={nodeIds}
            range={range}
            mobilityEnabled={mobilityEnabled}
            linkFailureEnabled={linkFailureEnabled}
            isAnimating={isAnimating}
            onSourceChange={setSourceId}
            onDestinationChange={setDestinationId}
            onRangeChange={setRange}
            onFindRoute={handleFindRoute}
            onToggleMobility={() => setMobilityEnabled((prev) => !prev)}
            onToggleLinkFailure={() => setLinkFailureEnabled((prev) => !prev)}
            onReset={handleReset}
          />

          <InfoPanel logs={logs} hopCount={hopCount} latencyMs={latencyMs} routePath={routePath} />
        </div>
      </section>
    </main>
  );
}
