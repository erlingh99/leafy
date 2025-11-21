import { useEffect, useState, useCallback } from "react";
import { useToast, delayedToast } from "./useToast";
import { Translations } from "@/lib/translations";

export interface Plant {
  id: string;
  user_id: string;
  name: string;
  species: string;
  watering_interval: number;
  last_watered: string;
  image?: string;
  perenual_species_id?: number | null;
}

// Species interfaces
export interface Dimension {
  type?: string | null;
  min_value?: number | null;
  max_value?: number | null;
  unit?: string | null;
}

export interface Hardiness {
  min?: string | null;
  max?: string | null;
}

export interface WateringGeneralBenchmark {
  value?: string | null;
  unit?: string | null;
}

export interface PlantAnatomyItem {
  part?: string | null;
  color?: string[] | null;
}

export interface PruningCount {
  amount?: number | null;
  interval?: string | null;
}

export interface SpeciesDetailsResponse {
  common_name?: string | null;
  scientific_name?: string[] | null;
  other_name?: string[] | null;
  family?: string | null;
  hybrid?: boolean | null;
  authority?: string | null;
  subspecies?: string | null;
  cultivar?: string | null;
  variety?: string | null;
  species_epithet?: string | null;
  genus?: string | null;
  origin?: string[] | null;
  type?: string | null;
  dimensions?: Dimension[] | null;
  cycle?: string | null;
  attracts?: string[] | null;
  propagation?: string[] | null;
  hardiness?: Hardiness | null;
  watering?: string | null;
  watering_general_benchmark?: WateringGeneralBenchmark | null;
  plant_anatomy?: PlantAnatomyItem[] | null;
  sunlight?: string[] | null;
  pruning_month?: string[] | null;
  pruning_count?: PruningCount | null;
  seeds?: boolean | null;
  maintenance?: string | null;
  care_guides?: string | null;
  soil?: string[] | null;
  growth_rate?: string | null;
  drought_tolerant?: boolean | null;
  salt_tolerant?: boolean | null;
  thorny?: boolean | null;
  invasive?: boolean | null;
  tropical?: boolean | null;
  indoor?: boolean | null;
  care_level?: string | null;
  pest_susceptibility?: string[] | null;
  flowers?: boolean | null;
  flowering_season?: string | null;
  cones?: boolean | null;
  fruits?: boolean | null;
  edible_fruit?: boolean | null;
  harvest_season?: string | null;
  leaf?: boolean | null;
  edible_leaf?: boolean | null;
  cuisine?: boolean | null;
  medicinal?: boolean | null;
  poisonous_to_humans?: boolean | null;
  poisonous_to_pets?: boolean | null;
  description?: string | null;
}

export interface GuideSection {
  type?: string | null;
  description?: string | null;
}

export interface SpeciesGuideData {
  section?: GuideSection[];
}

export interface Species {
  perenual_id: number;
  details: SpeciesDetailsResponse;
  care_guides?: SpeciesGuideData;
  created_at?: string;
  updated_at?: string;
}

export const usePlants = (t: Translations) => {
  const { toast } = useToast();
  const [plants, setPlants] = useState<Plant[]>([]);

  useEffect(() => {
    loadPlants();
  }, []);

  const loadPlants = async () => {
    const loadingToast = delayedToast({
      title: t.loading || "Loading...",
      description: t.loadingPlants || "Loading plants...",
    });

    try {
      const response = await fetch(`/api/plants`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch plants');
      }

      const data = await response.json();
      setPlants(data || []);
      loadingToast.dismiss();
    } catch (error) {
      loadingToast.update({
        title: t.errorLoading,
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const addPlant = async (plantData: {
    name: string;
    species: string;
    wateringInterval: string;
    image: string;
  }) => {
    if (!plantData.name || !plantData.species) {
      toast({
        title: t.missingInfo,
        description: t.fillAllFields,
        variant: "destructive",
      });
      return false;
    }

    const interval = parseInt(plantData.wateringInterval);
    if (isNaN(interval) || interval < 1) {
      toast({
        title: t.invalidInterval,
        description: t.invalidIntervalDescription,
        variant: "destructive",
      });
      return false;
    }

    const loadingToast = delayedToast({
      title: t.loading || "Loading...",
      description: t.addingPlant || "Adding plant...",
    });

    try {
      const response = await fetch('/api/plants', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: plantData.name,
          species: plantData.species,
          watering_interval: interval,
          image: plantData.image,
          last_watered: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add plant');
      }

      loadingToast.update({
        title: t.plantAdded,
        description: t.plantAddedDescription(plantData.name),
      });
      loadPlants();
      return true;
    } catch (error) {
      loadingToast.update({
        title: t.errorAdding,
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      return false;
    }
  };

  const updatePlant = async (plantId: string, plantData: {
    name: string;
    species: string;
    wateringInterval: string;
    image: string;
  }) => {
    const interval = parseInt(plantData.wateringInterval);
    if (isNaN(interval) || interval < 1) {
      toast({
        title: t.invalidInterval,
        description: t.invalidIntervalDescription,
        variant: "destructive",
      });
      return false;
    }

    const loadingToast = delayedToast({
      title: t.loading || "Loading...",
      description: t.updatingPlant || "Updating plant...",
    });

    try {
      const response = await fetch(`/api/plants/${plantId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: plantData.name,
          species: plantData.species,
          watering_interval: interval,
          image: plantData.image,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update plant');
      }

      loadingToast.update({
        title: t.plantUpdated,
        description: t.plantUpdatedDescription(plantData.name),
      });
      loadPlants();
      return true;
    } catch (error) {
      loadingToast.update({
        title: t.errorUpdating,
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      return false;
    }
  };

  const waterPlant = async (id: string) => {
    const plant = plants.find((p) => p.id === id);
    const loadingToast = delayedToast({
      title: t.loading || "Loading...",
      description: t.wateringPlant || "Watering plant...",
    });
    
    try {
      const response = await fetch(`/api/plants/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          last_watered: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to water plant');
      }

      loadingToast.update({
        title: t.plantWatered,
        description: t.plantWateredDescription(plant?.name || ""),
      });
      loadPlants();
    } catch (error) {
      loadingToast.update({
        title: t.errorWatering,
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const deletePlant = async (id: string) => {
    const plant = plants.find((p) => p.id === id);
    const loadingToast = delayedToast({
      title: t.loading || "Loading...",
      description: t.deletingPlant || "Deleting plant...",
    });
    
    try {
      const response = await fetch(`/api/plants/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete plant');
      }

      loadingToast.update({
        title: t.plantDeleted,
        description: t.plantDeletedDescription(plant?.name || ""),
      });
      loadPlants();
    } catch (error) {
      loadingToast.update({
        title: t.errorDeleting,
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const needsWater = (plant: Plant) => {
    const lastWatered = new Date(plant.last_watered);
    const nextWatering = new Date(lastWatered.getTime() + plant.watering_interval * 24 * 60 * 60 * 1000);
    return nextWatering <= new Date();
  };

  const getDaysUntilWatering = (plant: Plant) => {
    const lastWatered = new Date(plant.last_watered);
    const nextWatering = new Date(lastWatered.getTime() + plant.watering_interval * 24 * 60 * 60 * 1000);
    const diff = Math.ceil((nextWatering.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const fetchSpecies = useCallback(async (perenualId: number): Promise<Species | null> => {
    const loadingToast = delayedToast({
      title: t.loading || "Loading...",
      description: t.loadingSpecies || "Loading species information...",
    });

    try {
      const response = await fetch(`/api/plants/species/${perenualId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          loadingToast.dismiss();
          return null;
        }
        throw new Error('Failed to fetch species information');
      }

      const data = await response.json();
      loadingToast.dismiss();
      return data;
    } catch (error) {
      loadingToast.update({
        title: t.errorLoadingSpecies || "Error loading species",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      return null;
    }
  }, [toast, t]);

  return {
    plants,
    addPlant,
    updatePlant,
    waterPlant,
    deletePlant,
    needsWater,
    getDaysUntilWatering,
    fetchSpecies,
  };
};
