import { Droplet, Calendar, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plant } from "@/hooks/usePlants";

interface PlantCardProps {
  plant: Plant;
  isOverdue: boolean;
  daysUntil: number;
  onWater: (id: string) => void;
  onEdit: (plant: Plant) => void;
  onDelete: (id: string) => void;
  t: any;
}

export const PlantCard = ({ plant, isOverdue, daysUntil, onWater, onEdit, onDelete, t }: PlantCardProps) => {
  return (
    <Card
      className={`transition-all hover:shadow-lg ${
        isOverdue ? "border-warning" : "border-border"
      }`}
    >
      <div className="p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-shrink-0">
            {plant.image ? (
              <img
                src={plant.image}
                alt={plant.name}
                className="w-24 h-32 object-cover rounded-full"
                style={{ borderRadius: "50% / 60%" }}
              />
            ) : (
              <div className="w-24 h-32 bg-secondary flex items-center justify-center rounded-full" style={{ borderRadius: "50% / 60%" }}>
                <span className="text-4xl">🌱</span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-foreground">{plant.name}</h3>
                <p className="text-sm text-muted-foreground italic">{plant.species}</p>
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
                  {t.watered}: {new Date(plant.last_watered).toLocaleDateString()}
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

        <div className="flex gap-2">
          <Button
            onClick={() => onWater(plant.id)}
            className="flex-1"
            variant={isOverdue ? "default" : "secondary"}
          >
            <Droplet className="h-4 w-4 mr-2" />
            {t.water}
          </Button>
          <Button
            onClick={() => onEdit(plant)}
            variant="outline"
            size="icon"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t.delete} {plant.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  {t.deleteConfirmDescription}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(plant.id)}>
                  {t.delete}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Card>
  );
};
