import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlantHistory } from "@/hooks/usePlantHistory";
import { Translations } from "@/translations/types";

interface PlantHistoryChartProps {
  plantId: string;
  t: Translations;
}

const DAY_OPTIONS = [7, 30, 90] as const;

const parseUtc = (s: string) => new Date(s.endsWith("Z") ? s : s + "Z");

export const PlantHistoryChart = ({ plantId, t }: PlantHistoryChartProps) => {
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const { moistureReadings, wateringEvents, isLoading } = usePlantHistory(plantId, days, true);
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    if (!isLoading) return;
    const timer = setTimeout(() => setShowSkeleton(true), 300);
    return () => {
      clearTimeout(timer);
      setShowSkeleton(false);
    };
  }, [isLoading]);

  const dayLabels: Record<number, string> = {
    7: t.days7,
    30: t.days30,
    90: t.days90,
  };

  const formatDate = (iso: string) => {
    const d = parseUtc(iso);
    return d.toLocaleDateString(t.locale, { month: "short", day: "numeric" });
  };

  const hasMoisture = moistureReadings.length > 0;
  const hasWatering = wateringEvents.length > 0;
  const hasData = hasMoisture || hasWatering;

  const moistureData = moistureReadings.map((r) => ({
    ...r,
    ts: parseUtc(r.recorded_at).getTime(),
  }));

  return (
    <div className="space-y-3">
      {/* Day range toggle */}
      <div className="flex gap-1">
        {DAY_OPTIONS.map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              days === d
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {dayLabels[d]}
          </button>
        ))}
      </div>

      {showSkeleton ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : isLoading ? null :!hasData ? (
        <p className="text-sm text-muted-foreground py-4 text-center">{t.noHistoryData}</p>
      ) : hasMoisture ? (
        /* Moisture line chart with watering event reference lines */
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">{t.moistureHistory}</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={moistureData} margin={{ top: 20, right: 8, bottom: 4, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="ts"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(ms) => new Date(ms).toLocaleDateString(t.locale, { month: "short", day: "numeric" })}
                tick={{ fontSize: 10 }}
                className="fill-muted-foreground"
                minTickGap={32}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10 }}
                className="fill-muted-foreground"
                tickCount={5}
              />
              <Tooltip
                labelFormatter={(ms) => new Date(Number(ms)).toLocaleString(t.locale, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                formatter={(value) => [`${Math.round(Number(value))}%`, t.moisture]}
                contentStyle={{
                  fontSize: 12,
                  backgroundColor: "hsl(var(--popover))",
                  borderColor: "hsl(var(--border))",
                  color: "hsl(var(--popover-foreground))",
                }}
              />
              {wateringEvents.map((ev) => (
                <ReferenceLine
                  key={ev.id}
                  x={parseUtc(ev.watered_at).getTime()}
                  stroke="#60a5fa"
                  strokeDasharray="4 2"
                  label={{ value: "💧", position: "top", fontSize: 10 }}
                />
              ))}
              <Line
                type="monotone"
                dataKey="level"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
          {hasWatering && (
            <p className="text-xs text-muted-foreground mt-1">
              💧 = {t.wateringHistory}
            </p>
          )}
        </div>
      ) : (
        /* Watering-only timeline (no moisture data) */
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">{t.wateringHistory}</p>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {wateringEvents.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full"
              >
                <span>💧</span>
                <span>{formatDate(ev.watered_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
