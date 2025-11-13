import { Plus, Droplet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface EmptyPlantStateProps {
  onAddPlant: () => void;
  t: any;
}

export const EmptyPlantState = ({ onAddPlant, t }: EmptyPlantStateProps) => {
  return (
    <Card className="p-12 text-center">
      <div className="mx-auto w-24 h-24 rounded-full bg-secondary flex items-center justify-center mb-4">
        <Droplet className="h-12 w-12 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-semibold mb-2">{t.noPlantsYet}</h2>
      <p className="text-muted-foreground mb-6">{t.noPlantsDescription}</p>
      <Button onClick={onAddPlant}>
        <Plus className="h-4 w-4 mr-2" />
        {t.addYourFirstPlant}
      </Button>
    </Card>
  );
};
