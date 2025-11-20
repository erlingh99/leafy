"""add plants table

Revision ID: 1fbd49373211
Revises: 
Create Date: 2025-11-20 18:45:59.459851

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1fbd49373211'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Check if table exists (for existing databases)
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    op.create_table(
        'plants',
        sa.Column('id', sa.UUID(), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('name', sa.Text(), nullable=False),
        sa.Column('species', sa.Text(), nullable=False),
        sa.Column('watering_interval', sa.Integer(), nullable=False),
        sa.Column('last_watered', sa.DateTime(timezone=True), nullable=False),
        sa.Column('image', sa.TEXT(), nullable=False),
    )

def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('plants')

