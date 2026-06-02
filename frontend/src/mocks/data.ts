import { Plant } from "@/models/plant";
import { Sensor, SensorAssignment, SensorReading, WateringEvent } from "@/models/sensor";
import { Species } from "@/models/species";
import { Subscription } from "@/models/subscription";

const now = new Date();
const daysAgo = (n: number) =>
  new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString();
const hoursAgo = (n: number) =>
  new Date(now.getTime() - n * 60 * 60 * 1000).toISOString();

// ── Plants ──────────────────────────────────────────────────────────────────

export const mockPlants: Plant[] = [
  {
    id: "plant-1",
    created_at: daysAgo(60),
    updated_at: daysAgo(3),
    name: "Monstera Deliciosa",
    species: "Monstera deliciosa",
    species_username: null,
    watering_interval: 7,
    last_watered: daysAgo(3),
    image_url: null,
    thumbnail_url: null,
    perenual_species_id: null,
    sensor_id: "sensor-1",
    moisture_level: 72,
    moisture_updated_at: hoursAgo(2),
  },
  {
    id: "plant-2",
    created_at: daysAgo(45),
    updated_at: daysAgo(8),
    name: "Peace Lily",
    species: "Spathiphyllum wallisii",
    species_username: null,
    watering_interval: 5,
    last_watered: daysAgo(8),  // overdue by 3 days
    image_url: null,
    thumbnail_url: null,
    perenual_species_id: null,
    sensor_id: null,
    moisture_level: null,
    moisture_updated_at: null,
  },
  {
    id: "plant-3",
    created_at: daysAgo(90),
    updated_at: daysAgo(6),
    name: "Snake Plant",
    species: "Dracaena trifasciata",
    species_username: null,
    watering_interval: 14,
    last_watered: daysAgo(6),
    image_url: null,
    thumbnail_url: null,
    perenual_species_id: 1428,
    sensor_id: null,
    moisture_level: null,
    moisture_updated_at: null,
  },
];

// ── Moisture history (plant-1, 30 days, reading every 6 hours) ──────────────
// Watering events create step-ups; moisture drops linearly between waterings.

const wateringTimestamps = [3, 10, 17, 24].map(
  (d) => now.getTime() - d * 86_400_000
);

export const mockMoistureReadings: SensorReading[] = (() => {
  const readings: SensorReading[] = [];
  const totalReadings = 120; // 30 days × 4 readings/day

  for (let i = totalReadings; i >= 0; i--) {
    const ts = now.getTime() - i * 6 * 60 * 60 * 1000;

    const lastWatering = wateringTimestamps
      .filter((wt) => wt <= ts)
      .reduce((max, wt) => Math.max(max, wt), ts - 31 * 86_400_000);

    const daysSince = (ts - lastWatering) / 86_400_000;
    const base = Math.max(25, 85 - (daysSince / 7) * 60);
    const noise = Math.sin(i * 1.7) * 4;
    const level = Math.round(Math.max(15, Math.min(95, base + noise)) * 10) / 10;

    readings.push({
      id: `reading-${i}`,
      plant_id: "plant-1",
      sensor_id: "sensor-1",
      level,
      recorded_at: new Date(ts).toISOString(),
    });
  }
  return readings;
})();

// ── Watering events ──────────────────────────────────────────────────────────

export const mockWateringEvents: WateringEvent[] = [
  // plant-1: every 7 days
  { id: "we-1-1", plant_id: "plant-1", watered_at: daysAgo(3) },
  { id: "we-1-2", plant_id: "plant-1", watered_at: daysAgo(10) },
  { id: "we-1-3", plant_id: "plant-1", watered_at: daysAgo(17) },
  { id: "we-1-4", plant_id: "plant-1", watered_at: daysAgo(24) },
  // plant-2: every 5 days
  { id: "we-2-1", plant_id: "plant-2", watered_at: daysAgo(8) },
  { id: "we-2-2", plant_id: "plant-2", watered_at: daysAgo(13) },
  { id: "we-2-3", plant_id: "plant-2", watered_at: daysAgo(18) },
  { id: "we-2-4", plant_id: "plant-2", watered_at: daysAgo(23) },
  // plant-3: every 14 days
  { id: "we-3-1", plant_id: "plant-3", watered_at: daysAgo(6) },
  { id: "we-3-2", plant_id: "plant-3", watered_at: daysAgo(20) },
];

// ── Sensors & assignments ────────────────────────────────────────────────────

export const mockSensors: Sensor[] = [
  {
    sensor_id: "sensor-1",
    registered_at: daysAgo(60),
    last_seen_at: hoursAgo(1),
    is_active: true,
    adc_dry: null,
    adc_wet: null,
  },
];

export const mockSensorAssignments: SensorAssignment[] = [
  {
    id: "assignment-1",
    plant_id: "plant-1",
    plant_name: "Monstera Deliciosa",
    sensor_id: "sensor-1",
    assigned_at: daysAgo(55),
  },
];

// ── Species ──────────────────────────────────────────────────────────────────

export const mockSpecies: Species = {
  perenual_id: 1428,
  details: {
    common_name: "Snake Plant",
    scientific_name: ["Dracaena trifasciata"],
    other_name: ["Mother-in-law's Tongue", "Viper's Bowstring Hemp"],
    family: "Asparagaceae",
    origin: ["West Africa"],
    type: "Succulent",
    dimensions: [{ type: "Height", min_value: 60, max_value: 120, unit: "cm" }],
    cycle: "Perennial",
    watering: "Minimum",
    watering_general_benchmark: { value: "2-6", unit: "weeks" },
    sunlight: ["part shade", "full sun"],
    maintenance: "Low",
    care_level: "Easy",
    growth_rate: "Low",
    drought_tolerant: true,
    salt_tolerant: false,
    thorny: false,
    invasive: false,
    tropical: false,
    indoor: true,
    flowers: false,
    leaf: true,
    poisonous_to_humans: false,
    poisonous_to_pets: true,
    description:
      "The snake plant is one of the most forgiving houseplants. It thrives on neglect, tolerates low light, and only needs watering every few weeks. Its upright, sword-shaped leaves with distinctive banding make it a striking addition to any room.",
    soil: ["well-drained"],
    attracts: [],
    propagation: ["Division", "Leaf cuttings"],
    hardiness: { min: 10, max: 12 },
    pest_susceptibility: ["Spider mites", "Mealybugs"],
  },
  care_guides: {
    section: [
      {
        type: "Watering",
        description:
          "Allow the soil to dry out completely between waterings. Water every 2–6 weeks, reducing frequency in winter. Overwatering is the most common cause of death for this plant.",
      },
      {
        type: "Sunlight",
        description:
          "Thrives in bright indirect light but tolerates low light conditions well. Avoid prolonged direct sunlight, which can scorch the leaves.",
      },
      {
        type: "Fertilizing",
        description:
          "Feed with a balanced liquid fertilizer once a month during spring and summer. Do not fertilize in autumn or winter.",
      },
      {
        type: "Soil",
        description:
          "Use a well-draining cactus or succulent potting mix. Good drainage is essential to prevent root rot.",
      },
    ],
  },
  created_at: daysAgo(30),
  updated_at: daysAgo(1),
};

// ── Subscriptions ────────────────────────────────────────────────────────────

export const mockSubscriptions: Subscription[] = [];
