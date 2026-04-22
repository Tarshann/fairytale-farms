#!/usr/bin/env python3
"""
Image optimization script for Fairytale Farms.
Resizes images to max 1600px wide and compresses JPEGs to 85% quality.
Skips images that are already under 300KB.
"""
import os
import sys
from pathlib import Path
from PIL import Image

PUBLIC_DIR = Path(__file__).parent.parent / "client" / "public"
MAX_WIDTH = 1600
MAX_HEIGHT = 1600
JPEG_QUALITY = 85
SKIP_THRESHOLD_KB = 300  # Skip files already under this size

def optimize_image(path: Path) -> tuple[int, int]:
    """Returns (original_size_kb, new_size_kb)."""
    original_size = path.stat().st_size // 1024
    if original_size < SKIP_THRESHOLD_KB:
        return original_size, original_size  # Already small enough

    try:
        with Image.open(path) as img:
            # Convert RGBA/P to RGB for JPEG
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")

            # Resize if needed
            w, h = img.size
            if w > MAX_WIDTH or h > MAX_HEIGHT:
                img.thumbnail((MAX_WIDTH, MAX_HEIGHT), Image.LANCZOS)

            # Save with compression
            suffix = path.suffix.lower()
            if suffix in (".jpg", ".jpeg"):
                img.save(path, "JPEG", quality=JPEG_QUALITY, optimize=True)
            elif suffix == ".png":
                img.save(path, "PNG", optimize=True)
            elif suffix == ".webp":
                img.save(path, "WEBP", quality=JPEG_QUALITY, method=6)

        new_size = path.stat().st_size // 1024
        return original_size, new_size
    except Exception as e:
        print(f"  ⚠️  Failed to optimize {path.name}: {e}")
        return original_size, original_size


def main():
    extensions = {".jpg", ".jpeg", ".png", ".webp"}
    image_files = [
        p for p in PUBLIC_DIR.rglob("*")
        if p.suffix.lower() in extensions and p.is_file()
    ]

    print(f"Found {len(image_files)} images in {PUBLIC_DIR}")
    print(f"Optimizing images larger than {SKIP_THRESHOLD_KB}KB...\n")

    total_saved = 0
    optimized = 0
    skipped = 0

    for img_path in sorted(image_files):
        orig_kb, new_kb = optimize_image(img_path)
        saved = orig_kb - new_kb
        if saved > 0:
            total_saved += saved
            optimized += 1
            print(f"  ✅ {img_path.relative_to(PUBLIC_DIR)}: {orig_kb}KB → {new_kb}KB (saved {saved}KB)")
        else:
            skipped += 1

    print(f"\n{'='*60}")
    print(f"Optimized: {optimized} images")
    print(f"Skipped:   {skipped} images (already small)")
    print(f"Total saved: {total_saved / 1024:.1f} MB")


if __name__ == "__main__":
    main()
