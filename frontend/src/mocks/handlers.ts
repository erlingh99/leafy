import { http, HttpResponse, delay } from "msw";
import {
  mockPlants,
  mockMoistureReadings,
  mockWateringEvents,
  mockSensors,
  mockSensorAssignments,
  mockSubscriptions,
  mockSpecies,
} from "./data";
import { Plant } from "@/models/plant";
import { SensorAssignment } from "@/models/sensor";
import { Subscription } from "@/models/subscription";

// Mutable in-memory state — mutations update these arrays (const: arrays are mutated, not reassigned)
const plants = mockPlants.map((p) => ({ ...p }));
const sensorAssignments = mockSensorAssignments.map((a) => ({ ...a }));
const subscriptions = mockSubscriptions.map((s) => ({ ...s }));
const nextWateringEvents = mockWateringEvents.map((e) => ({ ...e }));

const now = () => new Date().toISOString();

// ── Throttle ──────────────────────────────────────────────────────────────────
// Set VITE_MOCK_DELAY=<ms> in .env.mock to simulate slow networks.

const MOCK_DELAY = Number(import.meta.env.VITE_MOCK_DELAY ?? 0);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function withDelay<T extends (...args: any[]) => any>(resolver: T): T {
  if (MOCK_DELAY <= 0) return resolver;
  return (async (...args: Parameters<T>) => {
    await delay(MOCK_DELAY);
    return resolver(...args);
  }) as T;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function daysFilter(url: URL, defaultDays = 30) {
  return parseInt(url.searchParams.get("days") ?? String(defaultDays));
}

function cutoff(days: number) {
  return new Date(Date.now() - days * 86_400_000);
}

// ── Handlers (more-specific routes first) ────────────────────────────────────

export const handlers = [
  // Water all overdue plants (or all if none overdue)
  http.post("/api/plants/water/all", withDelay(() => {
    const nowStr = now();
    const overdues = plants.filter((p) => {
      const next = new Date(p.last_watered).getTime() + p.watering_interval * 86_400_000;
      return next <= Date.now();
    });
    const toWater = overdues.length > 0 ? overdues : plants;
    toWater.forEach((p) => {
      const plant = plants.find((x) => x.id === p.id);
      if (plant) {
        plant.last_watered = nowStr;
        plant.updated_at = nowStr;
        nextWateringEvents.push({
          id: `we-${plant.id}-${Date.now()}`,
          plant_id: plant.id,
          watered_at: nowStr,
        });
      }
    });
    return new HttpResponse(null, { status: 200 });
  })),

  // Water single plant
  http.post("/api/plants/water/:id", withDelay(({ params }) => {
    const plant = plants.find((p) => p.id === params.id);
    if (!plant) return new HttpResponse(null, { status: 404 });
    plant.last_watered = now();
    plant.updated_at = now();
    nextWateringEvents.push({
      id: `we-${plant.id}-${Date.now()}`,
      plant_id: plant.id,
      watered_at: plant.last_watered,
    });
    return new HttpResponse(null, { status: 200 });
  })),

  // Species info (before /:plantId to avoid collision)
  http.get("/api/plants/species/:perenualId", withDelay(({ params }) => {
    const id = Number(params.perenualId);
    if (id === mockSpecies.perenual_id) return HttpResponse.json(mockSpecies);
    return new HttpResponse(null, { status: 404 });
  })),

  // Moisture history for a plant
  http.get("/api/plants/:plantId/moisture-history", withDelay(({ params, request }) => {
    const days = daysFilter(new URL(request.url));
    const since = cutoff(days);
    const readings = mockMoistureReadings.filter(
      (r) => r.plant_id === params.plantId && new Date(r.recorded_at) >= since
    );
    return HttpResponse.json(readings);
  })),

  // Watering history for a plant
  http.get("/api/plants/:plantId/watering-history", withDelay(({ params, request }) => {
    const days = daysFilter(new URL(request.url));
    const since = cutoff(days);
    const events = nextWateringEvents.filter(
      (e) => e.plant_id === params.plantId && new Date(e.watered_at) >= since
    );
    return HttpResponse.json(events);
  })),

  // Single plant (used for species-id polling after add/edit)
  http.get("/api/plants/:plantId", withDelay(({ params }) => {
    const plant = plants.find((p) => p.id === params.plantId);
    if (!plant) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(plant);
  })),

  // Update plant
  http.patch("/api/plants/:plantId", withDelay(async ({ params, request }) => {
    const plant = plants.find((p) => p.id === params.plantId);
    if (!plant) return new HttpResponse(null, { status: 404 });
    const body = (await request.json()) as Partial<Plant>;
    Object.assign(plant, body, { updated_at: now() });
    return HttpResponse.json(plant);
  })),

  // Delete plant
  http.delete("/api/plants/:plantId", withDelay(({ params }) => {
    const idx = plants.findIndex((p) => p.id === params.plantId);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    plants.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  })),

  // List plants
  http.get("/api/plants", withDelay(() => HttpResponse.json(plants))),

  // Add plant
  http.put("/api/plants", withDelay(async ({ request }) => {
    const body = (await request.json()) as {
      name: string;
      species: string;
      species_username: string | null;
      watering_interval: number;
      last_watered: string;
    };
    const newPlant: Plant = {
      id: crypto.randomUUID(),
      created_at: now(),
      updated_at: now(),
      name: body.name,
      species: body.species,
      species_username: body.species_username,
      watering_interval: body.watering_interval,
      last_watered: body.last_watered,
      image_url: null,
      thumbnail_url: null,
      perenual_species_id: null,
      sensor_id: null,
      moisture_level: null,
      moisture_updated_at: null,
    };
    plants.push(newPlant);
    return HttpResponse.json(newPlant, { status: 201 });
  })),

  // ── Sensors ────────────────────────────────────────────────────────────────

  http.get("/api/sensors", withDelay(() => HttpResponse.json(mockSensors))),

  // ── Sensor assignments ─────────────────────────────────────────────────────

  http.get("/api/sensor-assignments", withDelay(() => HttpResponse.json(sensorAssignments))),

  http.post("/api/sensor-assignments", withDelay(async ({ request }) => {
    const body = (await request.json()) as { plant_id: string; sensor_id: string };
    const plant = plants.find((p) => p.id === body.plant_id);
    const assignment: SensorAssignment = {
      id: crypto.randomUUID(),
      plant_id: body.plant_id,
      plant_name: plant?.name ?? "",
      sensor_id: body.sensor_id,
      assigned_at: now(),
    };
    sensorAssignments.push(assignment);
    const p = plants.find((p) => p.id === body.plant_id);
    if (p) p.sensor_id = body.sensor_id;
    return HttpResponse.json(assignment, { status: 201 });
  })),

  http.delete("/api/sensor-assignments/:id", withDelay(({ params }) => {
    const idx = sensorAssignments.findIndex((a) => a.id === params.id);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    const removed = sensorAssignments[idx];
    sensorAssignments.splice(idx, 1);
    const p = plants.find((p) => p.id === removed.plant_id);
    if (p) p.sensor_id = null;
    return new HttpResponse(null, { status: 204 });
  })),

  // ── Subscriptions ──────────────────────────────────────────────────────────

  http.get("/api/subscriptions", withDelay(() => HttpResponse.json(subscriptions))),

  http.put("/api/subscriptions", withDelay(async ({ request }) => {
    const body = (await request.json()) as { name: string; email: string };
    const sub: Subscription = { id: crypto.randomUUID(), ...body };
    subscriptions.push(sub);
    return HttpResponse.json(sub, { status: 201 });
  })),

  http.patch("/api/subscriptions/:id", withDelay(async ({ params, request }) => {
    const sub = subscriptions.find((s) => s.id === params.id);
    if (!sub) return new HttpResponse(null, { status: 404 });
    const body = (await request.json()) as Partial<Subscription>;
    Object.assign(sub, body);
    return HttpResponse.json(sub);
  })),

  http.delete("/api/subscriptions/:id", withDelay(({ params }) => {
    const idx = subscriptions.findIndex((s) => s.id === params.id);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    subscriptions.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  })),
];
