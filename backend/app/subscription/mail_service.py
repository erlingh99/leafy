import logging
from datetime import timedelta, datetime

from brevo_python import Configuration, ApiClient, TransactionalEmailsApi, SendSmtpEmail
from brevo_python.rest import ApiException

from ..database import load_subscriptions, load_plants, get_db
from ..models import Plant, Subscription

logger = logging.getLogger('uvicorn.error')

async def send_email(API_KEY: str):
    logger.debug("Running daily email job...")

    db_context = get_db()
    subs: list[Subscription] = []
    plants: list[Plant] = []
    async with db_context as db:
        subs = list((await load_subscriptions(db)).values())
        plants = list((await load_plants(db)).values())

    needs_water: list[str] = []
    for plant in plants:
        next_water = plant.last_watered + timedelta(days=plant.watering_interval)
        if next_water < datetime.now() and next_water > (datetime.now() - timedelta(days=1)):
            needs_water.append(plant.name)

    if len(needs_water) == 0 or len(subs) == 0:
        return

    configuration = Configuration()
    configuration.api_key['api-key'] = API_KEY

    api_instance = TransactionalEmailsApi(ApiClient(configuration))

    email = SendSmtpEmail(
        to=[{"email": s.email, "name": s.name} for s in subs],
        sender={"email": "REDACTED", "name": "Leafy App"},
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