"""make image column nullable

Revision ID: c8e2f1a9b3d7
Revises: 7d3c4a2b1f8e
Create Date: 2026-04-20 00:00:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'c8e2f1a9b3d7'
down_revision: Union[str, Sequence[str], None] = '7d3c4a2b1f8e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('plants', schema=None) as batch_op:
        batch_op.alter_column('image', existing_type=sa.LargeBinary(), nullable=True)


def downgrade() -> None:
    with op.batch_alter_table('plants', schema=None) as batch_op:
        batch_op.alter_column('image', existing_type=sa.LargeBinary(), nullable=False)
