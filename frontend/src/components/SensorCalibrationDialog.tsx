import React, { useEffect, useRef, useState } from "react";
import { Loader2, Wifi, WifiOff } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
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
import { Label } from "@/components/ui/label";
import { Translations } from "@/translations/types";

const DEFAULT_DRY = 65535;
const DEFAULT_WET = 23765;

interface CalibrationReading {
  raw: number;
  moisture: number;
  adc_dry: number;
  adc_wet: number;
}

interface SensorCalibrationDialogProps {
  sensorId: string;
  initialDry: number | null;
  initialWet: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  t: Translations;
}

export const SensorCalibrationDialog: React.FC<SensorCalibrationDialogProps> = ({
  sensorId,
  initialDry,
  initialWet,
  open,
  onOpenChange,
  t,
}) => {
  const queryClient = useQueryClient();
  const [adcDry, setAdcDry] = useState(initialDry ?? DEFAULT_DRY);
  const [adcWet, setAdcWet] = useState(initialWet ?? DEFAULT_WET);
  const [reading, setReading] = useState<CalibrationReading | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!open) return;

    const es = new EventSource(`/api/sensors/${sensorId}/calibrate/stream`);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as CalibrationReading & { error?: string };
        if (data.error) {
          setError(data.error);
          setIsConnected(false);
        } else {
          setReading(data);
          setIsConnected(true);
          setError(null);
        }
      } catch {
        // ignore malformed frames
      }
    };

    es.onerror = () => {
      setIsConnected(false);
      setError(t.sensorUnreachable);
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [open, sensorId, t.sensorUnreachable]);

  const preview =
    reading != null && adcDry !== adcWet
      ? Math.max(0, Math.min(100, ((adcDry - reading.raw) / (adcDry - adcWet)) * 100))
      : null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/sensors/${sensorId}/calibrate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adc_dry: adcDry, adc_wet: adcWet }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.detail ?? "Failed to save calibration");
        return;
      }
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["sensors"] });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t.calibrationTitle}</DialogTitle>
          <DialogDescription>{t.calibrationDescription}</DialogDescription>
        </DialogHeader>

        {/* Live reading */}
        <div className="rounded-md border p-3 space-y-1 bg-muted/40">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-500 flex-shrink-0" />
            ) : (
              <WifiOff className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
            <span className="text-sm font-medium">
              {t.liveReading}
            </span>
            {!isConnected && !error && (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-auto" />
            )}
          </div>
          {isConnected && reading ? (
            <div className="grid grid-cols-2 gap-x-4 text-sm pl-6">
              <span className="text-muted-foreground">{t.moisture}</span>
              <span className="font-mono font-medium">{reading.moisture.toFixed(1)}%</span>
              <span className="text-muted-foreground">{t.rawAdcValue}</span>
              <span className="font-mono">{reading.raw}</span>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground pl-6">
              {error ?? t.connectingToSensor}
            </p>
          )}
        </div>

        {/* Calibration inputs */}
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="adc-dry">{t.dryValue}</Label>
            <div className="flex gap-2">
              <Input
                id="adc-dry"
                type="number"
                value={adcDry}
                onChange={(e) => setAdcDry(Number(e.target.value))}
                className="font-mono"
              />
              <Button
                variant="outline"
                size="sm"
                className="flex-shrink-0"
                disabled={reading == null}
                onClick={() => reading && setAdcDry(reading.raw)}
              >
                {t.useDry}
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="adc-wet">{t.wetValue}</Label>
            <div className="flex gap-2">
              <Input
                id="adc-wet"
                type="number"
                value={adcWet}
                onChange={(e) => setAdcWet(Number(e.target.value))}
                className="font-mono"
              />
              <Button
                variant="outline"
                size="sm"
                className="flex-shrink-0"
                disabled={reading == null}
                onClick={() => reading && setAdcWet(reading.raw)}
              >
                {t.useWet}
              </Button>
            </div>
          </div>

          {preview != null && (
            <p className="text-sm text-muted-foreground">
              {t.previewMoisture}:{" "}
              <span className="font-medium text-foreground">{preview.toFixed(1)}%</span>
            </p>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            onClick={handleSave}
            disabled={isSaving || !isConnected}
            className="w-full sm:w-auto"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t.saveCalibration}
          </Button>
          <DialogClose asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              {t.sensorAssignmentClose}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
