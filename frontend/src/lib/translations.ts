export type Language = "en" | "sv";

type StaticTranslationKeys =
  | "appTitle"
  | "appSubtitle"
  | "addPlant"
  | "editPlant"
  | "addNewPlant"
  | "updatePlant"
  | "noPlantsYet"
  | "noPlantsDescription"
  | "addYourFirstPlant"
  | "plantName"
  | "plantNamePlaceholder"
  | "species"
  | "speciesPlaceholder"
  | "wateringInterval"
  | "plantPhoto"
  | "clickToUpload"
  | "water"
  | "edit"
  | "delete"
  | "deleteConfirmTitle"
  | "deleteConfirmDescription"
  | "cancel"
  | "watered"
  | "nextWatering"
  | "overdue"
  | "day"
  | "days"
  | "subscribe"
  | "unsubscribe"
  | "loading"
  | "missingInfo"
  | "fillAllFields"
  | "invalidInterval"
  | "invalidIntervalDescription"
  | "imageTooLarge"
  | "imageTooLargeDescription"
  | "plantAdded"
  | "plantUpdated"
  | "plantWatered"
  | "plantDeleted"
  | "subscriptionAdded"
  | "subscriptionUpdated"
  | "subscriptionDeleted"
  | "errorAddingSubscription"
  | "errorUpdatingSubscription"
  | "errorDeletingSubscription"
  | "errorLoadingSubscription"
  | "errorLoading"
  | "errorAdding"
  | "errorUpdating"
  | "errorWatering"
  | "errorDeleting"
  | "error"
  | "subscriptionManageButton"
  | "subscriptionManageTitle"
  | "subscriptionManageDescription"
  | "subscriptionNamePlaceholder"
  | "subscriptionEmailPlaceholder"
  | "subscriptionAdd"
  | "subscriptionEdit"
  | "subscriptionDelete"
  | "subscriptionClose"
  | "subscriptionSave"
  | "menu"
  | "showSpeciesInfo"
  | "hideSpeciesInfo"
  | "loadingSpecies"
  | "speciesInfoNotAvailable"
  | "errorLoadingSpecies"
  | "speciesCommonName"
  | "speciesScientificName"
  | "speciesFamily"
  | "speciesGenus"
  | "speciesDescription"
  | "speciesWatering"
  | "speciesWateringBenchmark"
  | "speciesSunlight"
  | "speciesSoil"
  | "speciesGrowthRate"
  | "speciesCareLevel"
  | "speciesHardiness"
  | "speciesPropagation"
  | "speciesCycle"
  | "speciesOtherName"
  | "speciesEpithet"
  | "speciesSubspecies"
  | "speciesAuthority"
  | "speciesVariety"
  | "speciesCultivar"
  | "speciesType"
  | "speciesOrigin"
  | "speciesHybrid"
  | "speciesMaintenance"
  | "speciesDimensions"
  | "speciesAttracts"
  | "speciesPruningMonth"
  | "speciesPruningCount"
  | "speciesPestSusceptibility"
  | "speciesFloweringSeason"
  | "speciesHarvestSeason"
  | "speciesPlantAnatomy"
  | "speciesHardinessLocation"
  | "speciesViewMap"
  | "speciesSaltTolerant"
  | "speciesNotSaltTolerant"
  | "speciesTropical"
  | "speciesNotTropical"
  | "speciesEdibleFruit"
  | "speciesNotEdibleFruit"
  | "speciesEdibleLeaf"
  | "speciesNotEdibleLeaf"
  | "speciesCones"
  | "speciesNoCones"
  | "speciesSeeds"
  | "speciesNoSeeds"
  | "speciesThorny"
  | "speciesNotThorny"
  | "speciesInvasive"
  | "speciesNotInvasive"
  | "speciesCuisine"
  | "speciesNoCuisine"
  | "speciesLeaf"
  | "speciesNoLeaf"
  | "speciesDroughtTolerant"
  | "speciesNotDroughtTolerant"
  | "speciesIndoor"
  | "speciesOutdoor"
  | "speciesFlowers"
  | "speciesFruits"
  | "speciesMedicinal"
  | "speciesPoisonousHumans"
  | "speciesPoisonousPets"
  | "speciesCareGuides"
  | "loadingPlants"
  | "addingPlant"
  | "updatingPlant"
  | "wateringPlant"
  | "deletingPlant"
  | "loadingSubscriptions"
  | "addingSubscription"
  | "updatingSubscription"
  | "deletingSubscription";

type FunctionTranslationKeys =
  | "plantAddedDescription"
  | "plantUpdatedDescription"
  | "plantWateredDescription"
  | "plantDeletedDescription"
  | "subscriptionAddedDescription"
  | "subscriptionUpdatedDescription"
  | "subscriptionDeletedDescription"

export type Translations = {
  [key in StaticTranslationKeys]: string;
} & {
  [key in FunctionTranslationKeys]: (...args: string[]) => string;
};

export type TranslationDictionary = {
  [language in Language]: Translations;
};

export const translations: TranslationDictionary = {
  en: {
    appTitle: "🌱 Plant Care Tracker",
    appSubtitle: "Never forget to water your plants again",
    addPlant: "Add Plant",
    editPlant: "Edit Plant",
    addNewPlant: "Add New Plant",
    updatePlant: "Update Plant",
    noPlantsYet: "No plants yet",
    noPlantsDescription: "Start by adding your first plant to track its watering schedule",
    addYourFirstPlant: "Add Your First Plant",
    plantName: "Plant Name",
    plantNamePlaceholder: "e.g., Monstera",
    species: "Species",
    speciesPlaceholder: "e.g., Monstera deliciosa",
    wateringInterval: "Watering Interval (days)",
    plantPhoto: "Plant Photo (optional)",
    clickToUpload: "Click to upload a photo",
    water: "Water",
    edit: "Edit",
    delete: "Delete",
    deleteConfirmTitle: "Are you sure?",
    deleteConfirmDescription: "This will permanently delete this plant. This action cannot be undone.",
    cancel: "Cancel",
    watered: "Watered",
    nextWatering: "Next watering",
    overdue: "Overdue",
    day: "day",
    days: "days",
    subscribe: "Subscribe",
    unsubscribe: "Unsubscribe",
    loading: "Loading...",
    // Toast messages
    missingInfo: "Missing information",
    fillAllFields: "Please fill in all fields",
    invalidInterval: "Invalid watering interval",
    invalidIntervalDescription: "Please enter a valid number of days (at least 1)",
    imageTooLarge: "Image too large",
    imageTooLargeDescription: "Please select an image smaller than 5MB",
    plantAdded: "Plant added!",
    plantAddedDescription: (name: string) => `${name} has been added to your garden`,
    plantUpdated: "Plant updated!",
    plantUpdatedDescription: (name: string) => `${name} has been updated`,
    plantWatered: "Plant watered!",
    plantWateredDescription: (name: string) => `${name} has been watered`,
    plantDeleted: "Plant deleted",
    plantDeletedDescription: (name: string) => `${name} has been removed`,
    errorLoadingSubscription: "Error loading subscriptions",
    errorAddingSubscription: "Error adding subscription",
    errorUpdatingSubscription: "Error updating subscription",
    errorDeletingSubscription: "Error deleting subscription",
    errorLoading: "Error loading plants",
    errorAdding: "Error adding plant",
    errorUpdating: "Error updating plant",
    errorWatering: "Error watering plant",
    errorDeleting: "Error deleting plant",
    error: "Error",
    subscriptionAddedDescription: (name: string) => `Subscription for ${name} has been added`,
    subscriptionUpdatedDescription: (name: string) => `Subscription for ${name} has been updated`,
    subscriptionDeletedDescription: (name: string) => `Subscription for ${name} has been deleted`,
    subscriptionAdded: "Subscription added",
    subscriptionUpdated: "Subscription updated",
    subscriptionDeleted: "Subscription deleted",
    subscriptionManageButton: "Manage Subscriptions",
    subscriptionManageTitle: "Manage Subscriptions",
    subscriptionManageDescription: "Add, edit, or delete your subscriptions.",
    subscriptionNamePlaceholder: "Name",
    subscriptionEmailPlaceholder: "Email",
    subscriptionAdd: "Add",
    subscriptionEdit: "Edit",
    subscriptionDelete: "Delete",
    subscriptionClose: "Close",
    subscriptionSave: "Save",
    menu: "Menu",
    showSpeciesInfo: "Show Species Information",
    hideSpeciesInfo: "Hide Species Information",
    loadingSpecies: "Loading species information...",
    speciesInfoNotAvailable: "Species information not available",
    errorLoadingSpecies: "Error loading species information",
    speciesCommonName: "Common Name",
    speciesScientificName: "Scientific Name",
    speciesFamily: "Family",
    speciesGenus: "Genus",
    speciesDescription: "Description",
    speciesWatering: "Watering",
    speciesWateringBenchmark: "Watering Benchmark",
    speciesSunlight: "Sunlight",
    speciesSoil: "Soil",
    speciesGrowthRate: "Growth Rate",
    speciesCareLevel: "Care Level",
    speciesHardiness: "Hardiness",
    speciesPropagation: "Propagation",
    speciesCycle: "Cycle",
    speciesOtherName: "Other Names",
    speciesEpithet: "Species Epithet",
    speciesAuthority: "Authority",
    speciesSubspecies: "Subspecies",
    speciesVariety: "Variety",
    speciesCultivar: "Cultivar",
    speciesHybrid: "Hybrid",
    speciesType: "Type",
    speciesOrigin: "Origin",
    speciesMaintenance: "Maintenance",
    speciesDimensions: "Dimensions",
    speciesAttracts: "Attracts",
    speciesPruningMonth: "Pruning Month",
    speciesPruningCount: "Pruning",
    speciesPestSusceptibility: "Pest Susceptibility",
    speciesFloweringSeason: "Flowering Season",
    speciesHarvestSeason: "Harvest Season",
    speciesPlantAnatomy: "Plant Anatomy",
    speciesHardinessLocation: "Hardiness Location",
    speciesViewMap: "View Map",
    speciesDroughtTolerant: "Drought Tolerant",
    speciesNotDroughtTolerant: "Not Drought Tolerant",
    speciesSaltTolerant: "Salt Tolerant",
    speciesNotSaltTolerant: "Not Salt Tolerant",
    speciesTropical: "Tropical",
    speciesNotTropical: "Not Tropical",
    speciesIndoor: "Indoor",
    speciesOutdoor: "Outdoor",
    speciesFlowers: "Flowers",
    speciesFruits: "Fruits",
    speciesEdibleFruit: "Edible Fruit",
    speciesNotEdibleFruit: "Not Edible Fruit",
    speciesLeaf: "Has Leaves",
    speciesNoLeaf: "No Leaves",
    speciesEdibleLeaf: "Edible Leaf",
    speciesNotEdibleLeaf: "Not Edible Leaf",
    speciesCones: "Cones",
    speciesNoCones: "No Cones",
    speciesSeeds: "Seeds",
    speciesNoSeeds: "No Seeds",
    speciesThorny: "Thorny",
    speciesNotThorny: "Not Thorny",
    speciesInvasive: "Invasive",
    speciesNotInvasive: "Not Invasive",
    speciesMedicinal: "Medicinal",
    speciesCuisine: "Culinary Use",
    speciesNoCuisine: "No Culinary Use",
    speciesPoisonousHumans: "Poisonous to Humans",
    speciesPoisonousPets: "Poisonous to Pets",
    speciesCareGuides: "Care Guides",
    loadingPlants: "Loading plants...",
    addingPlant: "Adding plant...",
    updatingPlant: "Updating plant...",
    wateringPlant: "Watering plant...",
    deletingPlant: "Deleting plant...",
    loadingSubscriptions: "Loading subscriptions...",
    addingSubscription: "Adding subscription...",
    updatingSubscription: "Updating subscription...",
    deletingSubscription: "Deleting subscription...",
  },
  sv: {
    appTitle: "🌱 Växtskötsel Tracker",
    appSubtitle: "Glöm aldrig att vattna dina växter igen",
    addPlant: "Lägg till växt",
    editPlant: "Redigera växt",
    addNewPlant: "Lägg till ny växt",
    updatePlant: "Uppdatera växt",
    noPlantsYet: "Inga växter än",
    noPlantsDescription: "Börja med att lägga till din första växt för att spåra dess vattningsschema",
    addYourFirstPlant: "Lägg till din första växt",
    plantName: "Växtnamn",
    plantNamePlaceholder: "t.ex., Monstera",
    species: "Art",
    speciesPlaceholder: "t.ex., Monstera deliciosa",
    wateringInterval: "Vattningsintervall (dagar)",
    plantPhoto: "Växtfoto (valfritt)",
    clickToUpload: "Klicka för att ladda upp ett foto",
    water: "Vattna",
    edit: "Redigera",
    delete: "Ta bort",
    deleteConfirmTitle: "Är du säker?",
    deleteConfirmDescription: "Detta kommer permanent ta bort denna växt. Denna åtgärd kan inte ångras.",
    cancel: "Avbryt",
    watered: "Vattnad",
    nextWatering: "Nästa vattning",
    overdue: "Försenad",
    day: "dag",
    days: "dagar",
    subscribe: "Prenumerera",
    unsubscribe: "Avsluta prenumeration",
    loading: "Laddar...",
    // Toast messages
    missingInfo: "Information saknas",
    fillAllFields: "Vänligen fyll i alla fält",
    invalidInterval: "Ogiltigt vattningsintervall",
    invalidIntervalDescription: "Vänligen ange ett giltigt antal dagar (minst 1)",
    imageTooLarge: "Bilden är för stor",
    imageTooLargeDescription: "Vänligen välj en bild mindre än 5MB",
    plantAdded: "Växt tillagd!",
    plantAddedDescription: (name: string) => `${name} har lagts till i din trädgård`,
    plantUpdated: "Växt uppdaterad!",
    plantUpdatedDescription: (name: string) => `${name} har uppdaterats`,
    plantWatered: "Växt vattnad!",
    plantWateredDescription: (name: string) => `${name} har vattnats`,
    plantDeleted: "Växt borttagen",
    plantDeletedDescription: (name: string) => `${name} har tagits bort`,
    errorLoading: "Fel vid laddning av växter",
    errorAdding: "Fel vid tillägg av växt",
    errorLoadingSubscription: "Fel vid laddning av prenumerationer",
    errorAddingSubscription: "Fel vid tillägg av prenumeration",
    errorUpdatingSubscription: "Fel vid uppdatering av prenumeration",
    errorDeletingSubscription: "Fel vid borttagning av prenumeration",
    errorUpdating: "Fel vid uppdatering av växt",
    errorWatering: "Fel vid vattning av växt",
    errorDeleting: "Fel vid borttagning av växt",
    error: "Fel",
    subscriptionAddedDescription: (name: string) => `Prenumeration för ${name} har blivit tillagd`,
    subscriptionUpdatedDescription: (name: string) => `Prenumeration för ${name} har blivit uppdaterad`,
    subscriptionDeletedDescription: (name: string) => `Prenumeration för ${name} har blivit borttagen`,
    subscriptionAdded: "Prenumeration tillagd",
    subscriptionUpdated: "Prenumeration uppdaterad",
    subscriptionDeleted: "Prenumeration borttagen",
    subscriptionManageButton: "Hantera prenumerationer",
    subscriptionManageTitle: "Hantera prenumerationer",
    subscriptionManageDescription: "Lägg till, redigera eller ta bort dina prenumerationer.",
    subscriptionNamePlaceholder: "Namn",
    subscriptionEmailPlaceholder: "E-post",
    subscriptionAdd: "Lägg till",
    subscriptionEdit: "Redigera",
    subscriptionDelete: "Ta bort",
    subscriptionClose: "Stäng",
    subscriptionSave: "Spara",
    menu: "Meny",
    showSpeciesInfo: "Visa artinformation",
    hideSpeciesInfo: "Dölj artinformation",
    loadingSpecies: "Laddar artinformation...",
    speciesInfoNotAvailable: "Artinformation är inte tillgänglig",
    errorLoadingSpecies: "Fel vid laddning av artinformation",
    speciesCommonName: "Vanligt namn",
    speciesScientificName: "Vetenskapligt namn",
    speciesFamily: "Familj",
    speciesGenus: "Släkte",
    speciesDescription: "Beskrivning",
    speciesWatering: "Vattning",
    speciesWateringBenchmark: "Vattningsmått",
    speciesSunlight: "Solljus",
    speciesSoil: "Jord",
    speciesGrowthRate: "Tillväxthastighet",
    speciesCareLevel: "Skötselnivå",
    speciesHardiness: "Hårdhet",
    speciesPropagation: "Förökning",
    speciesCycle: "Cykel",
    speciesOtherName: "Andra namn",
    speciesEpithet: "Artepitet",
    speciesAuthority: "Auktoritet",
    speciesSubspecies: "Underart",
    speciesVariety: "Varietet",
    speciesCultivar: "Sort",
    speciesHybrid: "Hybrid",
    speciesType: "Typ",
    speciesOrigin: "Ursprung",
    speciesMaintenance: "Underhåll",
    speciesDimensions: "Dimensioner",
    speciesAttracts: "Lockar",
    speciesPruningMonth: "Beskärningsmånad",
    speciesPruningCount: "Beskärning",
    speciesPestSusceptibility: "Skadegörare",
    speciesFloweringSeason: "Blomningssäsong",
    speciesHarvestSeason: "Skördesäsong",
    speciesPlantAnatomy: "Växtanatomi",
    speciesHardinessLocation: "Hårdhetszon",
    speciesViewMap: "Visa karta",
    speciesDroughtTolerant: "Torktålig",
    speciesNotDroughtTolerant: "Inte torktålig",
    speciesSaltTolerant: "Saltolerant",
    speciesNotSaltTolerant: "Inte saltolerant",
    speciesTropical: "Tropisk",
    speciesNotTropical: "Inte tropisk",
    speciesIndoor: "Inomhus",
    speciesOutdoor: "Utomhus",
    speciesFlowers: "Blommor",
    speciesFruits: "Frukter",
    speciesEdibleFruit: "Ätbar frukt",
    speciesNotEdibleFruit: "Inte ätbar frukt",
    speciesLeaf: "Har blad",
    speciesNoLeaf: "Inga blad",
    speciesEdibleLeaf: "Ätbar blad",
    speciesNotEdibleLeaf: "Inte ätbar blad",
    speciesCones: "Kottar",
    speciesNoCones: "Inga kottar",
    speciesSeeds: "Frön",
    speciesNoSeeds: "Inga frön",
    speciesThorny: "Taggig",
    speciesNotThorny: "Inte taggig",
    speciesInvasive: "Invasiv",
    speciesNotInvasive: "Inte invasiv",
    speciesMedicinal: "Medicinsk",
    speciesCuisine: "Kulinarisk användning",
    speciesNoCuisine: "Ingen kulinarisk användning",
    speciesPoisonousHumans: "Giftig för människor",
    speciesPoisonousPets: "Giftig för husdjur",
    speciesCareGuides: "Skötselguider",
    loadingPlants: "Laddar växter...",
    addingPlant: "Lägger till växt...",
    updatingPlant: "Uppdaterar växt...",
    wateringPlant: "Vattnar växt...",
    deletingPlant: "Tar bort växt...",
    loadingSubscriptions: "Laddar prenumerationer...",
    addingSubscription: "Lägger till prenumeration...",
    updatingSubscription: "Uppdaterar prenumeration...",
    deletingSubscription: "Tar bort prenumeration...",
  },
};
