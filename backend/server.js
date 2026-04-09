const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const graph = {
  nodes: new Set(),
  adjacency: new Map(),
};

function ensureNode(id) {
  if (!graph.nodes.has(id)) {
    graph.nodes.add(id);
    graph.adjacency.set(id, new Set());
  }
}

function addEdge(a, b) {
  ensureNode(a);
  ensureNode(b);
  graph.adjacency.get(a).add(b);
  graph.adjacency.get(b).add(a);
}

function resetEdgesOnly() {
  for (const nodeId of graph.nodes) {
    graph.adjacency.set(nodeId, new Set());
  }
}

function bfsRoute(sourceId, destinationId) {
  const logs = [];

  if (!graph.nodes.has(sourceId) || !graph.nodes.has(destinationId)) {
    logs.push('Either source or destination does not exist in graph.');
    return { path: [], hopCount: 0, latencyMs: 0, logs };
  }

  const queue = [sourceId];
  const visited = new Set([sourceId]);
  const parent = new Map();

  logs.push(`RREQ initiated from Node ${sourceId}`);

  while (queue.length > 0) {
    const current = queue.shift();
    logs.push(`Exploring neighbors of Node ${current}`);

    if (current === destinationId) {
      logs.push(`Destination Node ${destinationId} discovered.`);
      break;
    }

    const neighbors = graph.adjacency.get(current) || new Set();
    for (const neighbor of neighbors) {
      if (visited.has(neighbor)) {
        continue;
      }
      visited.add(neighbor);
      parent.set(neighbor, current);
      queue.push(neighbor);
      logs.push(`RREQ forwarded: Node ${current} -> Node ${neighbor}`);
    }
  }

  if (!visited.has(destinationId)) {
    logs.push('Route discovery failed. No connected path available.');
    return { path: [], hopCount: 0, latencyMs: 0, logs };
  }

  const path = [];
  let walker = destinationId;
  while (walker !== undefined) {
    path.push(walker);
    walker = parent.get(walker);
  }
  path.reverse();

  const hopCount = Math.max(path.length - 1, 0);
  const latencyMs = hopCount * 25;
  logs.push(`RREP sent back through route: ${path.join(' -> ')}`);

  return { path, hopCount, latencyMs, logs };
}

app.post('/add-node', (req, res) => {
  const { id } = req.body;
  if (typeof id !== 'number') {
    return res.status(400).json({ error: 'Node id must be a number.' });
  }

  ensureNode(id);
  return res.json({ success: true, nodeCount: graph.nodes.size });
});

app.post('/connect-nodes', (req, res) => {
  const { from, to, edges, replace } = req.body;

  if (replace === true) {
    resetEdgesOnly();
  }

  if (Array.isArray(edges)) {
    for (const edge of edges) {
      if (typeof edge.from === 'number' && typeof edge.to === 'number') {
        addEdge(edge.from, edge.to);
      }
    }
    return res.json({ success: true });
  }

  if (typeof from === 'number' && typeof to === 'number') {
    addEdge(from, to);
    return res.json({ success: true });
  }

  return res.status(400).json({ error: 'Provide either {from, to} or {edges: []}.' });
});

app.post('/find-route', (req, res) => {
  const { sourceId, destinationId } = req.body;
  if (typeof sourceId !== 'number' || typeof destinationId !== 'number') {
    return res.status(400).json({ error: 'sourceId and destinationId must be numbers.' });
  }

  return res.json(bfsRoute(sourceId, destinationId));
});

app.post('/reset', (_req, res) => {
  graph.nodes = new Set();
  graph.adjacency = new Map();
  return res.json({ success: true });
});

// Debug endpoint to check graph state
app.get('/debug-graph', (_req, res) => {
  const nodesList = Array.from(graph.nodes).sort((a, b) => a - b);
  const edgesList = [];
  for (const [from, neighbors] of graph.adjacency.entries()) {
    for (const to of neighbors) {
      if (from < to) {
        edgesList.push({ from, to });
      }
    }
  }
  return res.json({
    nodes: nodesList,
    edges: edgesList,
    nodeCount: graph.nodes.size,
    edgeCount: edgesList.length,
  });
});

app.listen(PORT, () => {
  console.log(`MANET backend running on http://localhost:${PORT}`);
  console.log(`Debug endpoint: http://localhost:${PORT}/debug-graph`);
});
