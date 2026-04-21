import { useCallback, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast, delayedToast } from "./useToast";
import { Translations } from "@/translations/types";
import { Plant } from "@/models/plant";
import { Species } from "@/models/species";

export const usePlants = (t: Translations) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const plantsToastRef = useRef<ReturnType<typeof delayedToast> | null>(null);

  const { data: plants = [], isPending: isPlantsPending } = useQuery({
    queryKey: ['plants'],
    queryFn: async () => {
      const response = await fetch(`/api/plants`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch plants');
      }
      return response.json() as Promise<Plant[]>;
    },
  });

  useEffect(() => {
    if (isPlantsPending) {
      plantsToastRef.current = delayedToast({
        title: t.loading || "Loading...",
        description: t.loadingPlants || "Loading your plants...",
      });
    } else if (plantsToastRef.current) {
      plantsToastRef.current.dismiss();
      plantsToastRef.current = null;
    }
  }, [isPlantsPending]); // eslint-disable-line react-hooks/exhaustive-deps

  const addPlantMutation = useMutation({
    mutationFn: async (plantData: {
      name: string;
      species: string;
      species_username?: string;
      wateringInterval: string;
      image: string;
    }) => {
      const interval = parseInt(plantData.wateringInterval);
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
      return response.json() as Promise<Plant>;
    },
    onSuccess: (newPlant, variables) => {
      queryClient.setQueryData<Plant[]>(['plants'], (old) => {
        if (!old) return [newPlant];
        return [...old, newPlant];
      });
      toast({
        title: t.plantAdded,
        description: t.plantAddedDescription(variables.name),
      });
    },
    onError: (error) => {
      toast({
        title: t.errorAdding,
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  });

  const updatePlantMutation = useMutation({
    mutationFn: async ({ plantId, updatePayload }: { plantId: string, updatePayload: Partial<Plant> }) => {
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
      return response.json() as Promise<Plant>;
    },
    onSuccess: (updatedPlant, variables) => {
      queryClient.setQueryData<Plant[]>(['plants'], (old) => {
        if (!old) return old;
        return old.map(p => p.id === variables.plantId ? updatedPlant : p);
      });
      toast({
        title: t.plantUpdated,
        description: t.plantUpdatedDescription(variables.updatePayload.name || "Plant"),
      });
    },
    onError: (error) => {
      toast({
        title: t.errorUpdating,
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  });

  const waterPlantMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/plants/water/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to water plant');
      }
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['plants'] });
      const previousPlants = queryClient.getQueryData<Plant[]>(['plants']);

      if (previousPlants) {
        queryClient.setQueryData<Plant[]>(['plants'],
          previousPlants.map((p) =>
            p.id === id ? { ...p, last_watered: new Date().toISOString() } : p
          )
        );
      }
      return { previousPlants };
    },
    onError: (error, id, context) => {
      if (context?.previousPlants) {
        queryClient.setQueryData(['plants'], context.previousPlants);
      }
      toast({
        title: t.errorWatering,
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
    onSuccess: (_, id) => {
      const plant = plants.find((p) => p.id === id);
      toast({
        title: t.plantWatered,
        description: t.plantWateredDescription(plant?.name || ""),
      });
    },
  });

  const needsWater = (plant: Plant) => {
    const lastWatered = new Date(plant.last_watered);
    const nextWatering = new Date(lastWatered.getTime() + plant.watering_interval * 24 * 60 * 60 * 1000);
    return nextWatering <= new Date();
  };

  const getDaysUntilWatering = (plant: Plant) => {
    const lastWatered = new Date(plant.last_watered);
    const nextWatering = new Date(lastWatered.getTime() + plant.watering_interval * 24 * 60 * 60 * 1000);
    const diff = Math.floor((nextWatering.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const waterAllPlantsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/plants/water/all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to water all plants');
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['plants'] });
      const previousPlants = queryClient.getQueryData<Plant[]>(['plants']);
      const now = new Date().toISOString();

      if (previousPlants) {
        const overdues = previousPlants.filter(needsWater);
        const shouldWaterAll = overdues.length === 0;

        queryClient.setQueryData<Plant[]>(['plants'],
          previousPlants.map((p) => {
            if (shouldWaterAll || needsWater(p)) {
              return { ...p, last_watered: now };
            }
            return p;
          })
        );
      }
      return { previousPlants };
    },
    onError: (error, variables, context) => {
      if (context?.previousPlants) {
        queryClient.setQueryData(['plants'], context.previousPlants);
      }
      toast({
        title: t.errorWatering,
        description: error instanceof Error ? error.message : "Failed to water all plants",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      // Opt out of a full refetch to be lightweight, or refetch background:
      queryClient.invalidateQueries({ queryKey: ['plants'] });
      toast({
        title: "Plants watered",
        description: "Successfully watered plants.",
      });
    }
  });

  const deletePlantMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/plants/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete plant');
      }
    },
    onSuccess: (_, id) => {
      const plant = plants.find((p) => p.id === id);
      queryClient.setQueryData<Plant[]>(['plants'], (old) => {
        if (!old) return old;
        return old.filter((p) => p.id !== id);
      });
      toast({
        title: t.plantDeleted,
        description: t.plantDeletedDescription(plant?.name || ""),
      });
    },
    onError: (error) => {
      toast({
        title: t.errorDeleting,
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  });

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
      await addPlantMutation.mutateAsync(plantData);
      loadingToast.dismiss();
      return true;
    } catch {
      loadingToast.dismiss();
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

    const updatePayload: {
      name?: string;
      species?: string;
      species_username?: string;
      watering_interval?: number;
      image?: string;
    } = {};

    if (plantData.name !== undefined) updatePayload.name = plantData.name;
    if (plantData.species !== undefined) updatePayload.species = plantData.species;
    if (plantData.species_username !== undefined) updatePayload.species_username = plantData.species_username || "";
    if (plantData.wateringInterval !== undefined) updatePayload.watering_interval = parseInt(plantData.wateringInterval);
    if (plantData.image !== undefined) updatePayload.image = plantData.image || "";

    try {
      await updatePlantMutation.mutateAsync({ plantId, updatePayload });
      loadingToast.dismiss();
      return true;
    } catch {
      loadingToast.dismiss();
      return false;
    }
  };

  const waterPlant = (id: string) => waterPlantMutation.mutate(id);
  const deletePlant = (id: string) => {
    const loadingToast = delayedToast({
      title: t.loading || "Loading...",
      description: t.deletingPlant || "Deleting plant...",
    });
    deletePlantMutation.mutate(id, {
      onSettled: () => loadingToast.dismiss()
    });
  };
  const waterAllPlants = () => waterAllPlantsMutation.mutate();

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
  }, [t]);

  return {
    plants,
    isAddingPlant: addPlantMutation.isPending,
    addPlant,
    updatePlant,
    waterPlant,
    deletePlant,
    waterAllPlants,
    needsWater,
    getDaysUntilWatering,
    fetchSpecies,
  };
};
