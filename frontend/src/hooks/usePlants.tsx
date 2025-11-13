import { useState, useEffect } from "react";
import { useToast } from "./useToast";
import { Language } from "@/lib/translations";

export interface Plant {
  id: string;
  user_id: string;
  name: string;
  species: string;
  watering_interval: number;
  last_watered: string;
  image?: string;
}

export const usePlants = (language: Language, t: any) => {
  const { toast } = useToast();
  const [plants, setPlants] = useState<Plant[]>([]);

  useEffect(() => {
    loadPlants();
  }, []);

  const loadPlants = async () => {
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
    } catch (error: any) {
      toast({
        title: t.errorLoading,
        description: error.message,
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

      toast({
        title: t.plantAdded,
        description: t.plantAddedDescription(plantData.name),
      });
      loadPlants();
      return true;
    } catch (error: any) {
      toast({
        title: t.errorAdding,
        description: error.message,
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

      toast({
        title: t.plantUpdated,
        description: t.plantUpdatedDescription(plantData.name),
      });
      loadPlants();
      return true;
    } catch (error: any) {
      toast({
        title: t.errorUpdating,
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const waterPlant = async (id: string) => {
    const plant = plants.find((p) => p.id === id);
    
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

      toast({
        title: t.plantWatered,
        description: t.plantWateredDescription(plant?.name || ""),
      });
      loadPlants();
    } catch (error: any) {
      toast({
        title: t.errorWatering,
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deletePlant = async (id: string) => {
    const plant = plants.find((p) => p.id === id);
    
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

      toast({
        title: t.plantDeleted,
        description: t.plantDeletedDescription(plant?.name || ""),
      });
      loadPlants();
    } catch (error: any) {
      toast({
        title: t.errorDeleting,
        description: error.message,
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

  return {
    plants,
    addPlant,
    updatePlant,
    waterPlant,
    deletePlant,
    needsWater,
    getDaysUntilWatering,
  };
};
