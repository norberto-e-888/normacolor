import { format } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function TimeSeriesChart({
  data,
  title,
  valueFormatter,
}: {
  data: { date: string; value: number }[];
  title: string;
  valueFormatter: (value: number) => string;
}) {
  return (
    <div className="bg-card p-6 rounded-lg shadow-sm">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="hsl(var(--primary))"
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor="hsl(var(--primary))"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tickFormatter={(date) => format(new Date(date), "MMM d")}
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
            minTickGap={30} // Ensures minimum gap between ticks
          />
          <YAxis
            tickFormatter={valueFormatter}
            width={80}
            tick={{ fontSize: 12 }}
          />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const data = payload[0].payload;
              return (
                <div className="bg-background border rounded-lg shadow-lg p-2">
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(data.date), "MMM d, yyyy")}
                  </p>
                  <p className="text-sm font-medium">
                    {valueFormatter(data.value)}
                  </p>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            fillOpacity={1}
            fill="url(#colorValue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
