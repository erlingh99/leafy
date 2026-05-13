export interface Sensor {
  sensor_id: string;
  registered_at: string;
  last_seen_at: string;
  is_active: boolean;
}

export interface SensorAssignment {
  id: string;
  plant_id: string;
  plant_name: string;
  sensor_id: string;
  assigned_at: string;
}

export interface SensorReading {
  id: string;
  plant_id: string;
  sensor_id: string;
  level: number;
  recorded_at: string;
}

export interface WateringEvent {
  id: string;
  plant_id: string;
  watered_at: string;
}
