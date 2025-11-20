"""
Integration helpers for the Perenual Plant Open API.
"""
from typing import Any

import requests
from fastapi import HTTPException, status

from ..config import PERENUAL_API_KEY, PERENUAL_BASE_URL
from ..models import (
    Species,
    SpeciesDetailsResponse,
    SpeciesGuideData,
    SpeciesGuideResponse,
    SpeciesListResponse,
)

PERENUAL_TIMEOUT = 20  # seconds


class PerenualConfigurationError(RuntimeError):
    """Raised when the Perenual client is misconfigured."""


def fetch_perenual_enrichment(species_query: str) -> Species:
    """
    Fetch the enrichment payload for a species.

    Steps:
    1. Search the species list endpoint using the provided query.
    2. Select the entry with the lowest ID.
    3. Fetch the species details for that ID.
    4. Fetch the care guide list for the same species.
    """
    if not species_query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Species query must be provided to enrich plant data.",
        )

    with _build_session() as session:
        species_candidates = _search_species(session, species_query)
        species_id = _select_lowest_id(species_candidates.data)
        details = _fetch_details(session, species_id)
        care_guides = _fetch_care_guides(session, species_id)

    return Species(
        perenual_id=species_id,
        details=details,
        care_guides=care_guides,
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
    payload = _request(session, "/species-list", params={"q": query})
    response = SpeciesListResponse.model_validate(payload)
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No species found for query '{query}'.",
        )
    return response


def _select_lowest_id(candidates: list[Any]) -> int:
    def candidate_tuple(item: Any) -> tuple[float, Any]:
        candidate_id = getattr(item, "id", None)
        if candidate_id is None:
            return (float("inf"), item)
        return (candidate_id, item)

    candidate_id, _ = min(
        (candidate_tuple(item) for item in candidates),
        key=lambda pair: pair[0],
    )

    if candidate_id == float("inf"):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Perenual API returned species without identifiers.",
        )
    return int(candidate_id)


def _fetch_details(session: requests.Session, species_id: int) -> SpeciesDetailsResponse:
    payload = _request(session, f"/species/details/{species_id}")
    return SpeciesDetailsResponse.model_validate(payload)


def _fetch_care_guides(
    session: requests.Session, species_id: int
) -> list[SpeciesGuideData]:
    payload = _request(
        session,
        "/species-care-guide-list",
        params={"species_id": species_id},
    )
    response = SpeciesGuideResponse.model_validate(payload)
    return response.data or []


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

