
export interface Plant {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  species: string;
  species_username: string | null;
  watering_interval: number;
  last_watered: string;
  image_url: string | null;
  thumbnail_url: string | null;
  perenual_species_id?: number | null;
}
