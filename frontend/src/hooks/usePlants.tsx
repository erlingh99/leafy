import { useEffect, useState, useCallback } from "react";
import { useToast, delayedToast } from "./useToast";
import { Translations } from "@/translations/types";
import { Plant } from "@/models/plant";
import { Species } from "@/models/species";

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
    species_username?: string;
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
          species_username: plantData.species_username || null,
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
    name?: string;
    species?: string;
    species_username?: string;
    wateringInterval?: string;
    image?: string;
  }) => {
    // Validate watering interval if provided
    if (plantData.wateringInterval !== undefined) {
      const interval = parseInt(plantData.wateringInterval);
      if (isNaN(interval) || interval < 1) {
        toast({
          title: t.invalidInterval,
          description: t.invalidIntervalDescription,
          variant: "destructive",
        });
        return false;
      }
    }

    const loadingToast = delayedToast({
      title: t.loading || "Loading...",
      description: t.updatingPlant || "Updating plant...",
    });

    // Build update payload with only provided fields
    const updatePayload: {
      name?: string;
      species?: string;
      species_username?: string;
      watering_interval?: number;
      image?: string;
    } = {};

    if (plantData.name !== undefined) {
      updatePayload.name = plantData.name;
    }
    if (plantData.species !== undefined) {
      updatePayload.species = plantData.species;
    }
    if (plantData.species_username !== undefined) {
      // Empty string means clear the field (backend treats null as unchanged, so send empty string)
      updatePayload.species_username = plantData.species_username || "";
    }
    if (plantData.wateringInterval !== undefined) {
      updatePayload.watering_interval = parseInt(plantData.wateringInterval);
    }
    if (plantData.image !== undefined) {
      // Empty string means clear the image (backend treats null as unchanged, so send empty string)
      updatePayload.image = plantData.image || "";
    }

    try {
      const response = await fetch(`/api/plants/${plantId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        throw new Error('Failed to update plant');
      }

      loadingToast.update({
        title: t.plantUpdated,
        description: t.plantUpdatedDescription(plantData.name || "Plant"),
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
