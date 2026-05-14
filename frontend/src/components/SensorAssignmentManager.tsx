import React, { useState } from "react";
import { Loader2, Cpu } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plant } from "@/models/plant";
import { Translations } from "@/translations/types";
import { useSensors } from "@/hooks/useSensors";
import { useSensorAssignments } from "@/hooks/useSensorAssignments";

interface SensorAssignmentManagerProps {
  plants: Plant[];
  t: Translations;
}

export const SensorAssignmentManager: React.FC<SensorAssignmentManagerProps> = ({
  plants,
  t,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { sensors, activeSensors } = useSensors(isOpen);
  const { assignments, addAssignment: onAdd, deleteAssignment: onDelete } = useSensorAssignments(isOpen);
  const [selectedPlantId, setSelectedPlantId] = useState("");
  const [selectedSensorId, setSelectedSensorId] = useState("");
  const [customSensorId, setCustomSensorId] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const availableSensors = activeSensors.filter(
    (s) => !assignments.some((a) => a.sensor_id === s.sensor_id)
  );

  const effectiveSensorId = availableSensors.length > 0 ? selectedSensorId : customSensorId;

  const handleAdd = async () => {
    const sensorId = effectiveSensorId.trim();
    if (!selectedPlantId || !sensorId) return;
    setIsAdding(true);
    try {
      await onAdd(selectedPlantId, sensorId);
      setSelectedPlantId("");
      setSelectedSensorId("");
      setCustomSensorId("");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    await onDelete(id);
  };

  const selectClass =
    "flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-sm transition-colors " +
    "focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Cpu className="h-4 w-4 mr-2" />
        {t.sensorAssignmentButton}
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.sensorAssignmentTitle}</DialogTitle>
            <DialogDescription>{t.sensorAssignmentDescription}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">{t.noSensorAssignments}</p>
            ) : (
              assignments.map((a) => (
                <div key={a.id} className="flex justify-between items-center border p-2 rounded gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{a.plant_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.sensor_id}</p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-shrink-0"
                    onClick={() => handleDelete(a.id)}
                  >
                    {t.sensorAssignmentDelete}
                  </Button>
                </div>
              ))
            )}
          </div>

          <div className="space-y-2 pt-2 border-t">
            <select
              className={selectClass}
              value={selectedPlantId}
              onChange={(e) => setSelectedPlantId(e.target.value)}
              aria-label={t.selectPlant}
            >
              <option value="">{t.selectPlant}</option>
              {plants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {availableSensors.length > 0 ? (
              <select
                className={selectClass}
                value={selectedSensorId}
                onChange={(e) => setSelectedSensorId(e.target.value)}
                aria-label={t.selectSensor}
              >
                <option value="">{t.selectSensor}</option>
                {availableSensors.map((s) => (
                  <option key={s.sensor_id} value={s.sensor_id}>
                    {s.sensor_id}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                placeholder={t.sensorIdLabel}
                value={customSensorId}
                onChange={(e) => setCustomSensorId(e.target.value)}
                aria-label={t.sensorIdLabel}
              />
            )}

            {availableSensors.length === 0 && sensors.length === 0 && (
              <p className="text-xs text-muted-foreground">{t.noActiveSensors}</p>
            )}

            <Button
              className="w-full"
              onClick={handleAdd}
              disabled={isAdding || !selectedPlantId || !effectiveSensorId.trim()}
            >
              {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t.sensorAssignmentAdd}
            </Button>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t.sensorAssignmentClose}</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
