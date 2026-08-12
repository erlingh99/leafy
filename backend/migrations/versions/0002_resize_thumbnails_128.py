"""resize thumbnails to 128x128

Revision ID: 0002_resize_thumbnails_128
Revises: 0001_initial_schema
Create Date: 2026-04-27 00:00:00

"""

from collections.abc import Sequence
from io import BytesIO

import sqlalchemy as sa
from alembic import op

revision: str = "0002_resize_thumbnails_128"
down_revision: str | Sequence[str] | None = "0001_initial_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

THUMBNAIL_SIZE = 128


def _regenerate_thumbnail(image_bytes: bytes) -> bytes | None:
    """Re-create a 128x128 JPEG thumbnail from raw image bytes. Returns None on failure."""
    try:
        from PIL import Image, ImageOps

        with Image.open(BytesIO(image_bytes)) as img:
            img = ImageOps.exif_transpose(img)
            thumb = ImageOps.fit(
                img, (THUMBNAIL_SIZE, THUMBNAIL_SIZE), method=Image.Resampling.LANCZOS
            )
            thumb = thumb.convert("RGB")
            buf = BytesIO()
            thumb.save(buf, format="JPEG", quality=75, optimize=True)
            return buf.getvalue()
    except (OSError, ValueError, Image.DecompressionBombError):
        return None


def upgrade() -> None:
    conn = op.get_bind()
    rows = conn.execute(
        sa.text("SELECT id, image FROM plants WHERE image IS NOT NULL")
    ).fetchall()
    for plant_id, image_bytes in rows:
        new_thumb = _regenerate_thumbnail(bytes(image_bytes))
        if new_thumb is not None:
            conn.execute(
                sa.text("UPDATE plants SET thumbnail = :thumb WHERE id = :id"),
                {"thumb": new_thumb, "id": plant_id},
            )
        else:
            # Clear the stale thumbnail if the image can't be processed
            conn.execute(
                sa.text("UPDATE plants SET thumbnail = NULL WHERE id = :id"),
                {"id": plant_id},
            )


def downgrade() -> None:
    # Thumbnails are derived data; we can't restore the old 400x400 size without
    # the original images, so downgrade regenerates at the previous default size.
    PREV_SIZE = 400
    conn = op.get_bind()
    rows = conn.execute(
        sa.text("SELECT id, image FROM plants WHERE image IS NOT NULL")
    ).fetchall()
    for plant_id, image_bytes in rows:
        try:
            from PIL import Image, ImageOps

            with Image.open(BytesIO(bytes(image_bytes))) as img:
                img = ImageOps.exif_transpose(img)
                thumb = ImageOps.fit(
                    img, (PREV_SIZE, PREV_SIZE), method=Image.Resampling.LANCZOS
                )
                thumb = thumb.convert("RGB")
                buf = BytesIO()
                thumb.save(buf, format="JPEG", quality=75, optimize=True)
                conn.execute(
                    sa.text("UPDATE plants SET thumbnail = :thumb WHERE id = :id"),
                    {"thumb": buf.getvalue(), "id": plant_id},
                )
        except (OSError, ValueError, Image.DecompressionBombError):
            conn.execute(
                sa.text("UPDATE plants SET thumbnail = NULL WHERE id = :id"),
                {"id": plant_id},
            )
