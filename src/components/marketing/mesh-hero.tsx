const NODES = [
  { x: 260, y: 60, r: 14 },
  { x: 90, y: 130, r: 10 },
  { x: 420, y: 120, r: 11 },
  { x: 60, y: 260, r: 8 },
  { x: 180, y: 300, r: 9 },
  { x: 340, y: 290, r: 12 },
  { x: 450, y: 250, r: 7 },
  { x: 260, y: 200, r: 6 },
];

const EDGES: [number, number][] = [
  [0, 1],
  [0, 2],
  [0, 7],
  [1, 3],
  [1, 7],
  [2, 6],
  [2, 7],
  [3, 4],
  [4, 7],
  [4, 5],
  [5, 6],
  [5, 7],
];

export function MeshHero() {
  return (
    <div className="relative">
      <svg
        viewBox="0 0 500 360"
        className="w-full"
        role="img"
        aria-label="Stake distributed across a mesh of independent validators"
      >
        {EDGES.map(([a, b], i) => (
          <line
            key={i}
            x1={NODES[a].x}
            y1={NODES[a].y}
            x2={NODES[b].x}
            y2={NODES[b].y}
            stroke="var(--sm-border-strong)"
            strokeWidth={1}
          />
        ))}
        {NODES.map((n, i) => (
          <circle
            key={i}
            cx={n.x}
            cy={n.y}
            r={n.r}
            fill={i === 0 ? "var(--sm-accent)" : "var(--sm-node)"}
            fillOpacity={i === 0 ? 1 : 0.85}
          />
        ))}
      </svg>
      <p className="mt-3 text-center text-xs text-sm-text-faint">
        Stake spread across independent validators, ASNs, and datacenters
      </p>
    </div>
  );
}
