import logging
from datetime import timedelta, datetime, timezone

from brevo_python import Configuration, ApiClient, TransactionalEmailsApi, SendSmtpEmail
from brevo_python.rest import ApiException

from ..database import load_subscriptions, load_plants, async_session_maker
from ..models import Plant, Subscription
from ..config import BREVO_API_KEY, SENDER_EMAIL

logger = logging.getLogger('uvicorn.error')

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

    configuration = Configuration()
    configuration.api_key['api-key'] = API_KEY

    api_instance = TransactionalEmailsApi(ApiClient(configuration))

    email = SendSmtpEmail(
        to=[{"email": s.email, "name": s.name} for s in subs],
        sender={"email": SENDER_EMAIL, "name": "Leafy App"},
        subject="Watering reminder",
        text_content=
        f"""Hello from Leafy!
        It is time to water {", ".join(needs_water)}!
        
        xoxo
        """
    )

    try:
        result = api_instance.send_transac_email(email)
        logger.debug(f"Email sent! {result}")
    except ApiException as e:
        logger.debug("Brevo API error:", e)


def send_welcome_email(subscription: Subscription, api_key: str | None = None) -> None:
    """
    Send a welcome email to a new subscriber.
    """
    api_key = api_key or BREVO_API_KEY
    if not api_key:
        logger.debug("No API key configured, skipping welcome email for %s", subscription.email)
        return

    configuration = Configuration()
    configuration.api_key['api-key'] = api_key
    api_instance = TransactionalEmailsApi(ApiClient(configuration))

    email = SendSmtpEmail(
        to=[{"email": subscription.email, "name": subscription.name}],
        sender={"email": SENDER_EMAIL, "name": "Leafy App"},
        subject="Welcome to Leafy 🌱",
        text_content=(
            f"Hi {subscription.name or 'there'},\n\n"
            "Thanks for subscribing to Leafy! We will keep you posted with helpful\n"
            "tips and reminders so your plants stay happy and hydrated.\n\n"
            "Happy growing!"
        )
    )

    try:
        result = api_instance.send_transac_email(email)
        logger.debug("Welcome email sent to %s (%s)", subscription.name, result)
    except ApiException as exc:
        logger.exception("Failed to send welcome email to %s: %s", subscription.email, exc)