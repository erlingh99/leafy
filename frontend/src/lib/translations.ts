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
  | "menu";

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
  },
};
