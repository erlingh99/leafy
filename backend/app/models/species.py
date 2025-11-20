from datetime import datetime

from pydantic import BaseModel, Field

###SPECIES_LIST

class SpeciesListData(BaseModel):
    id: int #there are other fields, but this is all we care about

class SpeciesListResponse(BaseModel):
    data: list[SpeciesListData]

###SPECIES_DETAILS

class Dimension(BaseModel):
    type: str | None
    min_value: int | None
    max_value: int | None
    unit: str | None

class Hardiness(BaseModel):
    min: str | None
    max: str | None

class HardinessLocation(BaseModel):
    full_url: str | None #TODO not save this but provide a button on ui to fetch and display

class WateringGeneralBenchmark(BaseModel):
    value: str | None
    unit: str | None

class PlantAnatomyItem(BaseModel):
    part: str | None
    color: list[str] | None

class PruningCount(BaseModel):
    amount: int | None
    interval: str | None

class SpeciesDetailsResponse(BaseModel):
    id: int
    common_name: str | None
    scientific_name: list[str] | None
    other_name: list[str] | None
    family: str | None
    hybrid: bool | None
    authority: str | None
    subspecies: str | None
    cultivar: str | None
    variety: str | None
    species_epithet: str | None
    genus: str | None
    origin: list[str] | None
    type: str | None
    dimensions: list[Dimension] | None
    cycle: str | None
    attracts: list[str] | None
    propagation: list[str] | None
    hardiness: Hardiness | None
    hardiness_location: HardinessLocation | None
    watering: str | None
    watering_general_benchmark: WateringGeneralBenchmark | None
    plant_anatomy: list[PlantAnatomyItem] | None
    sunlight: list[str] | None
    pruning_month: list[str] | None
    pruning_count: PruningCount | None
    seeds: bool | None
    maintenance: str | None
    care_guides: str | None
    soil: list[str] | None
    growth_rate: str | None
    drought_tolerant: bool | None
    salt_tolerant: bool | None
    thorny: bool | None
    invasive: bool | None
    tropical: bool | None
    indoor: bool | None
    care_level: str | None
    pest_susceptibility: list[str] | None
    flowers: bool | None
    flowering_season: str | None
    cones: bool | None
    fruits: bool | None
    edible_fruit: bool | None
    harvest_season: str | None
    leaf: bool | None
    edible_leaf: bool | None
    cuisine: bool | None
    medicinal: bool | None
    poisonous_to_humans: bool | None
    poisonous_to_pets: bool | None
    description: str | None


###SPECIES_GUIDE

class GuideSection(BaseModel):
    type: str | None
    description: str | None

class SpeciesGuideData(BaseModel):
    id: int | None
    species_id: int | None
    section: list[GuideSection]

class SpeciesGuideResponse(BaseModel):
    data: list[SpeciesGuideData]


class Species(BaseModel):
    perenual_id: int
    details: SpeciesDetailsResponse
    care_guides: list[SpeciesGuideData] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

class SpeciesUpdate(BaseModel):
    details: SpeciesDetailsResponse
    care_guides: list[SpeciesGuideData] = Field(default_factory=list)
