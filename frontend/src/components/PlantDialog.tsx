import { useEffect, useState } from "react";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/useToast";
import { Plant } from "@/models/plant";
import { Translations } from "@/translations/types";

interface PlantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPlant: Plant | null;
  onSubmit: (plantData: {
    name?: string;
    species?: string;
    species_username?: string;
    wateringInterval?: string;
    image?: string;
  }) => Promise<boolean>;
  t: Translations;
}

export const PlantDialog = ({ open, onOpenChange, editingPlant, onSubmit, t }: PlantDialogProps) => {
  const { toast } = useToast();
  const [plantData, setPlantData] = useState({
    name: editingPlant?.name || "",
    species: editingPlant?.species || "",
    species_username: editingPlant?.species_username || "",
    wateringInterval: editingPlant?.watering_interval.toString() || "7",
    // For existing plants we show the image URL for preview; new uploads use data URI
    image: editingPlant?.image_url || "",
  });
  const [originalData, setOriginalData] = useState<{
    name: string;
    species: string;
    species_username: string;
    wateringInterval: string;
    image: string;
  } | null>(null);
  const [imageChanged, setImageChanged] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: t.invalidFileType || "Invalid file type",
          description: t.invalidFileTypeDescription || "Please select an image file.",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: t.imageTooLarge,
          description: t.imageTooLargeDescription,
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result === "string") {
          setPlantData(prev => ({ ...prev, image: result }));
          setImageChanged(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setPlantData({ ...plantData, image: "" });
    setImageChanged(true);
  };

  const handleSubmit = async () => {
    // Validate required fields when adding a new plant
    if (!editingPlant) {
      if (!plantData.name.trim()) {
        toast({
          title: t.missingInfo,
          description: t.fillAllFields,
          variant: "destructive",
        });
        return;
      }
      if (!plantData.species.trim()) {
        toast({
          title: t.missingInfo,
          description: t.fillAllFields,
          variant: "destructive",
        });
        return;
      }
      if (!plantData.wateringInterval || parseInt(plantData.wateringInterval) < 1) {
        toast({
          title: t.invalidInterval,
          description: t.invalidIntervalDescription,
          variant: "destructive",
        });
        return;
      }
      // Send all required fields for new plant
      const success = await onSubmit({
        name: plantData.name,
        species: plantData.species,
        species_username: plantData.species_username || undefined,
        wateringInterval: plantData.wateringInterval,
        image: plantData.image || undefined,
      });
      if (success) {
        setPlantData({ name: "", species: "", species_username: "", wateringInterval: "7", image: "" });
        setOriginalData(null);
        onOpenChange(false);
      }
    } else {
      // Validate required fields when updating (they can be changed but not left empty)
      if (plantData.name.trim() === "") {
        toast({
          title: t.missingInfo,
          description: t.fillAllFields,
          variant: "destructive",
        });
        return;
      }
      if (plantData.species.trim() === "") {
        toast({
          title: t.missingInfo,
          description: t.fillAllFields,
          variant: "destructive",
        });
        return;
      }
      if (!plantData.wateringInterval || parseInt(plantData.wateringInterval) < 1) {
        toast({
          title: t.invalidInterval,
          description: t.invalidIntervalDescription,
          variant: "destructive",
        });
        return;
      }

      // For updates, only send changed fields
      const changedFields: {
        name?: string;
        species?: string;
        species_username?: string;
        wateringInterval?: string;
        image?: string;
      } = {};

      if (!originalData) {
        // Fallback: send all fields if originalData is not set
        changedFields.name = plantData.name;
        changedFields.species = plantData.species;
        // Preserve empty string for optional fields to allow clearing
        changedFields.species_username = plantData.species_username || "";
        changedFields.wateringInterval = plantData.wateringInterval;
        changedFields.image = plantData.image || "";
      } else {
        // Compare and only include changed fields
        // Required fields: only include if changed
        if (plantData.name !== originalData.name) {
          changedFields.name = plantData.name;
        }
        if (plantData.species !== originalData.species) {
          changedFields.species = plantData.species;
        }
        if (plantData.wateringInterval !== originalData.wateringInterval) {
          changedFields.wateringInterval = plantData.wateringInterval;
        }
        
        // Optional fields: include if changed, including clearing (value to empty)
        // Normalize empty strings and null/undefined for comparison
        const currentSpeciesUsername = plantData.species_username || "";
        const originalSpeciesUsername = originalData.species_username || "";
        if (currentSpeciesUsername !== originalSpeciesUsername) {
          // Send empty string to clear, or the value if set
          changedFields.species_username = plantData.species_username || "";
        }
        
        // Only include image in the payload if the user changed it (new upload or cleared)
        if (imageChanged) {
          changedFields.image = plantData.image || "";
        }
      }

      // Only submit if there are changes
      if (Object.keys(changedFields).length === 0) {
        toast({
          title: t.plantUpdated,
          description: t.plantUpdatedDescription(plantData.name),
        });
        onOpenChange(false);
        return;
      }

      const success = await onSubmit(changedFields);
      if (success) {
        onOpenChange(false);
      }
    }
  };

  // Update local state when editing plant changes
  useEffect(() => {
    if (editingPlant) {
      const initialData = {
        name: editingPlant.name,
        species: editingPlant.species,
        species_username: editingPlant.species_username ?? "",
        wateringInterval: editingPlant.watering_interval.toString(),
        image: editingPlant.image_url || "",
      };
      setPlantData(initialData);
      setOriginalData(initialData);
      setImageChanged(false);
    } else {
      setPlantData({ name: "", species: "", species_username: "", wateringInterval: "7", image: "" });
      setOriginalData(null);
    }
  }, [editingPlant]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingPlant ? t.editPlant : t.addNewPlant}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="image">{t.plantPhoto}</Label>
            {plantData.image ? (
              <div className="relative">
                <img
                  src={plantData.image}
                  alt="Plant preview"
                  className="w-full h-48 object-cover rounded-md"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-md p-8 text-center hover:border-primary transition-colors cursor-pointer">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <label htmlFor="image" className="cursor-pointer flex flex-col items-center gap-2">
                  <Camera className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {t.clickToUpload}
                  </span>
                </label>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">{t.plantName}</Label>
            <Input
              id="name"
              placeholder={t.plantNamePlaceholder}
              value={plantData.name}
              onChange={(e) => setPlantData({ ...plantData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="species">{t.species}</Label>
            <Input
              id="species"
              placeholder={t.speciesPlaceholder}
              value={plantData.species}
              onChange={(e) => setPlantData({ ...plantData, species: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="species_username">{t.speciesUsername}</Label>
            <Input
              id="species_username"
              placeholder={t.speciesUsernamePlaceholder}
              value={plantData.species_username}
              onChange={(e) => setPlantData({ ...plantData, species_username: e.target.value })}
            />
          </div>          
          <div className="space-y-2">
            <Label htmlFor="interval">{t.wateringInterval}</Label>
            <Input
              id="interval"
              type="number"
              min="1"
              value={plantData.wateringInterval}
              onChange={(e) =>
                setPlantData({ ...plantData, wateringInterval: e.target.value })
              }
            />
          </div>
          <Button onClick={handleSubmit} className="w-full">
            {editingPlant ? t.updatePlant : t.addPlant}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
