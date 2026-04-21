import { useState, useEffect, useRef } from "react";
import {
  Droplet, Calendar, Info, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SpeciesInfoPanel } from "./SpeciesInfoPanel";
import { PlantCardActions } from "./PlantCardActions";
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

export const PlantCard = ({ plant, isOverdue, daysUntil, onWater, onEdit, onDelete, fetchSpecies, t }: PlantCardProps) => {
  const [isSpeciesOpen, setIsSpeciesOpen] = useState(false);
  const [speciesData, setSpeciesData] = useState<Species | null>(null);
  const [isLoadingSpecies, setIsLoadingSpecies] = useState(false);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (isSpeciesOpen && !speciesData && !isLoadingSpecies && !hasFetchedRef.current && plant.perenual_species_id) {
      hasFetchedRef.current = true;
      setIsLoadingSpecies(true);
      let cancelled = false;
      fetchSpecies(plant.perenual_species_id).then((data) => {
        if (!cancelled) {
          setSpeciesData(data);
          setIsLoadingSpecies(false);
        }
      }).catch(() => {
        if (!cancelled) setIsLoadingSpecies(false);
      });
      return () => { cancelled = true; };
    }
  }, [isSpeciesOpen, speciesData, isLoadingSpecies, plant.perenual_species_id, fetchSpecies]);

  // Reset fetch gate when the collapsible is closed
  useEffect(() => {
    if (!isSpeciesOpen) {
      hasFetchedRef.current = false;
    }
  }, [isSpeciesOpen]);


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
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-foreground">{plant.name}</h3>
                <p className="text-sm text-muted-foreground italic">{plant.species_username ?? plant.species}</p>
              </div>
              {isOverdue && (
                <div className="bg-warning/20 text-warning px-2 py-1 rounded-md text-xs font-medium">
                  {t.overdue}!
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Droplet className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">
                  {t.water} {plant.watering_interval} {plant.watering_interval === 1 ? t.day : t.days}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">
                  {t.watered}: {new Date(plant.last_watered).toLocaleDateString(t.locale)}
                </span>
              </div>
              <div className="text-sm font-medium">
                {isOverdue ? (
                  <span className="text-warning">{t.overdue} {Math.abs(daysUntil)} {Math.abs(daysUntil) === 1 ? t.day : t.days}</span>
                ) : (
                  <span className="text-success">{t.nextWatering} {daysUntil} {daysUntil === 1 ? t.day : t.days}</span>
                )}
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
                ) : (
                  <div className="text-sm text-muted-foreground">
                    {t.speciesInfoNotAvailable || "Species information not available"}
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

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
