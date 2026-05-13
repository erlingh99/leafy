import { useQuery } from "@tanstack/react-query";
import { fetchWithTimeout } from "./fetchWithTimeout";
import { Sensor } from "@/models/sensor";

async function fetchSensors(): Promise<Sensor[]> {
  const res = await fetchWithTimeout("/api/sensors");
  if (!res.ok) throw new Error("Failed to fetch sensors");
  return res.json();
}

export function useSensors() {
  const { data: sensors = [] } = useQuery<Sensor[]>({
    queryKey: ["sensors"],
    queryFn: fetchSensors,
    refetchInterval: 30_000,
  });

  const activeSensors = sensors.filter((s) => s.is_active);

  return { sensors, activeSensors };
}
