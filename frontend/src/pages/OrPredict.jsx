import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const getWeekInMonth = (date, weeksPerMonth = 4) => {
  const day = date.getDate();
  const week = Math.floor((day - 1) / 7) + 1;
  return Math.min(weeksPerMonth, Math.max(1, week));
};

const buildWeekInMonthLabels = ({
  currentDate,
  count,
  weeksPerMonth = 4,
}) => {
  const startDate = currentDate instanceof Date ? currentDate : new Date(currentDate);
  const startWeekInMonth = getWeekInMonth(startDate, weeksPerMonth);

  return Array.from({ length: count }, (_, i) => {
    const weekIndexFromStart = (startWeekInMonth - 1) + i;
    const monthOffset = Math.floor(weekIndexFromStart / weeksPerMonth);
    const weekInMonth = (weekIndexFromStart % weeksPerMonth) + 1;

    const monthDate = new Date(startDate.getFullYear(), startDate.getMonth() + monthOffset, 1);
    const month = String(monthDate.getMonth() + 1).padStart(2, "0");
    const year = monthDate.getFullYear();

    return `Tuần ${weekInMonth} (${month}/${year})`;
  });
};

const normalizeSeries = (values, count) => {
  const series = Array.isArray(values) ? values : [];
  const normalized = series.slice(0, count).map((v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  });

  while (normalized.length < count) normalized.push(0);
  return normalized;
};

const LineChart = ({ title, labels, values }) => {
  const width = 1300;
  const height = 560;
  const margin = { top: 20, right: 20, bottom: 120, left: 56 };

  const maxY = 100;
  const minY = 0;

  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  const safeLabels = Array.isArray(labels) ? labels : [];
  const count = safeLabels.length;
  const series = normalizeSeries(values, count);

  const xAt = (index) => {
    if (count <= 1) return margin.left;
    return margin.left + (index * plotWidth) / (count - 1);
  };

  const yAt = (value) => {
    const clamped = Math.max(minY, Math.min(maxY, value));
    const ratio = (clamped - minY) / (maxY - minY);
    return margin.top + (1 - ratio) * plotHeight;
  };

  const polylinePoints = series
    .map((v, i) => `${xAt(i).toFixed(2)},${yAt(v).toFixed(2)}`)
    .join(" ");

  const yTicks = [0, 50, 100];
  const xTickIndexes = safeLabels.map((_, i) => i);

  return (
    <div className="w-full">
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="min-w-[1100px] w-full h-[520px] text-foreground"
          role="img"
          aria-label={title}
        >
          {/* Axes */}
          <line
            x1={margin.left}
            y1={margin.top}
            x2={margin.left}
            y2={height - margin.bottom}
            className="stroke-border"
            strokeWidth="1"
          />
          <line
            x1={margin.left}
            y1={height - margin.bottom}
            x2={width - margin.right}
            y2={height - margin.bottom}
            className="stroke-border"
            strokeWidth="1"
          />

          {/* Y ticks */}
          {yTicks.map((t) => (
            <g key={t}>
              <line
                x1={margin.left}
                y1={yAt(t)}
                x2={width - margin.right}
                y2={yAt(t)}
                className="stroke-border/60"
                strokeWidth="1"
              />
              <text
                x={margin.left - 10}
                y={yAt(t) + 4}
                textAnchor="end"
                className="fill-muted-foreground"
                fontSize="12"
              >
                {t}%
              </text>
            </g>
          ))}

          {/* X ticks */}
          {xTickIndexes.map((i) => (
            <g key={i}>
              <line
                x1={xAt(i)}
                y1={height - margin.bottom}
                x2={xAt(i)}
                y2={height - margin.bottom + 6}
                className="stroke-border"
                strokeWidth="1"
              />
              <text
                x={xAt(i)}
                y={height - margin.bottom + 18}
                textAnchor="end"
                className="fill-muted-foreground"
                fontSize="12"
                transform={`rotate(-45 ${xAt(i)} ${height - margin.bottom + 18})`}
              >
                {safeLabels[i]}
              </text>
            </g>
          ))}

          {/* Axis labels */}
          <text
            x={(margin.left + (width - margin.right)) / 2}
            y={height - 12}
            textAnchor="middle"
            className="fill-muted-foreground"
            fontSize="12"
          >
            Tuần (Tháng/Năm)
          </text>
          <text
            x={16}
            y={(margin.top + (height - margin.bottom)) / 2}
            textAnchor="middle"
            className="fill-muted-foreground"
            fontSize="12"
            transform={`rotate(-90 16 ${(margin.top + (height - margin.bottom)) / 2})`}
          >
            Tỉ lệ lấp đầy OR (%)
          </text>

          {/* Line */}
          <polyline
            points={polylinePoints}
            fill="none"
            stroke="currentColor"
            className="text-chart-1"
            strokeWidth="2"
          />

          {/* Points */}
          {series.map((v, i) => (
            <g key={safeLabels[i] ?? i}>
              <circle
                cx={xAt(i)}
                cy={yAt(v)}
                r="3"
                className="fill-chart-1"
              />
              <text
                x={xAt(i)}
                y={yAt(v) - 8}
                textAnchor="middle"
                className="fill-muted-foreground"
                fontSize="10"
              >
                {v}%
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};

export default function OrPredict() {
  const labels = buildWeekInMonthLabels({
    currentDate: new Date(),
    count: 28,
    weeksPerMonth: 4,
  });

  const values = Array.from({ length: 28 }, (_, i) => i + 1);

  return (
    <div className="p-4 md:p-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-center">
            Tỉ lệ lấp đầy phòng (dự đoán)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart
            title="Tỉ lệ lấp đầy phòng (dự đoán)"
            labels={labels}
            values={values}
          />
        </CardContent>
      </Card>
    </div>
  );
}
