import { useState, useEffect, useRef } from "react";
import {
  Droplet, Calendar, Info, ChevronDown, ChevronUp, HelpCircle, BarChart2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SpeciesInfoPanel } from "./SpeciesInfoPanel";
import { PlantCardActions } from "./PlantCardActions";
import { PlantHistoryChart } from "./PlantHistoryChart";
import { Plant } from "@/models/plant";
import { Species } from "@/models/species";
import { Translations } from "@/translations/types";

interface PlantCardProps {
  plant: Plant;
  isOverdue: boolean;
  daysUntil: number;
  onWater: (id: string) => void;
  onEdit: (plant: Plant) => void;
  onDelete: (id: string) => void;
  fetchSpecies: (perenualId: number) => Promise<Species | null>;
  t: Translations;
}

const parseUtc = (utcStr: string) =>
  new Date(utcStr.endsWith('Z') ? utcStr : utcStr + 'Z');

export const PlantCard = ({ plant, isOverdue, daysUntil, onWater, onEdit, onDelete, fetchSpecies, t }: PlantCardProps) => {
  const [isSpeciesOpen, setIsSpeciesOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [moistureTooltipOpen, setMoistureTooltipOpen] = useState(false);
  const isTouchRef = useRef(false);
  const [speciesData, setSpeciesData] = useState<Species | null>(null);
  const [isLoadingSpecies, setIsLoadingSpecies] = useState(false);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!isSpeciesOpen || hasFetchedRef.current || !plant.perenual_species_id) return;

    hasFetchedRef.current = true;
    setIsLoadingSpecies(true);
    let cancelled = false;

    fetchSpecies(plant.perenual_species_id).then((data) => {
      if (cancelled) return;
      setSpeciesData(data);
      setIsLoadingSpecies(false);
    }).catch(() => {
      if (cancelled) return;
      setIsLoadingSpecies(false);
    });

    return () => { cancelled = true; };
  }, [isSpeciesOpen, plant.perenual_species_id, fetchSpecies]);

  // Reset fetch gate when the collapsible is closed
  useEffect(() => {
    if (!isSpeciesOpen) {
      hasFetchedRef.current = false;
    }
  }, [isSpeciesOpen]);

  const [now] = useState(Date.now);
  const isMoistureRecent = plant.moisture_updated_at
    ? now - parseUtc(plant.moisture_updated_at).getTime() < 24 * 60 * 60 * 1000
    : false;

  return (
    <Card
      className={`transition-all hover:shadow-lg ${isOverdue ? "border-warning" : "border-border"
        }`}
    >
      <div className="p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-shrink-0">
            {plant.thumbnail_url ? (
              <img
                src={plant.thumbnail_url}
                alt={plant.name}
                className="w-24 h-32 object-cover rounded-full"
                style={{ borderRadius: "60% / 60%" }}
              />
            ) : (
              <div className="w-24 h-32 bg-secondary flex items-center justify-center rounded-full" style={{ borderRadius: "60% / 60%" }}>
                <span className="text-4xl">🌱</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-4">
              <div className="min-w-0">
                <h3 className="text-xl font-semibold text-foreground truncate">{plant.name}</h3>
                <p className="text-sm text-muted-foreground italic truncate">{plant.species_username ?? plant.species}</p>
              </div>
              {isOverdue && (
                <div className="bg-warning/20 text-warning px-2 py-1 rounded-md text-xs font-medium flex-shrink-0 ml-2">
                  {t.overdue}!
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Droplet className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">
                  {t.water} {plant.watering_interval} {plant.watering_interval === 1 ? t.day : t.days}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">
                  {t.watered}: {new Date(plant.last_watered).toLocaleDateString(t.locale)}
                </span>
              </div>
              {plant.moisture_level !== null && plant.moisture_level !== undefined &&
                isMoistureRecent && (
                  <div className="flex items-start gap-2 text-sm flex-wrap">
                    <Droplet className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground flex-shrink-0">{t.moisture}:</span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${plant.moisture_level >= 60
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : plant.moisture_level >= 30
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}
                      >
                        {Math.round(plant.moisture_level)}%
                      </span>
                      <Tooltip delayDuration={0} open={moistureTooltipOpen} onOpenChange={(open) => {
                        if (!isTouchRef.current) setMoistureTooltipOpen(open);
                      }}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="-m-1 p-1 rounded flex-shrink-0 touch-manipulation"
                            aria-label={t.moistureGuideAriaLabel}
                            onPointerDown={(e) => { isTouchRef.current = e.pointerType === 'touch'; }}
                            onClick={() => {
                              setMoistureTooltipOpen(v => !v);
                              setTimeout(() => { isTouchRef.current = false; }, 0);
                            }}
                          >
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[200px] text-xs leading-relaxed">
                          <p className="font-semibold mb-1">{t.moistureGuideTitle}</p>
                          <p><span className="text-green-400">●</span> {t.moistureGuideMoist}</p>
                          <p><span className="text-amber-400">●</span> {t.moistureGuideGettingDry}</p>
                          <p><span className="text-red-400">●</span> {t.moistureGuideDry}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    {plant.moisture_updated_at && (
                      <span className="text-xs text-muted-foreground">
                        {parseUtc(plant.moisture_updated_at).toLocaleString(t.locale)}
                      </span>
                    )}
                  </div>
                )}
              <div className="text-sm font-medium">
                {(() => {
                  const absFloat = Math.abs(daysUntil);
                  const roundedDays = Math.round(absFloat);
                  const timeLabel = roundedDays === 0
                    ? (() => { const h = Math.round(absFloat * 24); return `${h} ${h === 1 ? t.hour : t.hours}`; })()
                    : `${roundedDays} ${roundedDays === 1 ? t.day : t.days}`;
                  return isOverdue
                    ? <span className="text-warning">{t.overdue} {timeLabel}</span>
                    : <span className="text-success">{t.nextWatering} {timeLabel}</span>;
                })()}
              </div>
            </div>
          </div>
        </div>

        {plant.perenual_species_id && (
          <Collapsible open={isSpeciesOpen} onOpenChange={(open) => setIsSpeciesOpen(open)}>
            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                className="w-full mb-2"
                disabled={isLoadingSpecies}
              >
                <Info className="h-4 w-4 mr-2" />
                {isLoadingSpecies
                  ? (t.loadingSpecies || "Loading...")
                  : isSpeciesOpen
                    ? (t.hideSpeciesInfo || "Hide Species Information")
                    : (t.showSpeciesInfo || "Show Species Information")}
                {isSpeciesOpen ? (
                  <ChevronUp className="h-4 w-4 ml-2" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-2" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-4 mb-4 p-4 bg-secondary/50 rounded-lg border">
                {speciesData ? (
                  <SpeciesInfoPanel speciesData={speciesData} t={t} />
                ) : !isLoadingSpecies ? (
                  <div className="text-sm text-muted-foreground">
                    {t.speciesInfoNotAvailable || "Species information not available"}
                  </div>
                ) : null}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full mb-2">
              <BarChart2 className="h-4 w-4 mr-2" />
              {isHistoryOpen ? t.hideHistory : t.showHistory}
              {isHistoryOpen ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 mb-4 p-4 bg-secondary/50 rounded-lg border">
              <PlantHistoryChart plantId={plant.id} t={t} />
            </div>
          </CollapsibleContent>
        </Collapsible>

        <PlantCardActions
          plant={plant}
          isOverdue={isOverdue}
          onWater={onWater}
          onEdit={onEdit}
          onDelete={onDelete}
          t={t}
        />
      </div>
    </Card>
  );
};
