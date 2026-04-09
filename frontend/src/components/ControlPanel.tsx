interface ControlPanelProps {
  sourceId: number | null;
  destinationId: number | null;
  nodeIds: number[];
  range: number;
  mobilityEnabled: boolean;
  linkFailureEnabled: boolean;
  isAnimating: boolean;
  onSourceChange: (value: number | null) => void;
  onDestinationChange: (value: number | null) => void;
  onRangeChange: (value: number) => void;
  onFindRoute: () => void;
  onToggleMobility: () => void;
  onToggleLinkFailure: () => void;
  onReset: () => void;
}

export default function ControlPanel({
  sourceId,
  destinationId,
  nodeIds,
  range,
  mobilityEnabled,
  linkFailureEnabled,
  isAnimating,
  onSourceChange,
  onDestinationChange,
  onRangeChange,
  onFindRoute,
  onToggleMobility,
  onToggleLinkFailure,
  onReset,
}: ControlPanelProps) {
  return (
    <section className="panel control-panel">
      <h2>Controls</h2>

      <div className="grid-two">
        <label>
          Source Node
          <select
            value={sourceId ?? ''}
            onChange={(event) => {
              const value = event.target.value;
              onSourceChange(value === '' ? null : Number(value));
            }}
          >
            <option value="">Select</option>
            {nodeIds.map((id) => (
              <option key={`src-${id}`} value={id}>
                Node {id}
              </option>
            ))}
          </select>
        </label>

        <label>
          Destination Node
          <select
            value={destinationId ?? ''}
            onChange={(event) => {
              const value = event.target.value;
              onDestinationChange(value === '' ? null : Number(value));
            }}
          >
            <option value="">Select</option>
            {nodeIds.map((id) => (
              <option key={`dst-${id}`} value={id}>
                Node {id}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label>
        Transmission Range: <strong>{range}px</strong>
        <input
          type="range"
          min={60}
          max={220}
          step={10}
          value={range}
          onChange={(event) => onRangeChange(Number(event.target.value))}
        />
      </label>

      <div className="button-row">
        <button onClick={onFindRoute} disabled={isAnimating || nodeIds.length < 2}>
          Find Route & Send Packet
        </button>
        <button className="secondary" onClick={onToggleMobility}>
          {mobilityEnabled ? 'Stop Mobility' : 'Start Mobility'}
        </button>
        <button className="secondary" onClick={onToggleLinkFailure}>
          {linkFailureEnabled ? 'Disable Link Failure' : 'Enable Link Failure'}
        </button>
        <button className="danger" onClick={onReset}>
          Reset Simulation
        </button>
      </div>
    </section>
  );
}
