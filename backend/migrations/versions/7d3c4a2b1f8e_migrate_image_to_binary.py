"""migrate image to binary

Revision ID: 7d3c4a2b1f8e
Revises: 5fbd493732aa
Create Date: 2026-04-18 20:40:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from base64 import b64decode

# revision identifiers, used by Alembic.
revision: str = '7d3c4a2b1f8e'
down_revision: Union[str, Sequence[str], None] = '5fbd493732aa'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: change image column from TEXT to LargeBinary and convert data."""
    
    # 1. Convert existing data from Base64 to raw bytes
    conn = op.get_bind()
    rows = conn.execute(sa.text("SELECT id, image FROM plants WHERE image IS NOT NULL AND image != ''")).fetchall()
    
    for row in rows:
        plant_id = row[0]
        image_data = row[1]
        
        try:
            # Normalize to bytes
            if isinstance(image_data, memoryview):
                image_bytes = bytes(image_data)
            elif isinstance(image_data, str):
                image_bytes = image_data.encode('utf-8')
            else:
                image_bytes = image_data

            # Decode data URI if present
            if isinstance(image_bytes, (bytes, bytearray)) and image_bytes.startswith(b'data:'):
                _, b64 = image_bytes.split(b',', 1)
                raw = b64decode(b64)
                
                conn.execute(
                    sa.text("UPDATE plants SET image = :raw WHERE id = :id"),
                    {"raw": raw, "id": plant_id},
                )
        except Exception as exc:
            print(f"Skipping image conversion for {plant_id}: {exc}")

    # 2. Change column type using batch_alter_table (required for SQLite)
    with op.batch_alter_table('plants', schema=None) as batch_op:
        batch_op.alter_column('image',
               existing_type=sa.TEXT(),
               type_=sa.LargeBinary(),
               existing_nullable=False)


def downgrade() -> None:
    """Downgrade schema: image column reverts to TEXT (note: binary data might need re-encoding if strictly required)."""
    with op.batch_alter_table('plants', schema=None) as batch_op:
        batch_op.alter_column('image',
               existing_type=sa.LargeBinary(),
               type_=sa.TEXT(),
               existing_nullable=False)
