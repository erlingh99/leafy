"""add species table

Revision ID: 2ebd49317454
Revises: 
Create Date: 2025-11-20 18:46:59.459851

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2ebd49317454'
down_revision: Union[str, Sequence[str], None] = '1fbd49373211'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Check if table exists (for existing databases)
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()
    
    if 'plant_species' not in tables:
        op.create_table(
            'plant_species',
            sa.Column('perenual_id', sa.Integer(), primary_key=True),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('details', sa.JSON(), nullable=False),
            sa.Column('care_guides', sa.JSON(), nullable=False),
        )
    
    # Check if column exists before adding
    columns = [col['name'] for col in inspector.get_columns('plants')]
    if 'perenual_species_id' not in columns:
        with op.batch_alter_table("plants", schema=None) as batch_op:
            batch_op.add_column(sa.Column('perenual_species_id', sa.Integer(), nullable=True))
    
    # Check if foreign key exists before creating
    # SQLite may not name FKs, so check by column reference
    fks = inspector.get_foreign_keys('plants')
    has_fk = any(
        fk['constrained_columns'] == ['perenual_species_id'] 
        and fk['referred_table'] == 'plant_species'
        for fk in fks
    )
    if not has_fk and 'perenual_species_id' in columns:
        with op.batch_alter_table("plants", schema=None) as batch_op:
            batch_op.create_foreign_key(
                'plants_perenual_species_id_fkey',
                'plant_species',
                ['perenual_species_id'],
                ['perenual_id'],
            )


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("plants", schema=None) as batch_op:
        batch_op.drop_constraint('plants_perenual_species_id_fkey', type_='foreignkey')
        batch_op.drop_column('perenual_species_id')
    op.drop_table('plant_species')
