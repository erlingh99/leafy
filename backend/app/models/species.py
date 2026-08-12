from datetime import datetime
from typing import Annotated, TypeVar

from pydantic import BaseModel, BeforeValidator, Field

T = TypeVar("T")


def falsy_to_none(x: T) -> T | None:
    return x or None


LeniantOptional = Annotated[T | None, BeforeValidator(falsy_to_none)]


###SPECIES_LIST


class SpeciesListData(BaseModel):
    id: int  # there are other fields, but this is all we care about
    common_name: str | None = None
    scientific_name: list[str] | None = None
    other_name: list[str] | None = None
    family: str | None = None
    hybrid: str | None = None
    authority: str | None = None
    subspecies: str | None = None
    cultivar: str | None = None
    variety: str | None = None
    species_epithet: str | None = None
    genus: str | None = None


class SpeciesListResponse(BaseModel):
    data: list[SpeciesListData]


###SPECIES_DETAILS


class Dimension(BaseModel):
    type: str | None
    min_value: float | None
    max_value: float | None
    unit: str | None


class Hardiness(BaseModel):
    min: int | None
    max: int | None


class WateringGeneralBenchmark(BaseModel):
    value: str | None
    unit: str | None


class PlantAnatomyItem(BaseModel):
    part: str | None
    color: list[str] | None


class PruningCount(BaseModel):
    amount: float | None
    interval: str | None


class SpeciesDetailsResponse(BaseModel):
    common_name: str | None = None
    scientific_name: list[str] | None = None
    other_name: list[str] | None = None
    family: str | None = None
    hybrid: bool | str | None = None
    authority: str | None = None
    species_id: int | None = None
    subspecies: str | None = None
    cultivar: str | None = None
    variety: str | None = None
    species_epithet: str | None = None
    genus: str | None = None
    origin: list[str] | None = None
    type: str | None = None
    dimensions: list[Dimension] | None = None
    cycle: str | None = None
    attracts: list[str] | None = None
    propagation: list[str] | None = None
    hardiness: LeniantOptional[Hardiness] = None
    watering: str | None = None
    watering_general_benchmark: LeniantOptional[WateringGeneralBenchmark] = None
    plant_anatomy: list[PlantAnatomyItem] | None = None
    sunlight: list[str] | None = None
    pruning_month: list[str] | None = None
    pruning_count: LeniantOptional[PruningCount] = None
    seeds: bool | None = None
    maintenance: str | None = None
    soil: list[str] | None = None
    growth_rate: str | None = None
    drought_tolerant: bool | None = None
    salt_tolerant: bool | None = None
    thorny: bool | None = None
    invasive: bool | None = None
    tropical: bool | None = None
    indoor: bool | None = None
    care_level: str | None = None
    pest_susceptibility: list[str] | None = None
    flowers: bool | None = None
    flowering_season: str | None = None
    cones: bool | None = None
    fruits: bool | None = None
    edible_fruit: bool | None = None
    harvest_season: str | None = None
    leaf: bool | None = None
    edible_leaf: bool | None = None
    cuisine: bool | None = None
    medicinal: bool | None = None
    poisonous_to_humans: bool | None = None
    poisonous_to_pets: bool | None = None
    description: str | None = None


###SPECIES_GUIDE


class GuideSection(BaseModel):
    type: str | None = None
    description: str | None = None


class SpeciesGuideData(BaseModel):
    section: list[GuideSection] = Field(default_factory=list)


class SpeciesGuideResponse(BaseModel):
    data: list[SpeciesGuideData]


class Species(BaseModel):
    perenual_id: int
    details: SpeciesDetailsResponse
    care_guides: SpeciesGuideData | None = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


class HardinessMap(BaseModel):
    id: int
    image: bytes
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
