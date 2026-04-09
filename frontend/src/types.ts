export interface NodePoint {
  id: number;
  x: number;
  y: number;
}

export interface Edge {
  from: number;
  to: number;
}

export interface RouteResponse {
  path: number[];
  hopCount: number;
  latencyMs: number;
  logs: string[];
}
