type BoardStage = {
  id: string;
  order_index: number;
  title: string;
  status: "not_started" | "in_progress" | "completed";
};

const ROW_HEIGHT = 110;
const PADDING_TOP = 50;
const PADDING_BOTTOM = 60;
const NODE_RADIUS = 26;
const LEFT_X = 70;
const RIGHT_X = 250;
const VIEW_WIDTH = 320;

function nodeX(index: number): number {
  return index % 2 === 0 ? LEFT_X : RIGHT_X;
}
function nodeY(index: number): number {
  return PADDING_TOP + index * ROW_HEIGHT;
}

function currentStageIndex(stages: BoardStage[]): number {
  const idx = stages.findIndex((s) => s.status !== "completed");
  return idx === -1 ? stages.length - 1 : idx;
}

export function PathBoard({
  stages,
  avatarEmoji,
}: {
  stages: BoardStage[];
  avatarEmoji: string;
}) {
  const sorted = [...stages].sort((a, b) => a.order_index - b.order_index);
  const height = PADDING_TOP + (sorted.length - 1) * ROW_HEIGHT + PADDING_BOTTOM;
  const currentIdx = currentStageIndex(sorted);
  const avatarX = nodeX(currentIdx);
  const avatarY = nodeY(currentIdx);

  return (
    <div className="relative mx-auto" style={{ width: "100%", maxWidth: VIEW_WIDTH }}>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${height}`}
        width="100%"
        height={height}
        role="img"
        aria-label="Your learning path progress, shown as a game board"
      >
        {sorted.slice(0, -1).map((stage, i) => {
          const x1 = nodeX(i);
          const y1 = nodeY(i);
          const x2 = nodeX(i + 1);
          const y2 = nodeY(i + 1);
          const midY = (y1 + y2) / 2;
          const completed = stage.status === "completed";
          return (
            <path
              key={stage.id}
              d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
              fill="none"
              stroke={completed ? "#10b981" : "#334155"}
              strokeWidth={6}
              strokeLinecap="round"
              strokeDasharray={completed ? undefined : "4 8"}
            />
          );
        })}

        {sorted.map((stage, i) => {
          const x = nodeX(i);
          const y = nodeY(i);
          const isCompleted = stage.status === "completed";
          const isInProgress = stage.status === "in_progress";
          const fill = isCompleted ? "#10b981" : isInProgress ? "#f59e0b" : "#1e293b";
          const stroke = isCompleted ? "#34d399" : isInProgress ? "#fbbf24" : "#475569";
          const textColor = isCompleted || isInProgress ? "#ffffff" : "#cbd5e1";

          return (
            <a key={stage.id} href={`#stage-${stage.id}`}>
              <circle cx={x} cy={y} r={NODE_RADIUS} fill={fill} stroke={stroke} strokeWidth={3} />
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={isCompleted ? 20 : 15}
                fontWeight={700}
                fill={textColor}
              >
                {isCompleted ? "\u2713" : i + 1}
              </text>
              <text
                x={x}
                y={y + NODE_RADIUS + 16}
                textAnchor="middle"
                fontSize={11}
                fontWeight={600}
                fill="#f8fafc"
              >
                {stage.title.length > 22 ? `${stage.title.slice(0, 20)}\u2026` : stage.title}
              </text>
            </a>
          );
        })}

        <text x={nodeX(sorted.length - 1)} y={PADDING_TOP - 26} textAnchor="middle" fontSize={22}>
          {sorted.length > 0 && currentIdx === sorted.length - 1 && sorted[sorted.length - 1].status === "completed"
            ? "\u{1F3C6}"
            : ""}
        </text>
      </svg>

      <div
        className="pointer-events-none absolute animate-bounce text-3xl drop-shadow-md transition-[left,top] duration-700 ease-in-out"
        style={{
          left: `${(avatarX / VIEW_WIDTH) * 100}%`,
          top: `${avatarY - NODE_RADIUS - 34}px`,
          transform: "translateX(-50%)",
        }}
      >
        {avatarEmoji}
      </div>
    </div>
  );
}
