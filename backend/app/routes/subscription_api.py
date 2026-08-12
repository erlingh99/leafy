from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, HTTPException

from ..config import BREVO_API_KEY
from ..database import (
    delete_subscription as db_delete_subscription,
)
from ..database import (
    load_subscriptions,
    save_subscription,
)
from ..database import (
    update_subscription as db_update_subscription,
)
from ..dependencies import DbSession
from ..models import Subscription, SubscriptionUpdate
from ..services import send_welcome_email

subscription_router = APIRouter(prefix="/api/subscriptions", tags=["subscriptions"])


@subscription_router.get("", response_model=list[Subscription])
async def get_subscriptions(db: DbSession) -> list[Subscription]:
    subscriptions = await load_subscriptions(db)
    return list(subscriptions.values())


@subscription_router.get("/{subscription_id}", response_model=Subscription)
async def get_subscription(
    subscription_id: UUID, db: DbSession
) -> Subscription:
    subscriptions = await load_subscriptions(db)
    if subscription_id in subscriptions:
        return subscriptions[subscription_id]
    raise HTTPException(status_code=404, detail="Subscription not found")


@subscription_router.delete("/{subscription_id}")
async def delete_subscription(
    subscription_id: UUID, db: DbSession
):
    await db_delete_subscription(db, subscription_id)
    return {"message": "Subscription deleted successfully"}


@subscription_router.put("", response_model=Subscription)
async def set_subscription(
    subscription: Subscription,
    background_tasks: BackgroundTasks,
    db: DbSession,
) -> Subscription:
    await save_subscription(db, subscription)
    background_tasks.add_task(send_welcome_email, subscription, BREVO_API_KEY)
    return subscription


@subscription_router.patch("/{subscription_id}", response_model=Subscription)
async def update_subscription(
    subscription_id: UUID,
    partial_subscription: SubscriptionUpdate,
    db: DbSession,
) -> Subscription:
    subscriptions = await load_subscriptions(db)
    if subscription_id in subscriptions:
        subscription = subscriptions[subscription_id]
        update_data = subscription.model_dump() | partial_subscription.model_dump(
            exclude_unset=True, exclude_none=True
        )
        updated_subscription = Subscription(**update_data)
        updated_subscription.updated_at = datetime.now(timezone.utc)
        await db_update_subscription(db, updated_subscription)
        return updated_subscription
    raise HTTPException(status_code=404, detail="Subscription not found")
