import { Droplet, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plant } from "@/models/plant";
import { Translations } from "@/translations/types";

interface PlantCardActionsProps {
    plant: Plant;
    isOverdue: boolean;
    onWater: (id: string) => void;
    onEdit: (plant: Plant) => void;
    onDelete: (id: string) => void;
    t: Translations;
}

export const PlantCardActions = ({
    plant,
    isOverdue,
    onWater,
    onEdit,
    onDelete,
    t,
}: PlantCardActionsProps) => {
    return (
        <div className="flex gap-2">
            <Button
                onClick={() => onWater(plant.id)}
                className="flex-1"
                variant={isOverdue ? "default" : "secondary"}
            >
                <Droplet className="h-4 w-4 mr-2" />
                {t.water}
            </Button>
            <Button onClick={() => onEdit(plant)} variant="outline" size="icon">
                <Pencil className="h-4 w-4" />
            </Button>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="outline" size="icon">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {t.delete} {plant.name}?
                        </AlertDialogTitle>
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
    );
};
