"""
Integration helpers for the Perenual Plant Open API.
"""
from typing import Any
import logging
import json
from pydantic import ValidationError
import requests
from fastapi import HTTPException, status

from ..config import PERENUAL_API_KEY, PERENUAL_BASE_URL
from ..models import (
    Species,
    SpeciesDetailsResponse,
    SpeciesGuideData,
    SpeciesGuideResponse,
    SpeciesListResponse,
    SpeciesListData,
)

PERENUAL_TIMEOUT = 20  # seconds

logger = logging.getLogger('uvicorn.error')
logger.setLevel(logging.DEBUG)

class PerenualConfigurationError(RuntimeError):
    """Raised when the Perenual client is misconfigured."""


def get_perenual_species_id(species_query: str) -> SpeciesListData:
    """
    Get the Perenual species ID for a species query.
    
    Steps:
    1. Search the species list endpoint using the provided query.
    2. Select the entry with the lowest ID.
    
    Returns the species ID.
    """
    if not species_query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Species query must be provided to enrich plant data.",
        )

    with _build_session() as session:
        species_candidates = _search_species(session, species_query)
        species = _select_lowest_id(species_candidates.data)
    
    return species


def fetch_perenual_enrichment(species: SpeciesListData) -> Species:
    """
    Fetch the enrichment payload for a species.

    Steps:
    1. If species.id is above 3000, skip subsequent API calls and return minimal data.
    2. Otherwise, fetch the species details for that ID.
    3. Fetch the care guide list for the same species.
    
    Args:
        species: The species data from the species list endpoint
    """

    # If species_id > 3000, subsequent API calls will fail, so return minimal data
    if species.id > 3000:
        logger.warning(f"Species ID {species.id} is above 3000, skipping details and care guides API calls")
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

    with _build_session() as session:
        details = _fetch_details(session, species.id)
        care_guides = _fetch_care_guides(session, species.id)

    care_guide = None
    if care_guides and len(care_guides) > 0:
        care_guide = care_guides[0]

    return Species(
        perenual_id=species.id,
        details=details,
        care_guides=care_guide,
    )


def _build_session() -> requests.Session:
    if not PERENUAL_API_KEY:
        raise PerenualConfigurationError(
            "PERENUAL_API_KEY is not configured in the environment."
        )

    session = requests.Session()
    session.headers.update({"Accept": "application/json"})
    return session


def _search_species(session: requests.Session, query: str) -> SpeciesListResponse:
    logger.debug(f"Getting info about species {query}")
    payload = _request(session, "/v2/species-list", params={"q": query})
    try:
        response = SpeciesListResponse.model_validate(payload)
    except ValidationError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Bad species API response.",
        )

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No species found for query '{query}'.",
        )
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
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Perenual API returned species without identifiers.",
        )
    return candidate


def _fetch_details(session: requests.Session, species_id: int) -> SpeciesDetailsResponse:
    logger.debug(f"Getting details for species {species_id}")
    payload = _request(session, f"/v2/species/details/{species_id}")
    try:
        # Sanitize hardiness_location before validation
        if "hardiness_location" in payload and payload["hardiness_location"] is not None:
            hardiness_location = payload["hardiness_location"]
            has_map = hardiness_location.get("full_url") is not None
            payload["hardiness_location"] = {"has_map": has_map}
        
        return SpeciesDetailsResponse.model_validate(payload)
    except ValidationError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Bad species API response.",
        )


def _fetch_care_guides(
    session: requests.Session, species_id: int
) -> list[SpeciesGuideData]:
    logger.debug(f"Getting care guide for id {species_id}")
    payload = _request(
        session,
        "/species-care-guide-list",
        params={"species_id": species_id},
    )
    try:
        response = SpeciesGuideResponse.model_validate(payload)
    except ValidationError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Bad species API response.",
        )
    return response.data or []


def fetch_hardiness_map(species_id: int) -> bytes:
    """
    Fetch the hardiness map image for a species.
    
    Args:
        species_id: The Perenual species ID
        size: Map size (default: "og" for original size)
    
    Returns:
        The image bytes
    """
    with _build_session() as session:
        params = {
            "species_id": species_id,
            "key": PERENUAL_API_KEY,
        }
        
        url = f"{PERENUAL_BASE_URL.rstrip('/')}/api/hardiness-map"
        
        try:
            response = session.get(url, params=params, timeout=PERENUAL_TIMEOUT)
            response.raise_for_status()
        except requests.RequestException as exc:
            response_obj = getattr(exc, "response", None)
            status_code = response_obj.status_code if response_obj is not None else status.HTTP_502_BAD_GATEWAY
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Perenual API call to hardiness-map failed with status {status_code}.",
            ) from exc
        
        return response.content


def _request(
    session: requests.Session,
    path: str,
    params: dict[str, Any] | None = None,
) -> dict[str, Any]:
    params = params.copy() if params else {}
    params["key"] = PERENUAL_API_KEY

    url = f"{PERENUAL_BASE_URL.rstrip('/')}{path}"

    try:
        response = session.get(url, params=params, timeout=PERENUAL_TIMEOUT)
        response.raise_for_status()
    except requests.RequestException as exc:
        response_obj = getattr(exc, "response", None)
        status_code = response_obj.status_code if response_obj is not None else status.HTTP_502_BAD_GATEWAY
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Perenual API call to {path} failed with status {status_code}.",
        ) from exc

    json_payload: dict[str, Any] = response.json()
    return json_payload
