import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithTimeout } from "./fetchWithTimeout";
import { SensorAssignment } from "@/models/sensor";

async function fetchAssignments(): Promise<SensorAssignment[]> {
  const res = await fetchWithTimeout("/api/sensor-assignments");
  if (!res.ok) throw new Error("Failed to fetch sensor assignments");
  return res.json();
}

export function useSensorAssignments(enabled = false) {
  const queryClient = useQueryClient();

  const { data: assignments = [] } = useQuery<SensorAssignment[]>({
    queryKey: ["sensor-assignments"],
    queryFn: fetchAssignments,
    enabled,
  });

  const addMutation = useMutation({
    mutationFn: async ({ plant_id, sensor_id }: { plant_id: string; sensor_id: string }) => {
      const res = await fetchWithTimeout("/api/sensor-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plant_id, sensor_id }),
      });
      if (!res.ok) throw new Error("Failed to create assignment");
      return res.json() as Promise<SensorAssignment>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sensor-assignments"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithTimeout(`/api/sensor-assignments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete assignment");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sensor-assignments"] }),
  });

  const addAssignment = async (plant_id: string, sensor_id: string) => {
    await addMutation.mutateAsync({ plant_id, sensor_id });
  };

  const deleteAssignment = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  return { assignments, addAssignment, deleteAssignment };
}
