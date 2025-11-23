
export interface Plant {
  id: string;
  user_id: string;
  name: string;
  species: string;
  species_username: string | null;
  watering_interval: number;
  last_watered: string;
  image?: string;
  perenual_species_id?: number | null;
}
