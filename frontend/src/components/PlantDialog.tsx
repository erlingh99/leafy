import { useState } from "react";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/useToast";
import { Plant } from "@/hooks/usePlants";

interface PlantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPlant: Plant | null;
  onSubmit: (plantData: {
    name: string;
    species: string;
    wateringInterval: string;
    image: string;
  }) => Promise<boolean>;
  t: any;
}

export const PlantDialog = ({ open, onOpenChange, editingPlant, onSubmit, t }: PlantDialogProps) => {
  const { toast } = useToast();
  const [plantData, setPlantData] = useState({
    name: editingPlant?.name || "",
    species: editingPlant?.species || "",
    wateringInterval: editingPlant?.watering_interval.toString() || "7",
    image: editingPlant?.image || "",
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
        setPlantData({ ...plantData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setPlantData({ ...plantData, image: "" });
  };

  const handleSubmit = async () => {
    const success = await onSubmit(plantData);
    if (success) {
      setPlantData({ name: "", species: "", wateringInterval: "7", image: "" });
      onOpenChange(false);
    }
  };

  // Update local state when editing plant changes
  useState(() => {
    if (editingPlant) {
      setPlantData({
        name: editingPlant.name,
        species: editingPlant.species,
        wateringInterval: editingPlant.watering_interval.toString(),
        image: editingPlant.image || "",
      });
    } else {
      setPlantData({ name: "", species: "", wateringInterval: "7", image: "" });
    }
  });

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
