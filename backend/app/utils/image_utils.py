from io import BytesIO
from base64 import b64decode, b64encode
import logging

from fastapi import HTTPException, status
from PIL import Image, UnidentifiedImageError, ImageOps

MAX_IMAGE_SIZE = (1024, 1024)  # width, height in pixels
MAX_FILE_SIZE = 1 * 1024 * 1024  # 1 MB in bytes
JPEG_QUALITY = 85
MIN_JPEG_QUALITY = 20
QUALITY_STEP = 5

logger = logging.getLogger('uvicorn.error')
logger.setLevel(logging.DEBUG)

def decode_data_uri(image_bytes: bytes) -> bytes:
    """Extract and decode base64 data from a data URI."""
    image_data_str = image_bytes.decode('utf-8')
    logger.debug(f"Image format: {image_data_str[:30]}")
    if image_data_str.startswith('data:'):
        image_data_str = image_data_str.split(',', 1)[1]
    return b64decode(image_data_str)


def encode_data_uri(image_bytes: bytes, mime_type: str) -> bytes:
    """Encode image bytes as a data URI."""
    base64_encoded = b64encode(image_bytes).decode('utf-8')
    data_uri = f"data:{mime_type};base64,{base64_encoded}"
    return data_uri.encode('utf-8')


def compress_jpeg(image: Image.Image, max_size: int, start_quality: int = JPEG_QUALITY) -> tuple[bytes, bool]:
    """
    Compress image as JPEG, reducing quality until under max_size.
    
    Returns:
        Tuple of (compressed_bytes, success)
    """
    image = image.convert("RGB")
    quality = start_quality
    
    while quality >= MIN_JPEG_QUALITY:
        buffer = BytesIO()
        image.save(buffer, format="JPEG", quality=quality, optimize=True)
        compressed = buffer.getvalue()
        
        if len(compressed) <= max_size:
            return compressed, True
        
        quality -= QUALITY_STEP
        logger.debug(f"Reducing JPEG quality to {quality}")
    
    return b"", False


def optimize_image(image: Image.Image, original_format: str) -> tuple[bytes, str]:
    """
    Optimize image to be under MAX_FILE_SIZE.
    
    Returns:
        Tuple of (optimized_bytes, final_format)
    """
    format_upper = original_format.upper()
    
    # Try JPEG compression first for JPEG images
    if format_upper in {"JPEG", "JPG"}:
        compressed, success = compress_jpeg(image, MAX_FILE_SIZE)
        if success:
            return compressed, "JPEG"
        logger.warning(f"JPEG compression resulted in {len(compressed)} bytes")
        return compressed, "JPEG"
    
    # Try PNG optimization for PNG images
    if format_upper == "PNG":
        buffer = BytesIO()
        image.save(buffer, format="PNG", optimize=True)
        optimized = buffer.getvalue()
        
        if len(optimized) <= MAX_FILE_SIZE:
            return optimized, "PNG"
        
        logger.debug("PNG too large, converting to JPEG")
    
    # Fallback: convert to JPEG with progressive quality reduction
    compressed, success = compress_jpeg(image, MAX_FILE_SIZE)
    if not success:
        logger.warning(f"Unable to compress image below {MAX_FILE_SIZE} bytes (final: {len(compressed)})")
    
    return compressed, "JPEG"


def shrink_image(image_bytes: bytes) -> bytes:
    """
    Downscale and recompress raw image bytes.

    Args:
        image_bytes: Raw image bytes containing a data URI (e.g., b"data:image/jpeg;base64,...")

    Returns:
        Bytes of the optimized image as a data URI (max 1 MB).

    Raises:
        HTTPException: If the provided bytes are not a valid image.
    """
    if not image_bytes:
        return image_bytes
    
    try:
        actual_image_bytes = decode_data_uri(image_bytes)
        
        with Image.open(BytesIO(actual_image_bytes)) as image:
            original_format = image.format or "PNG"
            image = ImageOps.exif_transpose(image)
            image.thumbnail(MAX_IMAGE_SIZE, Image.Resampling.LANCZOS)
            
            optimized_bytes, final_format = optimize_image(image, original_format)
            
            # Use optimized version if it's actually smaller
            if len(optimized_bytes) < len(actual_image_bytes):
                final_bytes = optimized_bytes
            else:
                final_bytes = actual_image_bytes
                final_format = original_format
            
            mime_type = f"image/{final_format.lower()}"
            shrunk_bytes = encode_data_uri(final_bytes, mime_type)
            logger.debug(f"Image compressed {(1-len(shrunk_bytes)/len(actual_image_bytes))*100:.2f}%")
            return shrunk_bytes

    except (UnidentifiedImageError, OSError, ValueError) as exc:
        logger.error(f"Error shrinking image: {exc}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded image is invalid or corrupted.",
        ) from exc