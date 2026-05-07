import { useState, lazy, Suspense } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { usePlants } from "@/hooks/usePlants";
import { useSubscription } from "@/hooks/useSubscription";
import { Header } from "@/components/Header";
import { PlantCard } from "@/components/PlantCard";
import { EmptyPlantState } from "@/components/EmptyPlantState";

const PlantDialog = lazy(() =>
  import("@/components/PlantDialog").then((m) => ({ default: m.PlantDialog }))
);
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { translations, Language } from "@/translations/types";
import { Plant } from "@/models/plant";
import { Droplet } from "lucide-react";

const Index = () => {
  const { theme, setTheme } = useTheme();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [hasOpenedDialog, setHasOpenedDialog] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [language, setLanguage] = useState<Language>("en");
  const t = translations[language];

  const { plants, isAddingPlant, addPlant, updatePlant, waterPlant, deletePlant, waterAllPlants, waterOverduePlants, needsWater, getDaysUntilWatering, fetchSpecies } = usePlants(t);
  const { subscriptions, addSubscription, updateSubscription, deleteSubscription } = useSubscription(t);

  const openAddDialog = () => {
    setHasOpenedDialog(true);
    setEditingPlant(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (plant: Plant) => {
    setHasOpenedDialog(true);
    setEditingPlant(plant);
    setIsDialogOpen(true);
  };

  const handlePlantSubmit = async (plantData: {
    name?: string;
    species?: string;
    species_username?: string;
    wateringInterval?: string;
    image?: string;
  }) => {
    if (editingPlant) {
      return await updatePlant(editingPlant.id, plantData);
    } else {
      // For new plants, ensure required fields are present
      if (!plantData.name || !plantData.species || !plantData.wateringInterval) {
        return false;
      }
      return await addPlant({
        name: plantData.name,
        species: plantData.species,
        species_username: plantData.species_username,
        wateringInterval: plantData.wateringInterval,
        image: plantData.image || "",
      });
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
          isAddingPlant={isAddingPlant}
          t={t}
        />

        {hasOpenedDialog && (
          <Suspense fallback={null}>
            <PlantDialog
              open={isDialogOpen}
              onOpenChange={setIsDialogOpen}
              editingPlant={editingPlant}
              onSubmit={handlePlantSubmit}
              t={t}
            />
          </Suspense>
        )}
      </Dialog>

      <main className="container mx-auto px-4 py-8">
        {plants.length === 0 ? (
          <EmptyPlantState onAddPlant={openAddDialog} t={t} />
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">{t.myPlants || "My Plants"}</h2>
              <div className="flex gap-2">
                {plants.some(needsWater) && (
                  <Button onClick={() => waterOverduePlants()} variant="secondary" className="shadow-sm">
                    <Droplet className="h-4 w-4 mr-2 text-warning" />
                    {t.waterOverdue || "Water Overdue"}
                  </Button>
                )}
                <Button onClick={() => waterAllPlants()} variant="secondary" className="shadow-sm">
                  <Droplet className="h-4 w-4 mr-2 text-primary" />
                  {t.waterAll || "Water All"}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
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
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
