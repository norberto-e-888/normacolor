export function StatCard({
  title,
  value,
  trend,
}: {
  title: string;
  value: string | number;
  trend?: number;
}) {
  // Helper to check if trend indicates a "from zero" increase
  const isFromZero = (trendValue: number, currentValue: string) => {
    // Convert current value string (e.g. "$76.50") to number (76.5)
    const numericValue = parseFloat(currentValue.replace(/[^0-9.-]+/g, ""));
    // Check if trend/10000 (converting from percentage and cents) equals current value
    return Math.abs(trendValue / 10000 - numericValue) < 0.1; // Using small epsilon for float comparison
  };

  return (
    <div className="bg-card p-6 rounded-lg shadow-sm">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <div className="mt-2 flex items-baseline">
        <p className="text-2xl font-semibold">{value}</p>
        {trend !== undefined &&
          typeof value === "string" &&
          !isFromZero(trend, value) && (
            <span
              className={`ml-2 text-sm font-medium ${
                trend > 0
                  ? "text-green-600"
                  : trend < 0
                  ? "text-red-600"
                  : "text-muted-foreground"
              }`}
            >
              {trend > 0 ? "+" : ""}
              {trend.toFixed(1)}%
            </span>
          )}
      </div>
    </div>
  );
}
