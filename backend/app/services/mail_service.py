import logging
from datetime import datetime, timedelta, timezone

from brevo import Brevo
from brevo.core.api_error import ApiError
from brevo.transactional_emails import (
    SendTransacEmailRequestSender,
    SendTransacEmailRequestToItem,
)

from ..config import BREVO_API_KEY, SENDER_EMAIL
from ..database import async_session_maker, load_plants, load_subscriptions
from ..models import Plant, Subscription

logger = logging.getLogger("uvicorn.error")


async def send_email(API_KEY: str):
    logger.debug("Running daily email job...")

    subs: list[Subscription] = []
    plants: list[Plant] = []
    async with async_session_maker() as db:
        subs = list((await load_subscriptions(db)).values())
        plants = list((await load_plants(db)).values())

    needs_water: list[str] = []
    for plant in plants:
        next_water = plant.last_watered + timedelta(days=plant.watering_interval)
        if next_water.date() == datetime.now(timezone.utc).date():
            needs_water.append(plant.name)

    if len(needs_water) == 0 or len(subs) == 0:
        return

    client = Brevo(api_key=API_KEY)

    try:
        result = client.transactional_emails.send_transac_email(
            to=[
                SendTransacEmailRequestToItem(email=s.email, name=s.name) for s in subs
            ],
            sender=SendTransacEmailRequestSender(email=SENDER_EMAIL, name="Leafy App"),
            subject="Watering reminder",
            text_content=(
                f"Hello from Leafy!\n"
                f"It is time to water {', '.join(needs_water)}!\n\n"
                "xoxo"
            ),
        )
        logger.debug(f"Email sent! {result}")
    except ApiError as e:
        logger.debug("Brevo API error: %s", e)


def send_welcome_email(subscription: Subscription, api_key: str | None = None) -> None:
    api_key = api_key or BREVO_API_KEY
    if not api_key:
        logger.debug(
            "No API key configured, skipping welcome email for %s", subscription.email
        )
        return

    client = Brevo(api_key=api_key)

    try:
        result = client.transactional_emails.send_transac_email(
            to=[
                SendTransacEmailRequestToItem(
                    email=subscription.email, name=subscription.name
                )
            ],
            sender=SendTransacEmailRequestSender(email=SENDER_EMAIL, name="Leafy App"),
            subject="Welcome to Leafy 🌱",
            text_content=(
                f"Hi {subscription.name or 'there'},\n\n"
                "Thanks for subscribing to Leafy! We will keep you posted with helpful\n"
                "tips and reminders so your plants stay happy and hydrated.\n\n"
                "Happy growing!"
            ),
        )
        logger.debug("Welcome email sent to %s (%s)", subscription.name, result)
    except ApiError:
        logger.exception("Failed to send welcome email to %s", subscription.email)
