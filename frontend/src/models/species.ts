// Species interfaces
export interface Dimension {
  type?: string | null;
  min_value?: number | null;
  max_value?: number | null;
  unit?: string | null;
}

export interface Hardiness {
  min?: number | null;
  max?: number | null;
}

export interface WateringGeneralBenchmark {
  value?: string | null;
  unit?: string | null;
}

export interface PlantAnatomyItem {
  part?: string | null;
  color?: string[] | null;
}

export interface PruningCount {
  amount?: number | null;
  interval?: string | null;
}

export interface SpeciesDetailsResponse {
  common_name?: string | null;
  scientific_name?: string[] | null;
  other_name?: string[] | null;
  family?: string | null;
  hybrid?: boolean | null;
  authority?: string | null;
  subspecies?: string | null;
  cultivar?: string | null;
  variety?: string | null;
  species_epithet?: string | null;
  genus?: string | null;
  origin?: string[] | null;
  type?: string | null;
  dimensions?: Dimension[] | null;
  cycle?: string | null;
  attracts?: string[] | null;
  propagation?: string[] | null;
  hardiness?: Hardiness | null;
  watering?: string | null;
  watering_general_benchmark?: WateringGeneralBenchmark | null;
  plant_anatomy?: PlantAnatomyItem[] | null;
  sunlight?: string[] | null;
  pruning_month?: string[] | null;
  pruning_count?: PruningCount | null;
  seeds?: boolean | null;
  maintenance?: string | null;
  soil?: string[] | null;
  growth_rate?: string | null;
  drought_tolerant?: boolean | null;
  salt_tolerant?: boolean | null;
  thorny?: boolean | null;
  invasive?: boolean | null;
  tropical?: boolean | null;
  indoor?: boolean | null;
  care_level?: string | null;
  pest_susceptibility?: string[] | null;
  flowers?: boolean | null;
  flowering_season?: string | null;
  cones?: boolean | null;
  fruits?: boolean | null;
  edible_fruit?: boolean | null;
  harvest_season?: string | null;
  leaf?: boolean | null;
  edible_leaf?: boolean | null;
  cuisine?: boolean | null;
  medicinal?: boolean | null;
  poisonous_to_humans?: boolean | null;
  poisonous_to_pets?: boolean | null;
  description?: string | null;
}

export interface GuideSection {
  type?: string | null;
  description?: string | null;
}

export interface SpeciesGuideData {
  section?: GuideSection[];
}

export interface Species {
  perenual_id: number;
  details: SpeciesDetailsResponse;
  care_guides?: SpeciesGuideData;
  created_at?: string;
  updated_at?: string;
}