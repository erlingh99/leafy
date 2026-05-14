import { useQuery } from "@tanstack/react-query";
import { fetchWithTimeout } from "./fetchWithTimeout";
import { SensorReading, WateringEvent } from "@/models/sensor";

async function fetchMoistureHistory(plantId: string, days: number): Promise<SensorReading[]> {
  const res = await fetchWithTimeout(`/api/plants/${plantId}/moisture-history?days=${days}`);
  if (!res.ok) throw new Error("Failed to fetch moisture history");
  return res.json();
}

async function fetchWateringHistory(plantId: string, days: number): Promise<WateringEvent[]> {
  const res = await fetchWithTimeout(`/api/plants/${plantId}/watering-history?days=${days}`);
  if (!res.ok) throw new Error("Failed to fetch watering history");
  return res.json();
}

export function usePlantHistory(plantId: string, days: number, enabled = false) {
  const moistureQuery = useQuery<SensorReading[]>({
    queryKey: ["moisture-history", plantId, days],
    queryFn: () => fetchMoistureHistory(plantId, days),
    enabled: enabled && !!plantId,
    staleTime: 60_000,
  });

  const wateringQuery = useQuery<WateringEvent[]>({
    queryKey: ["watering-history", plantId, days],
    queryFn: () => fetchWateringHistory(plantId, days),
    enabled: enabled && !!plantId,
    staleTime: 60_000,
  });

  return {
    moistureReadings: moistureQuery.data ?? [],
    wateringEvents: wateringQuery.data ?? [],
    isLoading: moistureQuery.isLoading || wateringQuery.isLoading,
  };
}
