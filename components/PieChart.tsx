type Segment = { label: string; value: number; colorClass: string };

export function PieChart({
  segments,
  size = 120,
  strokeWidth = 18,
  centerLabel,
}: {
  segments: Segment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-slate-800"
            strokeWidth={strokeWidth}
          />
        </svg>
      </div>
    );
  }

  let cumulative = 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        {segments
          .filter((s) => s.value > 0)
          .map((segment, i) => {
            const fraction = segment.value / total;
            const dashLength = fraction * circumference;
            const dashArray = `${dashLength} ${circumference - dashLength}`;
            const dashOffset = -cumulative * circumference;
            cumulative += fraction;
            return (
              <circle
                key={i}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="currentColor"
                className={segment.colorClass}
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                strokeLinecap="butt"
              />
            );
          })}
      </svg>
      {centerLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-white">{centerLabel}</span>
        </div>
      )}
    </div>
  );
}

export function PieChartLegend({ segments }: { segments: Segment[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-medium text-slate-300">
      {segments.map((s, i) => (
        <li key={i} className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${s.colorClass.replace("text-", "bg-")}`} />
          {s.label} ({s.value})
        </li>
      ))}
    </ul>
  );
}
