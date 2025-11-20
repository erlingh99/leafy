import { useState, useEffect, useRef } from "react";
import { 
  Droplet, Calendar, Pencil, Trash2, Info, ChevronDown, ChevronUp,
  Sun, Cloud, Sprout, Heart, Thermometer, Leaf, Flower2, Apple, 
  Beaker, AlertTriangle, Shield, BookOpen, Sparkles, TreePine,
  Globe, Bug, Scissors, MapPin, Ruler, 
  Utensils, Cherry, CircleDot, Waves, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plant, Species } from "@/hooks/usePlants";
import { Translations } from "@/lib/translations";

interface PlantCardProps {
  plant: Plant;
  isOverdue: boolean;
  daysUntil: number;
  onWater: (id: string) => void;
  onEdit: (plant: Plant) => void;
  onDelete: (id: string) => void;
  fetchSpecies: (perenualId: number) => Promise<Species | null>;
  t: Translations;
}

export const PlantCard = ({ plant, isOverdue, daysUntil, onWater, onEdit, onDelete, fetchSpecies, t }: PlantCardProps) => {
  const [isSpeciesOpen, setIsSpeciesOpen] = useState(false);
  const [speciesData, setSpeciesData] = useState<Species | null>(null);
  const [isLoadingSpecies, setIsLoadingSpecies] = useState(false);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (isSpeciesOpen && !speciesData && !isLoadingSpecies && !hasFetchedRef.current && plant.perenual_species_id) {
      hasFetchedRef.current = true;
      setIsLoadingSpecies(true);
      fetchSpecies(plant.perenual_species_id).then((data) => {
        setSpeciesData(data);
        setIsLoadingSpecies(false);
      });
    }
  }, [isSpeciesOpen, speciesData, isLoadingSpecies, plant.perenual_species_id, fetchSpecies]);

  // Reset the ref when the collapsible is closed
  useEffect(() => {
    if (!isSpeciesOpen) {
      hasFetchedRef.current = false;
    }
  }, [isSpeciesOpen]);

  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const LongTextDisplay = ({ text, maxLength }: { text: string; maxLength: number }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (text.length <= maxLength) {
      return <span>{text}</span>;
    }

    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-start gap-1 flex-wrap">
          {!isOpen && <span>{truncateText(text, maxLength)}</span>}
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-auto p-0 text-primary">
              {isOpen ? (
                <>
                  <span className="text-xs">Less</span>
                  <ChevronUp className="h-3 w-3 ml-1" />
                </>
              ) : (
                <>
                  <span className="text-xs">More</span>
                  <ChevronDown className="h-3 w-3 ml-1" />
                </>
              )}
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="mt-1 text-muted-foreground">{text}</div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  const renderSpeciesInfo = () => {
    if (!speciesData) return null;
    const { details, care_guides } = speciesData;

    return (
      <div className="space-y-3 text-sm">
          {/* Basic Information */}
          <div className="space-y-2">
            {details.common_name && (
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="font-semibold">{t.speciesCommonName || "Common Name"}: </span>
                <span>{details.common_name}</span>
              </div>
            )}
            {details.scientific_name && details.scientific_name.length > 0 && (
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="font-semibold">{t.speciesScientificName || "Scientific Name"}: </span>
                <span className="italic">{details.scientific_name.join(", ")}</span>
              </div>
            )}
            {details.other_name && details.other_name.length > 0 && (
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="font-semibold">{t.speciesOtherName || "Other Names"}: </span>
                <span>{details.other_name.join(", ")}</span>
              </div>
            )}
            {details.family && (
              <div className="flex items-center gap-2">
                <TreePine className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="font-semibold">{t.speciesFamily || "Family"}: </span>
                <span>{details.family}</span>
              </div>
            )}
            {details.genus && (
              <div className="flex items-center gap-2">
                <Leaf className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="font-semibold">{t.speciesGenus || "Genus"}: </span>
                <span>{details.genus}</span>
              </div>
            )}
            {details.species_epithet && (
              <div className="flex items-center gap-2">
                <Leaf className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="font-semibold">{t.speciesEpithet || "Species Epithet"}: </span>
                <span className="italic">{details.species_epithet}</span>
              </div>
            )}
            {details.authority && (
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="font-semibold">{t.speciesAuthority || "Authority"}: </span>
                <span>{details.authority}</span>
              </div>
            )}
            {details.subspecies && (
              <div className="flex items-center gap-2">
                <Leaf className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="font-semibold">{t.speciesSubspecies || "Subspecies"}: </span>
                <span className="italic">{details.subspecies}</span>
              </div>
            )}
            {details.variety && (
              <div className="flex items-center gap-2">
                <Leaf className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="font-semibold">{t.speciesVariety || "Variety"}: </span>
                <span className="italic">{details.variety}</span>
              </div>
            )}
            {details.cultivar && (
              <div className="flex items-center gap-2">
                <Leaf className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="font-semibold">{t.speciesCultivar || "Cultivar"}: </span>
                <span className="italic">{details.cultivar}</span>
              </div>
            )}
            {details.hybrid !== null && details.hybrid !== undefined && (
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="font-semibold">{t.speciesHybrid || "Hybrid"}: </span>
                <span>{details.hybrid ? "Yes" : "No"}</span>
              </div>
            )}
            {details.type && (
              <div className="flex items-center gap-2">
                <TreePine className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="font-semibold">{t.speciesType || "Type"}: </span>
                <span>{details.type}</span>
              </div>
            )}
            {details.origin && details.origin.length > 0 && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="font-semibold">{t.speciesOrigin || "Origin"}: </span>
                <span>{details.origin.join(", ")}</span>
              </div>
            )}
          </div>

          {/* Description with tooltip/collapsible */}
          {details.description && (
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold">{t.speciesDescription || "Description"}: </span>
                <LongTextDisplay text={details.description} maxLength={80} />
              </div>
            </div>
          )}

          {/* Care Information */}
          <div className="space-y-2 pt-2 border-t border-border/50">
            {details.watering && (
              <div className="flex items-center gap-2">
                <Droplet className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span className="font-semibold">{t.speciesWatering || "Watering"}: </span>
                <LongTextDisplay text={details.watering} maxLength={40} />
              </div>
            )}
            {details.watering_general_benchmark && (
              <div className="flex items-center gap-2">
                <Droplet className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span className="font-semibold">{t.speciesWateringBenchmark || "Watering Benchmark"}: </span>
                <span>
                  {details.watering_general_benchmark.value}
                  {details.watering_general_benchmark.unit && ` ${details.watering_general_benchmark.unit}`}
                </span>
              </div>
            )}
            {details.sunlight && details.sunlight.length > 0 && (
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                <span className="font-semibold">{t.speciesSunlight || "Sunlight"}: </span>
                <span>{details.sunlight.join(", ")}</span>
              </div>
            )}
            {details.soil && details.soil.length > 0 && (
              <div className="flex items-center gap-2">
                <Sprout className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="font-semibold">{t.speciesSoil || "Soil"}: </span>
                <span>{details.soil.join(", ")}</span>
              </div>
            )}
            {details.growth_rate && (
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500 flex-shrink-0" />
                <span className="font-semibold">{t.speciesGrowthRate || "Growth Rate"}: </span>
                <span>{details.growth_rate}</span>
              </div>
            )}
            {details.care_level && (
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-pink-500 flex-shrink-0" />
                <span className="font-semibold">{t.speciesCareLevel || "Care Level"}: </span>
                <span>{details.care_level}</span>
              </div>
            )}
            {details.hardiness && (details.hardiness.min || details.hardiness.max) && (
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-orange-500 flex-shrink-0" />
                <span className="font-semibold">{t.speciesHardiness || "Hardiness"}: </span>
                <span>
                  {details.hardiness.min && details.hardiness.max
                    ? `${details.hardiness.min} - ${details.hardiness.max}`
                    : details.hardiness.min || details.hardiness.max}
                </span>
              </div>
            )}
            {details.propagation && details.propagation.length > 0 && (
              <div className="flex items-center gap-2">
                <Sprout className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="font-semibold">{t.speciesPropagation || "Propagation"}: </span>
                <span>{details.propagation.join(", ")}</span>
              </div>
            )}
            {details.cycle && (
              <div className="flex items-center gap-2">
                <Cloud className="h-4 w-4 text-sky-500 flex-shrink-0" />
                <span className="font-semibold">{t.speciesCycle || "Cycle"}: </span>
                <span>{details.cycle}</span>
              </div>
            )}
            {details.maintenance && (
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-pink-500 flex-shrink-0" />
                <span className="font-semibold">{t.speciesMaintenance || "Maintenance"}: </span>
                <LongTextDisplay text={details.maintenance} maxLength={40} />
              </div>
            )}
            {details.dimensions && details.dimensions.length > 0 && (
              <div className="flex items-start gap-2">
                <Ruler className="h-4 w-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold">{t.speciesDimensions || "Dimensions"}: </span>
                  <div className="mt-1 space-y-1">
                    {details.dimensions.map((dim, idx) => (
                      <div key={idx} className="text-sm">
                        {dim.type && <span className="font-medium">{dim.type}: </span>}
                        {dim.min_value !== null && dim.max_value !== null && (
                          <span>{dim.min_value} - {dim.max_value}</span>
                        )}
                        {dim.min_value !== null && dim.max_value === null && (
                          <span>&ge; {dim.min_value}</span>
                        )}
                        {dim.min_value === null && dim.max_value !== null && (
                          <span>&le; {dim.max_value}</span>
                        )}
                        {dim.unit && <span> {dim.unit}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {details.attracts && details.attracts.length > 0 && (
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-500 flex-shrink-0" />
                <span className="font-semibold">{t.speciesAttracts || "Attracts"}: </span>
                <span>{details.attracts.join(", ")}</span>
              </div>
            )}
            {details.pruning_month && details.pruning_month.length > 0 && (
              <div className="flex items-center gap-2">
                <Scissors className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="font-semibold">{t.speciesPruningMonth || "Pruning Month"}: </span>
                <span>{details.pruning_month.join(", ")}</span>
              </div>
            )}
            {details.pruning_count && (
              <div className="flex items-center gap-2">
                <Scissors className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="font-semibold">{t.speciesPruningCount || "Pruning"}: </span>
                <span>
                  {details.pruning_count.amount !== null && `${details.pruning_count.amount} times`}
                  {details.pruning_count.amount !== null && details.pruning_count.interval && " "}
                  {details.pruning_count.interval && `per ${details.pruning_count.interval}`}
                </span>
              </div>
            )}
            {details.pest_susceptibility && details.pest_susceptibility.length > 0 && (
              <div className="flex items-center gap-2">
                <Bug className="h-4 w-4 text-red-500 flex-shrink-0" />
                <span className="font-semibold">{t.speciesPestSusceptibility || "Pest Susceptibility"}: </span>
                <span>{details.pest_susceptibility.join(", ")}</span>
              </div>
            )}
            {details.flowering_season && (
              <div className="flex items-center gap-2">
                <Flower2 className="h-4 w-4 text-pink-500 flex-shrink-0" />
                <span className="font-semibold">{t.speciesFloweringSeason || "Flowering Season"}: </span>
                <span>{details.flowering_season}</span>
              </div>
            )}
            {details.harvest_season && (
              <div className="flex items-center gap-2">
                <Apple className="h-4 w-4 text-orange-500 flex-shrink-0" />
                <span className="font-semibold">{t.speciesHarvestSeason || "Harvest Season"}: </span>
                <span>{details.harvest_season}</span>
              </div>
            )}
            {details.plant_anatomy && details.plant_anatomy.length > 0 && (
              <div className="flex items-start gap-2">
                <Leaf className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold">{t.speciesPlantAnatomy || "Plant Anatomy"}: </span>
                  <div className="mt-1 space-y-1">
                    {details.plant_anatomy.map((anatomy, idx) => (
                      <div key={idx} className="text-sm">
                        {anatomy.part && <span className="font-medium">{anatomy.part}: </span>}
                        {anatomy.color && anatomy.color.length > 0 && (
                          <span>{anatomy.color.join(", ")}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {details.hardiness_location && details.hardiness_location.full_url && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span className="font-semibold">{t.speciesHardinessLocation || "Hardiness Location"}: </span>
                <a 
                  href={details.hardiness_location.full_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary underline hover:no-underline"
                >
                  {t.speciesViewMap || "View Map"}
                </a>
              </div>
            )}
          </div>

          {/* Traits */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
            {details.drought_tolerant !== null && details.drought_tolerant !== undefined && (
              <span className="px-2 py-1 bg-secondary rounded text-xs flex items-center gap-1">
                <Droplet className="h-3 w-3" />
                {details.drought_tolerant ? (t.speciesDroughtTolerant || "Drought Tolerant") : (t.speciesNotDroughtTolerant || "Not Drought Tolerant")}
              </span>
            )}
            {details.salt_tolerant !== null && details.salt_tolerant !== undefined && (
              <span className="px-2 py-1 bg-secondary rounded text-xs flex items-center gap-1">
                <Waves className="h-3 w-3" />
                {details.salt_tolerant ? (t.speciesSaltTolerant || "Salt Tolerant") : (t.speciesNotSaltTolerant || "Not Salt Tolerant")}
              </span>
            )}
            {details.indoor !== null && details.indoor !== undefined && (
              <span className="px-2 py-1 bg-secondary rounded text-xs flex items-center gap-1">
                {details.indoor ? <Shield className="h-3 w-3" /> : <Sun className="h-3 w-3" />}
                {details.indoor ? (t.speciesIndoor || "Indoor") : (t.speciesOutdoor || "Outdoor")}
              </span>
            )}
            {details.tropical !== null && details.tropical !== undefined && (
              <span className="px-2 py-1 bg-secondary rounded text-xs flex items-center gap-1">
                <Sun className="h-3 w-3" />
                {details.tropical ? (t.speciesTropical || "Tropical") : (t.speciesNotTropical || "Not Tropical")}
              </span>
            )}
            {details.flowers && (
              <span className="px-2 py-1 bg-secondary rounded text-xs flex items-center gap-1">
                <Flower2 className="h-3 w-3" />
                {t.speciesFlowers || "Flowers"}
              </span>
            )}
            {details.fruits && (
              <span className="px-2 py-1 bg-secondary rounded text-xs flex items-center gap-1">
                <Apple className="h-3 w-3" />
                {t.speciesFruits || "Fruits"}
              </span>
            )}
            {details.edible_fruit !== null && details.edible_fruit !== undefined && (
              <span className="px-2 py-1 bg-secondary rounded text-xs flex items-center gap-1">
                <Cherry className="h-3 w-3" />
                {details.edible_fruit ? (t.speciesEdibleFruit || "Edible Fruit") : (t.speciesNotEdibleFruit || "Not Edible Fruit")}
              </span>
            )}
            {details.leaf !== null && details.leaf !== undefined && (
              <span className="px-2 py-1 bg-secondary rounded text-xs flex items-center gap-1">
                <Leaf className="h-3 w-3" />
                {details.leaf ? (t.speciesLeaf || "Has Leaves") : (t.speciesNoLeaf || "No Leaves")}
              </span>
            )}
            {details.edible_leaf !== null && details.edible_leaf !== undefined && (
              <span className="px-2 py-1 bg-secondary rounded text-xs flex items-center gap-1">
                <Leaf className="h-3 w-3" />
                {details.edible_leaf ? (t.speciesEdibleLeaf || "Edible Leaf") : (t.speciesNotEdibleLeaf || "Not Edible Leaf")}
              </span>
            )}
            {details.cones !== null && details.cones !== undefined && (
              <span className="px-2 py-1 bg-secondary rounded text-xs flex items-center gap-1">
                <CircleDot className="h-3 w-3" />
                {details.cones ? (t.speciesCones || "Cones") : (t.speciesNoCones || "No Cones")}
              </span>
            )}
            {details.seeds !== null && details.seeds !== undefined && (
              <span className="px-2 py-1 bg-secondary rounded text-xs flex items-center gap-1">
                <Sprout className="h-3 w-3" />
                {details.seeds ? (t.speciesSeeds || "Seeds") : (t.speciesNoSeeds || "No Seeds")}
              </span>
            )}
            {details.thorny !== null && details.thorny !== undefined && (
              <span className="px-2 py-1 bg-secondary rounded text-xs flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {details.thorny ? (t.speciesThorny || "Thorny") : (t.speciesNotThorny || "Not Thorny")}
              </span>
            )}
            {details.invasive !== null && details.invasive !== undefined && (
              <span className="px-2 py-1 bg-destructive/20 text-destructive rounded text-xs flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {details.invasive ? (t.speciesInvasive || "Invasive") : (t.speciesNotInvasive || "Not Invasive")}
              </span>
            )}
            {details.medicinal && (
              <span className="px-2 py-1 bg-secondary rounded text-xs flex items-center gap-1">
                <Beaker className="h-3 w-3" />
                {t.speciesMedicinal || "Medicinal"}
              </span>
            )}
            {details.cuisine !== null && details.cuisine !== undefined && (
              <span className="px-2 py-1 bg-secondary rounded text-xs flex items-center gap-1">
                <Utensils className="h-3 w-3" />
                {details.cuisine ? (t.speciesCuisine || "Culinary Use") : (t.speciesNoCuisine || "No Culinary Use")}
              </span>
            )}
            {details.poisonous_to_humans && (
              <span className="px-2 py-1 bg-destructive/20 text-destructive rounded text-xs flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {t.speciesPoisonousHumans || "Poisonous to Humans"}
              </span>
            )}
            {details.poisonous_to_pets && (
              <span className="px-2 py-1 bg-destructive/20 text-destructive rounded text-xs flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {t.speciesPoisonousPets || "Poisonous to Pets"}
              </span>
            )}
          </div>

          {/* Care Guides */}
          {care_guides && care_guides.length > 0 && (
            <div className="pt-2 border-t border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="font-semibold">{t.speciesCareGuides || "Care Guides"}: </span>
              </div>
              <div className="space-y-3">
                {care_guides.map((guide, idx) => (
                  <div key={idx} className="pl-4 border-l-2 border-primary/20">
                    {guide.section && guide.section.map((section, sectionIdx) => (
                      <div key={sectionIdx} className="mb-3">
                        {section.type && (
                          <div className="font-medium text-base mb-1">
                            {section.type.split(' ').map(word => capitalizeFirst(word)).join(' ')}
                          </div>
                        )}
                        {section.description && (
                          <div className="text-muted-foreground">
                            <LongTextDisplay text={section.description} maxLength={100} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>
    );
  };

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
                style={{ borderRadius: "60% / 60%" }}
              />
            ) : (
              <div className="w-24 h-32 bg-secondary flex items-center justify-center rounded-full" style={{ borderRadius: "60% / 60%" }}>
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
                  {t.watered}: {new Date(plant.last_watered).toLocaleDateString("en-GB")}
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

        {plant.perenual_species_id && (
          <Collapsible open={isSpeciesOpen} onOpenChange={(open) => setIsSpeciesOpen(open)}>
            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                className="w-full mb-2"
                disabled={isLoadingSpecies}
              >
                <Info className="h-4 w-4 mr-2" />
                {isLoadingSpecies
                  ? (t.loadingSpecies || "Loading...")
                  : isSpeciesOpen
                  ? (t.hideSpeciesInfo || "Hide Species Information")
                  : (t.showSpeciesInfo || "Show Species Information")}
                {isSpeciesOpen ? (
                  <ChevronUp className="h-4 w-4 ml-2" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-2" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-4 mb-4 p-4 bg-secondary/50 rounded-lg border">
                {speciesData ? (
                  renderSpeciesInfo()
                ) : (
                  <div className="text-sm text-muted-foreground">
                    {t.speciesInfoNotAvailable || "Species information not available"}
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

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
