export default function BarChart({ data, height = 100 }) {
  if (!data?.length) return null;

  const max = Math.max(...data.map((d) => d.value), 1);
  const barWidth = 100 / data.length;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 100 ${height + 20}`}
        className="w-full"
        style={{ height: height + 20 }}
        preserveAspectRatio="none"
      >
        {data.map((d, i) => {
          const barH = (d.value / max) * height;
          const x = i * barWidth + barWidth * 0.15;
          const w = barWidth * 0.7;
          const y = height - barH;
          const isToday = d.isToday;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={w}
                height={barH || 2}
                rx="1.5"
                fill={isToday ? '#f97316' : '#fed7aa'}
              />
              <text
                x={x + w / 2}
                y={height + 12}
                textAnchor="middle"
                fontSize="4.5"
                fill="#78716c"
              >
                {d.label}
              </text>
              {d.value > 0 && (
                <text
                  x={x + w / 2}
                  y={y - 2}
                  textAnchor="middle"
                  fontSize="4"
                  fill={isToday ? '#f97316' : '#a8a29e'}
                >
                  {d.value}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
