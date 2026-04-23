from pydantic import BaseModel, Field, EmailStr
from datetime import datetime, timezone
from uuid import UUID, uuid4

class Subscription(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    name: str
    email: EmailStr

class SubscriptionUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
