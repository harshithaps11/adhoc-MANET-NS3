interface InfoPanelProps {
  logs: string[];
  hopCount: number;
  latencyMs: number;
  routePath: number[];
}

export default function InfoPanel({ logs, hopCount, latencyMs, routePath }: InfoPanelProps) {
  return (
    <section className="panel info-panel">
      <h2>Routing Info</h2>

      <div className="stats">
        <div>
          <span>Route</span>
          <strong>{routePath.length > 0 ? routePath.join(' -> ') : 'No route yet'}</strong>
        </div>
        <div>
          <span>Hops</span>
          <strong>{hopCount}</strong>
        </div>
        <div>
          <span>Latency (estimated)</span>
          <strong>{latencyMs} ms</strong>
        </div>
      </div>

      <h3>Protocol Log (Simplified AODV)</h3>
      <div className="log-box">
        {logs.length === 0 && <p>No events yet. Add nodes and start routing.</p>}
        {logs.map((log, index) => (
          <p key={`${index}-${log}`}>{log}</p>
        ))}
      </div>

      <h3>Legend</h3>
      <div className="legend">
        <span><i className="dot normal"></i> Regular Node</span>
        <span><i className="dot source"></i> Source Node</span>
        <span><i className="dot destination"></i> Destination Node</span>
        <span><i className="dot route"></i> Route Node</span>
        <span><i className="dot packet"></i> Packet</span>
      </div>
    </section>
  );
}
