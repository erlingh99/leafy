import { useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { usePlants, Plant } from "@/hooks/usePlants";
import { useSubscription } from "@/hooks/useSubscription";
import { Header } from "@/components/Header";
import { PlantCard } from "@/components/PlantCard";
import { PlantDialog } from "@/components/PlantDialog";
import { EmptyPlantState } from "@/components/EmptyPlantState";
import { Dialog } from "@/components/ui/dialog";
import { translations, Language } from "@/lib/translations";

const Index = () => {
  const { theme, setTheme } = useTheme();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [language, setLanguage] = useState<Language>("en");
  const t = translations[language];

  const { plants, addPlant, updatePlant, waterPlant, deletePlant, needsWater, getDaysUntilWatering, fetchSpecies } = usePlants(t);
  const { subscriptions, addSubscription, updateSubscription, deleteSubscription } = useSubscription(t);

  const openAddDialog = () => {
    setEditingPlant(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (plant: Plant) => {
    setEditingPlant(plant);
    setIsDialogOpen(true);
  };

  const handlePlantSubmit = async (plantData: {
    name: string;
    species: string;
    wateringInterval: string;
    image: string;
  }) => {
    if (editingPlant) {
      return await updatePlant(editingPlant.id, plantData);
    } else {
      return await addPlant(plantData);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="min-h-screen bg-background">
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) setEditingPlant(null);
      }}>
        <Header
          language={language}
          onLanguageChange={setLanguage}
          subscriptions={subscriptions}
          onAddSubscription={addSubscription}
          onUpdateSubscription={updateSubscription}
          onDeleteSubscription={deleteSubscription}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenAddDialog={openAddDialog}
          t={t}
        />

        <PlantDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          editingPlant={editingPlant}
          onSubmit={handlePlantSubmit}
          t={t}
        />
      </Dialog>

      <main className="container mx-auto px-4 py-8">
        {plants.length === 0 ? (
          <EmptyPlantState onAddPlant={openAddDialog} t={t} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plants.map((plant) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                isOverdue={needsWater(plant)}
                daysUntil={getDaysUntilWatering(plant)}
                onWater={waterPlant}
                onEdit={openEditDialog}
                onDelete={deletePlant}
                fetchSpecies={fetchSpecies}
                t={t}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
