"""add thumbnail column

Revision ID: 5fbd493732aa
Revises: eefed47f67df
Create Date: 2026-04-17 00:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5fbd493732aa'
down_revision: Union[str, Sequence[str], None] = 'eefed47f67df'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: add nullable thumbnail column and backfill from image."""
    # Add thumbnail column
    with op.batch_alter_table('plants', schema=None) as batch_op:
        batch_op.add_column(sa.Column('thumbnail', sa.LargeBinary(), nullable=True))

    # Backfill thumbnails for existing plants that have an image
    # Note: This requires Pillow to be available in the migration environment.
    try:
        from base64 import b64decode
        from io import BytesIO
        from PIL import Image, ImageOps

        conn = op.get_bind()
        rows = conn.execute(sa.text("SELECT id, image FROM plants WHERE image IS NOT NULL AND image != ''")).fetchall()
        for row in rows:
            plant_id = row[0]
            image_data = row[1]
            try:
                if image_data is None:
                    continue

                # Normalize to bytes
                if isinstance(image_data, memoryview):
                    image_bytes = bytes(image_data)
                elif isinstance(image_data, str):
                    image_bytes = image_data.encode('utf-8')
                else:
                    image_bytes = image_data

                # Decode data URI if present
                if isinstance(image_bytes, (bytes, bytearray)) and image_bytes.startswith(b'data:'):
                    header, b64 = image_bytes.split(b',', 1)
                    raw = b64decode(b64)
                else:
                    raw = image_bytes

                with Image.open(BytesIO(raw)) as img:
                    img = ImageOps.exif_transpose(img)
                    thumb = ImageOps.fit(img, (400, 400), method=Image.Resampling.LANCZOS)
                    thumb = thumb.convert('RGB')
                    buf = BytesIO()
                    thumb.save(buf, format='JPEG', quality=75, optimize=True)
                    thumb_bytes = buf.getvalue()

                    conn.execute(
                        sa.text("UPDATE plants SET thumbnail = :thumb WHERE id = :id"),
                        {"thumb": thumb_bytes, "id": plant_id},
                    )
            except Exception as exc:
                # If thumbnail generation fails for a row, skip it and continue
                print(f"Skipping thumbnail for {plant_id}: {exc}")

    except Exception as exc:
        # If Pillow isn't installed or other errors occur, surface a helpful message
        print(f"Thumbnail backfill skipped: {exc}")


def downgrade() -> None:
    """Downgrade schema: remove thumbnail column."""
    with op.batch_alter_table('plants', schema=None) as batch_op:
        batch_op.drop_column('thumbnail')
