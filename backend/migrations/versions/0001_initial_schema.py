"""initial schema

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-04-23 00:00:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0001_initial_schema'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'plant_species',
        sa.Column('perenual_id', sa.Integer(), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('details', sa.JSON(), nullable=False),
        sa.Column('care_guides', sa.JSON(), nullable=True),
    )

    op.create_table(
        'plants',
        sa.Column('id', sa.Text(), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('name', sa.Text(), nullable=False),
        sa.Column('species', sa.Text(), nullable=False),
        sa.Column('species_username', sa.Text(), nullable=True),
        sa.Column('watering_interval', sa.Integer(), nullable=False),
        sa.Column('last_watered', sa.DateTime(timezone=True), nullable=False),
        sa.Column('image', sa.LargeBinary(), nullable=True),
        sa.Column('thumbnail', sa.LargeBinary(), nullable=True),
        sa.Column('perenual_species_id', sa.Integer(), sa.ForeignKey('plant_species.perenual_id', ondelete='SET NULL'), nullable=True),
    )

    op.create_index('ix_plants_perenual_species_id', 'plants', ['perenual_species_id'])
    op.create_index('ix_plants_last_watered', 'plants', ['last_watered'])

    op.create_table(
        'hardiness_maps',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('image', sa.LargeBinary(), nullable=False),
    )

    op.create_table(
        'subscriptions',
        sa.Column('id', sa.Text(), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('name', sa.Text(), nullable=False),
        sa.Column('email', sa.Text(), nullable=False),
        sa.UniqueConstraint('email'),
    )


def downgrade() -> None:
    op.drop_table('subscriptions')
    op.drop_table('hardiness_maps')
    op.drop_index('ix_plants_last_watered', table_name='plants')
    op.drop_index('ix_plants_perenual_species_id', table_name='plants')
    op.drop_table('plants')
    op.drop_table('plant_species')
