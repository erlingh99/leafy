import {
    Droplet, Sun, Cloud, Sprout, Heart, Thermometer, Leaf, Flower2, Apple,
    Beaker, AlertTriangle, Shield, BookOpen, Sparkles, TreePine,
    Globe, Bug, Scissors, MapPin, Ruler,
    Utensils, Cherry, CircleDot, Waves, Zap, ChevronUp, ChevronDown, Info
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Species } from "@/models/species";
import { Translations } from "@/translations/types";

interface SpeciesInfoPanelProps {
    speciesData: Species;
    t: Translations;
}

const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
};

export const LongTextDisplay = ({ text, maxLength, t }: { text: string; maxLength: number; t: Translations }) => {
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
                                <span className="text-xs">{t.less}</span>
                                <ChevronUp className="h-3 w-3 ml-1" />
                            </>
                        ) : (
                            <>
                                <span className="text-xs">{t.more}</span>
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

export const SpeciesInfoPanel = ({ speciesData, t }: SpeciesInfoPanelProps) => {
    const [hardinessMapUrl, setHardinessMapUrl] = useState<string | null>(null);
    const [isLoadingMap, setIsLoadingMap] = useState(false);
    const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
    const hasLoadedMapRef = useRef(false);

    const { details, care_guides } = speciesData;

    // Reset map URL when species data changes
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHardinessMapUrl(null);
        setIsLoadingMap(false);
        setIsMapDialogOpen(false);
        hasLoadedMapRef.current = false;
    }, [speciesData.perenual_id]);

    // Reset map ref when dialog closes
    useEffect(() => {
        if (!isMapDialogOpen) {
            hasLoadedMapRef.current = false;
        }
    }, [isMapDialogOpen]);

    // Load map when dialog opens
    useEffect(() => {
        if (isMapDialogOpen && !hardinessMapUrl && !isLoadingMap && speciesData.perenual_id && !hasLoadedMapRef.current) {
            hasLoadedMapRef.current = true;
            setIsLoadingMap(true);
            const mapUrl = `/api/plants/species/${speciesData.perenual_id}/hardiness-map`;
            setHardinessMapUrl(mapUrl);
        }
    }, [isMapDialogOpen, speciesData.perenual_id, hardinessMapUrl, isLoadingMap]);

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
                        <LongTextDisplay text={details.description} maxLength={80} t={t} />
                    </div>
                </div>
            )}

            {/* Care Information */}
            <div className="space-y-2 pt-2 border-t border-border/50">
                {details.watering && (
                    <div className="flex items-center gap-2">
                        <Droplet className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <span className="font-semibold">{t.speciesWatering || "Watering"}: </span>
                        <LongTextDisplay text={details.watering} maxLength={40} t={t} />
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
                        <LongTextDisplay text={details.maintenance} maxLength={40} t={t} />
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
                {details.hardiness && details.hardiness.min && details.hardiness.max && (
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <span className="font-semibold">{t.speciesHardinessLocation || "Hardiness Location"}: </span>
                        <Dialog open={isMapDialogOpen} onOpenChange={setIsMapDialogOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="link"
                                    size="sm"
                                    className="h-auto p-0 text-primary"
                                >
                                    {t.speciesViewMap || "View Map"}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                                <DialogHeader>
                                    <DialogTitle>
                                        {t.speciesHardinessLocation || "Hardiness Location Map"}
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="flex items-center justify-center relative min-h-[200px]">
                                    {hardinessMapUrl ? (
                                        <>
                                            {isLoadingMap && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-lg">
                                                    <div className="text-muted-foreground">
                                                        {t.loading || "Loading..."}
                                                    </div>
                                                </div>
                                            )}
                                            <img
                                                src={hardinessMapUrl}
                                                alt={t.speciesHardinessLocation || "Hardiness Location Map"}
                                                className="w-full h-auto rounded-lg"
                                                onLoad={() => {
                                                    setIsLoadingMap(false);
                                                }}
                                                onError={() => {
                                                    setHardinessMapUrl(null);
                                                    setIsLoadingMap(false);
                                                }}
                                            />
                                        </>
                                    ) : (
                                        <div className="py-8 text-muted-foreground">
                                            {isLoadingMap ? (t.loading || "Loading...") : (t.errorLoadingMap || "Failed to load map")}
                                        </div>
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>
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
                    <span className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${details.edible_fruit ? "bg-green-600/20 text-green-600" : "bg-secondary"}`}>
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
                    <span className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${details.edible_leaf ? "bg-green-600/20 text-green-600" : "bg-secondary"}`}>
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
                    <span className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${details.invasive ? "bg-destructive/20 text-destructive" : "bg-secondary"}`}>
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
                    <span className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${details.cuisine ? "bg-green-600/20 text-green-600" : "bg-secondary"}`}>
                        <Utensils className="h-3 w-3" />
                        {details.cuisine ? (t.speciesCuisine || "Culinary Use") : (t.speciesNoCuisine || "No Culinary Use")}
                    </span>
                )}
                {details.poisonous_to_humans !== null && details.poisonous_to_humans !== undefined && (
                    <span className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${details.poisonous_to_humans ? "bg-destructive/20 text-destructive" : "bg-secondary"}`}>
                        <AlertTriangle className="h-3 w-3" />
                        {details.poisonous_to_humans ? (t.speciesPoisonousHumans || "Poisonous to Humans") : (t.speciesNotPoisonousHumans || "Safe for Humans")}
                    </span>
                )}
                {details.poisonous_to_pets !== null && details.poisonous_to_pets !== undefined && (
                    <span className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${details.poisonous_to_pets ? "bg-destructive/20 text-destructive" : "bg-secondary"}`}>
                        <AlertTriangle className="h-3 w-3" />
                        {details.poisonous_to_pets ? (t.speciesPoisonousPets || "Poisonous to Pets") : (t.speciesNotPoisonousPets || "Safe for Pets")}
                    </span>
                )}
            </div>

            {/* Care Guides */}
            {care_guides && (
                <div className="pt-2 border-t border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="font-semibold">{t.speciesCareGuides || "Care Guides"}: </span>
                    </div>
                    <div className="space-y-3">
                        <div key={1} className="pl-4 border-l-2 border-primary/20">
                            {care_guides.section && care_guides.section.map((section, sectionIdx) => (
                                <div key={sectionIdx} className="mb-3">
                                    {section.type && (
                                        <div className="font-medium text-base mb-1">
                                            {section.type.split(' ').map(word => capitalizeFirst(word)).join(' ')}
                                        </div>
                                    )}
                                    {section.description && (
                                        <div className="text-muted-foreground">
                                            <LongTextDisplay text={section.description} maxLength={100} t={t} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
