import React from 'react';

/*
  Decorative hero graphic. Blips are labelled with role types only (no invented people or
  metrics). Each blip's animation delay is derived from its angle so it lights up as the
  sweep passes over it (one rotation = SWEEP_SECONDS).
*/
const SWEEP_SECONDS = 6;
const C = 180; // centre of the 360x360 viewBox

const BLIPS: { angle: number; r: number; label: string; strong?: boolean }[] = [
  { angle: 38, r: 118, label: 'Co-founder', strong: true },
  { angle: 96, r: 70, label: 'Staff engineer' },
  { angle: 152, r: 132, label: 'Head of product' },
  { angle: 212, r: 92, label: 'Founder', strong: true },
  { angle: 268, r: 140, label: 'Operations lead' },
  { angle: 322, r: 60, label: 'Researcher' },
];

function polar(angleDeg: number, r: number) {
  // angle measured clockwise from 12 o'clock
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: C + r * Math.cos(a), y: C + r * Math.sin(a) };
}

export const RadarGraphic: React.FC = () => {
  const lead = polar(0, 165);
  const tail = polar(-55, 165);

  return (
    <svg viewBox="0 0 360 360" className="h-full w-full" role="img" aria-label="Radar sweeping across professional roles">
      <defs>
        <linearGradient id="sweep-fill" gradientUnits="userSpaceOnUse" x1={tail.x} y1={tail.y} x2={lead.x} y2={lead.y}>
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.28" />
        </linearGradient>
        <radialGradient id="radar-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--accent-soft)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--accent-soft)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx={C} cy={C} r="170" fill="url(#radar-bg)" />
      {[42, 84, 126, 168].map((r) => (
        <circle key={r} cx={C} cy={C} r={r} fill="none" stroke="var(--line-strong)" strokeWidth="1" />
      ))}
      <line x1={C} y1="10" x2={C} y2="350" stroke="var(--line)" strokeWidth="1" />
      <line x1="10" y1={C} x2="350" y2={C} stroke="var(--line)" strokeWidth="1" />

      <g className="radar-sweep">
        <path d={`M ${C} ${C} L ${tail.x} ${tail.y} A 165 165 0 0 1 ${lead.x} ${lead.y} Z`} fill="url(#sweep-fill)" />
        <line x1={C} y1={C} x2={lead.x} y2={lead.y} stroke="var(--accent)" strokeWidth="1.5" strokeOpacity="0.7" />
      </g>

      {BLIPS.map((b) => {
        const p = polar(b.angle, b.r);
        const delay = `${((b.angle / 360) * SWEEP_SECONDS).toFixed(2)}s`;
        // Label on the outward side, unless that would run past the edge of the viewBox
        const LABEL_W = 100;
        const right = p.x >= C ? p.x + LABEL_W < 360 : p.x - LABEL_W < 0;
        return (
          <g key={b.label} className="radar-blip" style={{ ['--d' as string]: delay }}>
            <circle cx={p.x} cy={p.y} r={b.strong ? 5 : 4} fill={b.strong ? 'var(--accent)' : 'var(--ink-2)'} />
            <text
              x={right ? p.x + 10 : p.x - 10}
              y={p.y + 4}
              textAnchor={right ? 'start' : 'end'}
              fontSize="11.5"
              fontFamily="var(--font-sans)"
              fill={b.strong ? 'var(--accent)' : 'var(--ink-2)'}
              fontWeight={b.strong ? 600 : 500}
            >
              {b.label}
            </text>
          </g>
        );
      })}

      <circle className="radar-ping" cx={C} cy={C} r="8" fill="none" stroke="var(--accent)" strokeWidth="1.5" />
      <circle cx={C} cy={C} r="4" fill="var(--accent)" />
    </svg>
  );
};
