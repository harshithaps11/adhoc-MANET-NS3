import { useMemo } from 'react';
import type { Edge, NodePoint } from '../types';

interface PacketState {
  from: number;
  to: number;
  progress: number;
}

interface NetworkCanvasProps {
  nodes: NodePoint[];
  edges: Edge[];
  range: number;
  sourceId: number | null;
  destinationId: number | null;
  routePath: number[];
  packet: PacketState | null;
  onCanvasClick: (x: number, y: number) => void;
  onStartDrag: (nodeId: number) => void;
  onDrag: (x: number, y: number) => void;
  onEndDrag: () => void;
}

const WIDTH = 900;
const HEIGHT = 540;

function routeEdgeKey(a: number, b: number) {
  return [Math.min(a, b), Math.max(a, b)].join('-');
}

export default function NetworkCanvas({
  nodes,
  edges,
  range,
  sourceId,
  destinationId,
  routePath,
  packet,
  onCanvasClick,
  onStartDrag,
  onDrag,
  onEndDrag,
}: NetworkCanvasProps) {
  const nodeMap = useMemo(() => {
    const map = new Map<number, NodePoint>();
    nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [nodes]);

  const highlightedEdges = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < routePath.length - 1; i += 1) {
      set.add(routeEdgeKey(routePath[i], routePath[i + 1]));
    }
    return set;
  }, [routePath]);

  const packetPoint = useMemo(() => {
    if (!packet) {
      return null;
    }

    const from = nodeMap.get(packet.from);
    const to = nodeMap.get(packet.to);
    if (!from || !to) {
      return null;
    }

    const x = from.x + (to.x - from.x) * packet.progress;
    const y = from.y + (to.y - from.y) * packet.progress;
    return { x, y };
  }, [nodeMap, packet]);

  return (
    <div className="canvas-wrap">
      <svg
        className="network-canvas"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        onClick={(event) => {
          const target = event.target as SVGElement;
          if (target.closest('.node-group')) {
            return;
          }

          const svg = event.currentTarget;
          const rect = svg.getBoundingClientRect();
          const x = ((event.clientX - rect.left) / rect.width) * WIDTH;
          const y = ((event.clientY - rect.top) / rect.height) * HEIGHT;
          onCanvasClick(x, y);
        }}
        onMouseMove={(event) => {
          const svg = event.currentTarget;
          const rect = svg.getBoundingClientRect();
          const x = ((event.clientX - rect.left) / rect.width) * WIDTH;
          const y = ((event.clientY - rect.top) / rect.height) * HEIGHT;
          onDrag(x, y);
        }}
        onMouseUp={onEndDrag}
        onMouseLeave={onEndDrag}
      >
        <defs>
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(20, 64, 96, 0.08)" strokeWidth="1" />
          </pattern>
        </defs>

        <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill="url(#grid)" />

        {nodes.map((node) => (
          <circle
            key={`range-${node.id}`}
            cx={node.x}
            cy={node.y}
            r={range}
            fill="rgba(15, 102, 97, 0.08)"
            stroke="rgba(15, 102, 97, 0.24)"
            strokeWidth="1"
          />
        ))}

        {edges.map((edge) => {
          const from = nodeMap.get(edge.from);
          const to = nodeMap.get(edge.to);
          if (!from || !to) {
            return null;
          }

          const isRoute = highlightedEdges.has(routeEdgeKey(edge.from, edge.to));
          return (
            <line
              key={`${edge.from}-${edge.to}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              className={isRoute ? 'edge route-edge' : 'edge'}
            />
          );
        })}

        {nodes.map((node) => {
          const isSource = node.id === sourceId;
          const isDestination = node.id === destinationId;
          const inRoute = routePath.includes(node.id);

          return (
            <g
              key={node.id}
              className="node-group"
              onMouseDown={(event) => {
                event.stopPropagation();
                onStartDrag(node.id);
              }}
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={16}
                className={[
                  'node',
                  isSource ? 'source-node' : '',
                  isDestination ? 'destination-node' : '',
                  inRoute ? 'route-node' : '',
                ].join(' ')}
              />
              <text x={node.x} y={node.y + 4} textAnchor="middle" className="node-label">
                {node.id}
              </text>
            </g>
          );
        })}

        {packetPoint && <circle cx={packetPoint.x} cy={packetPoint.y} r={7} className="packet" />}
      </svg>
      <p className="canvas-hint">Click empty area to add node. Drag nodes to move and update links.</p>
    </div>
  );
}
