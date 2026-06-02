"""
Integration helpers for the Perenual Plant Open API.
"""

import asyncio
from typing import Any
import logging
from PIL import Image
from pydantic import ValidationError
import httpx
from fastapi import status
from io import BytesIO

from ..config import PERENUAL_API_KEY, PERENUAL_BASE_URL
from ..models import (
    Species,
    SpeciesDetailsResponse,
    SpeciesGuideData,
    SpeciesGuideResponse,
    SpeciesListResponse,
    SpeciesListData,
    HardinessMap,
)

PERENUAL_TIMEOUT = 20  # seconds
_HARDINESS_OVERLAY_OPACITY = 0.8

logger = logging.getLogger("uvicorn.error")


class PerenualConfigurationError(RuntimeError):
    """Raised when the Perenual client is misconfigured."""


async def get_perenual_species_id(species_query: str) -> SpeciesListData:
    """
    Get the Perenual species ID for a species query.

    Steps:
    1. Search the species list endpoint using the provided query.
    2. Select the entry with the lowest ID.

    Returns the species ID.
    """
    if not species_query:
        raise ValueError("Species query must be provided to enrich plant data.")
    if not PERENUAL_API_KEY:
        raise PerenualConfigurationError(
            "PERENUAL_API_KEY is not configured in the environment."
        )

    async with httpx.AsyncClient(headers={"Accept": "application/json"}) as client:
        species_candidates = await _search_species(client, species_query)
    return _select_lowest_id(species_candidates.data)


async def fetch_perenual_enrichment(species: SpeciesListData) -> Species:
    """
    Fetch the enrichment payload for a species.

    Steps:
    1. If species.id is above 3000, skip subsequent API calls and return minimal data.
    2. Otherwise, fetch the species details for that ID.
    3. Fetch the care guide list for the same species.

    Args:
        species: The species data from the species list endpoint
    """
    if species.id > 3000:
        logger.warning(
            "Species ID %s is above 3000, skipping details and care guides API calls",
            species.id,
        )
        return Species(
            perenual_id=species.id,
            details=SpeciesDetailsResponse(
                common_name=species.common_name,
                scientific_name=species.scientific_name,
                other_name=species.other_name,
                family=species.family,
                hybrid=species.hybrid,
                authority=species.authority,
                variety=species.variety,
                cultivar=species.cultivar,
                species_epithet=species.species_epithet,
                genus=species.genus,
            ),
        )

    if not PERENUAL_API_KEY:
        raise PerenualConfigurationError(
            "PERENUAL_API_KEY is not configured in the environment."
        )

    async with httpx.AsyncClient(headers={"Accept": "application/json"}) as client:
        details = await _fetch_details(client, species.id)
        care_guides = await _fetch_care_guides(client, species.id)

    care_guide = care_guides[0] if care_guides else None

    return Species(
        perenual_id=species.id,
        details=details,
        care_guides=care_guide,
    )


async def get_hardiness_base_maps() -> list[tuple[int, bytes]]:
    async def fetch_one(client: httpx.AsyncClient, i: int) -> tuple[int, bytes]:
        url = f"{PERENUAL_BASE_URL.rstrip('/api/')}/storage/image/hardiness/lg/{i}.png"
        try:
            response = await client.get(url, timeout=PERENUAL_TIMEOUT)
            response.raise_for_status()
        except httpx.HTTPError as exc:
            raise ValueError(
                f"Perenual API call to get hardiness-map base map {i} failed."
            ) from exc
        return (i, response.content)

    async with httpx.AsyncClient() as client:
        return list(await asyncio.gather(*[fetch_one(client, i) for i in range(14)]))


async def _search_species(client: httpx.AsyncClient, query: str) -> SpeciesListResponse:
    logger.debug("Getting info about species %s", query)
    payload = await _request(client, "/v2/species-list", params={"q": query})
    try:
        response = SpeciesListResponse.model_validate(payload)
    except ValidationError as exc:
        logger.error("Validation error: %s", exc.errors())
        raise ValueError("Bad species list API response") from exc

    if not response.data:
        raise ValueError(f"No species found for query '{query}'.")
    return response


def _select_lowest_id(candidates: list[SpeciesListData]) -> SpeciesListData:
    def candidate_tuple(item: SpeciesListData) -> tuple[float, SpeciesListData]:
        candidate_id = item.id
        if candidate_id is None:
            return (float("inf"), item)
        return (candidate_id, item)

    candidate_id, candidate = min(
        (candidate_tuple(item) for item in candidates),
        key=lambda pair: pair[0],
    )

    if candidate_id == float("inf"):
        raise ValueError("Perenual API returned species without identifiers.")
    return candidate


async def _fetch_details(
    client: httpx.AsyncClient, species_id: int
) -> SpeciesDetailsResponse:
    logger.debug("Getting details for species %s", species_id)
    payload = await _request(client, f"/v2/species/details/{species_id}")
    try:
        return SpeciesDetailsResponse.model_validate(payload)
    except ValidationError as exc:
        logger.error("Validation error: %s", exc.errors())
        raise ValueError("Bad species details API response") from exc


async def _fetch_care_guides(
    client: httpx.AsyncClient, species_id: int
) -> list[SpeciesGuideData]:
    logger.debug("Getting care guide for id %s", species_id)
    payload = await _request(
        client,
        "/species-care-guide-list",
        params={"species_id": species_id},
    )
    try:
        response = SpeciesGuideResponse.model_validate(payload)
    except ValidationError as exc:
        logger.error("Validation error: %s", exc.errors())
        raise ValueError("Bad species care guide API response") from exc
    return response.data or []


def create_hardiness_map(hardiness_maps: list[HardinessMap]) -> "Image.Image":
    """
    Create a hardiness map from a list of hardiness maps.

    Args:
        hardiness_maps: The list of hardiness maps

    Returns:
        The hardiness map image
    """
    logger.debug("Stitching together %s maps", len(hardiness_maps))
    hardiness_maps.sort(key=lambda x: x.id)
    with Image.open(BytesIO(hardiness_maps[0].image)).convert("RGBA") as base:
        canvas = Image.new("RGBA", base.size)
        canvas.paste(base, (0, 0))
    for hardiness_map in hardiness_maps[1:]:
        with Image.open(BytesIO(hardiness_map.image)).convert("RGBA") as im:
            r, g, b, a = im.split()
            a = a.point(lambda p: int(p * _HARDINESS_OVERLAY_OPACITY))
            img = Image.merge("RGBA", (r, g, b, a))
            canvas.alpha_composite(img)
    return canvas


async def _request(
    client: httpx.AsyncClient,
    path: str,
    params: dict[str, Any] | None = None,
) -> dict[str, Any]:
    request_params: dict[str, Any] = params.copy() if params else {}
    request_params["key"] = PERENUAL_API_KEY

    url = f"{PERENUAL_BASE_URL.rstrip('/')}{path}"

    try:
        response = await client.get(
            url, params=request_params, timeout=PERENUAL_TIMEOUT
        )
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        raise ValueError(
            f"Perenual API call to {path} failed with status {exc.response.status_code}."
        ) from exc
    except httpx.RequestError as exc:
        raise ValueError(
            f"Perenual API call to {path} failed with status {status.HTTP_502_BAD_GATEWAY}."
        ) from exc

    return response.json()
