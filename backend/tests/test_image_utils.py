import base64
from io import BytesIO

import pytest
from PIL import Image

from app.utils.image_utils import (
    create_thumbnail,
    decode_data_uri,
    encode_data_uri,
    parse_data_uri,
    shrink_image,
)


def _make_jpeg(width: int = 100, height: int = 100) -> bytes:
    buf = BytesIO()
    Image.new("RGB", (width, height), color=(180, 90, 45)).save(buf, format="JPEG")
    return buf.getvalue()


def _make_png(width: int = 100, height: int = 100) -> bytes:
    buf = BytesIO()
    Image.new("RGBA", (width, height), color=(0, 200, 100, 200)).save(buf, format="PNG")
    return buf.getvalue()


def _to_data_uri(image_bytes: bytes, mime: str) -> bytes:
    b64 = base64.b64encode(image_bytes).decode()
    return f"data:{mime};base64,{b64}".encode()


class TestParseDataUri:
    def test_plain_jpeg_detected(self):
        jpeg = _make_jpeg()
        raw, mime = parse_data_uri(jpeg)
        assert raw == jpeg
        assert mime == "image/jpeg"

    def test_plain_png_detected(self):
        png = _make_png()
        raw, mime = parse_data_uri(png)
        assert raw == png
        assert mime == "image/png"

    def test_data_uri_jpeg_decoded(self):
        jpeg = _make_jpeg()
        uri = _to_data_uri(jpeg, "image/jpeg")
        raw, mime = parse_data_uri(uri)
        assert raw == jpeg
        assert mime == "image/jpeg"

    def test_data_uri_png_decoded(self):
        png = _make_png()
        uri = _to_data_uri(png, "image/png")
        raw, mime = parse_data_uri(uri)
        assert raw == png
        assert mime == "image/png"

    def test_malformed_data_uri_raises(self):
        with pytest.raises(ValueError, match="Malformed"):
            parse_data_uri(b"data:image/jpeg;base64_no_comma_here")


class TestEncodeDecodeRoundtrip:
    def test_jpeg_roundtrip(self):
        jpeg = _make_jpeg()
        encoded = encode_data_uri(jpeg, "image/jpeg")
        assert encoded.startswith(b"data:image/jpeg;base64,")
        assert decode_data_uri(encoded) == jpeg

    def test_png_roundtrip(self):
        png = _make_png()
        encoded = encode_data_uri(png, "image/png")
        assert decode_data_uri(encoded) == png


class TestShrinkImage:
    def test_empty_input_returned_unchanged(self):
        assert shrink_image(b"") == b""

    def test_valid_jpeg_processed(self):
        result = shrink_image(_make_jpeg())
        assert len(result) > 0

    def test_large_image_shrunk(self):
        large = _make_jpeg(2000, 2000)
        result = shrink_image(large)
        assert len(result) > 0

    def test_accepts_data_uri_input(self):
        jpeg = _make_jpeg()
        uri = _to_data_uri(jpeg, "image/jpeg")
        result = shrink_image(uri)
        assert len(result) > 0

    def test_invalid_bytes_raises_http_exception(self):
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc_info:
            shrink_image(b"not an image")
        assert exc_info.value.status_code == 400


class TestCreateThumbnail:
    def test_empty_input_returns_empty(self):
        assert create_thumbnail(b"") == b""

    def test_produces_jpeg_bytes(self):
        thumb = create_thumbnail(_make_jpeg())
        assert thumb[:2] == b"\xff\xd8"

    def test_thumbnail_is_square(self):
        thumb = create_thumbnail(_make_jpeg(400, 300), size=100)
        img = Image.open(BytesIO(thumb))
        assert img.size == (100, 100)

    def test_accepts_png_input(self):
        thumb = create_thumbnail(_make_png(200, 200))
        assert len(thumb) > 0
        img = Image.open(BytesIO(thumb))
        assert img.format == "JPEG"

    def test_invalid_bytes_raises_http_exception(self):
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc_info:
            create_thumbnail(b"garbage")
        assert exc_info.value.status_code == 400
