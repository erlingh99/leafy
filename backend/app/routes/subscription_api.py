import os

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List
from uuid import UUID
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession


from ..models import Subscription, SubscriptionUpdate
from ..database import get_db, load_subscriptions, save_subscription, delete_subscription as db_delete_subscription, update_subscription as db_update_subscription
from ..subscription import send_welcome_email

subscription_router = APIRouter(prefix="/api/subscriptions", tags=["subscriptions"])

@subscription_router.get("", response_model=List[Subscription])
async def get_subscriptions(db: AsyncSession = Depends(get_db)) -> List[Subscription]:
    subscriptions = await load_subscriptions(db)
    return list(subscriptions.values())

@subscription_router.get("/{subscription_id}", response_model=Subscription)
async def get_subscription(subscription_id: UUID, db: AsyncSession = Depends(get_db)):
    subscriptions = await load_subscriptions(db)
    if subscription_id in subscriptions:
        return subscriptions[subscription_id]
    raise HTTPException(status_code=404, detail="Subscription not found")

@subscription_router.delete("/{subscription_id}")
async def delete_subscription(subscription_id: UUID, db: AsyncSession = Depends(get_db)):
    await db_delete_subscription(db, subscription_id)
    return {"message": "Subscription deleted successfully"}

@subscription_router.put("")
async def set_subscription(
    subscription: Subscription,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    await save_subscription(db, subscription)
    background_tasks.add_task(send_welcome_email, subscription, os.getenv("BREVO_API_KEY"))
    return {"message" : "Subscriptioned saved succesfully"}

@subscription_router.patch("/{subscription_id}")
async def update_subscription(subscription_id: UUID, partial_subscription: SubscriptionUpdate, db: AsyncSession = Depends(get_db)):
    subscriptions = await load_subscriptions(db)
    if subscription_id in subscriptions:
        subscription = subscriptions[subscription_id]
        update_data = subscription.model_dump() | partial_subscription.model_dump(exclude_unset=True, exclude_none=True)
        updated_subscription = Subscription(**update_data)
        updated_subscription.updated_at = datetime.now()  # Update timestamp
        await db_update_subscription(db, updated_subscription)
        return {"message" : "Subscription updated successfully"}
    raise HTTPException(status_code=404, detail="Subscription not found")