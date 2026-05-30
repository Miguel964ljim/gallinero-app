// HTML/CSS bar chart — avoids SVG preserveAspectRatio distortion.
// Each column is flex-1 so bars share width equally regardless of count.
// Layout per column: [number 20px] [bar area flex-1, grows from bottom] [label 22px]

const NUM_H   = 20;
const LABEL_H = 22;

export default function BarChart({ data, height = 200 }) {
  if (!data?.length) return null;

  const barAreaH = height - NUM_H - LABEL_H;
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex gap-1.5 w-full" style={{ height }}>
      {data.map((d, i) => {
        const barPx  = d.value > 0 ? Math.max((d.value / max) * barAreaH, 5) : 0;
        const isToday = d.isToday;

        return (
          <div
            key={i}
            className="flex-1 flex flex-col"
            style={{ minWidth: 0, maxWidth: 52 }}
          >
            {/* Number above bar */}
            <div
              className="flex items-end justify-center pb-0.5"
              style={{ height: NUM_H, flexShrink: 0 }}
            >
              {d.value > 0 && (
                <span
                  className="font-bold leading-none"
                  style={{
                    fontSize: 11,
                    color: isToday ? '#ea580c' : '#78716c',
                  }}
                >
                  {d.value}
                </span>
              )}
            </div>

            {/* Bar — pinned to the bottom of this flexible area */}
            <div className="flex-1 flex items-end">
              <div
                className="w-full"
                style={{
                  height:          barPx || 2,
                  backgroundColor: barPx > 0
                    ? (isToday ? '#f97316' : '#fed7aa')
                    : '#f1f0ef',
                  borderRadius:    '5px 5px 2px 2px',
                  transition:      'height 0.3s ease',
                }}
              />
            </div>

            {/* Day label */}
            <div
              className="flex items-center justify-center"
              style={{ height: LABEL_H, flexShrink: 0 }}
            >
              <span
                className="leading-none select-none"
                style={{
                  fontSize:   10,
                  color:      isToday ? '#f97316' : '#a8a29e',
                  fontWeight: isToday ? 700 : 400,
                }}
              >
                {d.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
