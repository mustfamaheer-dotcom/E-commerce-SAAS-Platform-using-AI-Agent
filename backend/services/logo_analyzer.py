# backend/services/logo_analyzer.py
import io
import os
import colorsys
from typing import Dict, Any, List, Tuple
from PIL import Image


def rgb_to_hex(rgb: Tuple[int, int, int]) -> str:
    """Converts (R, G, B) to hex #RRGGBB."""
    return "#{:02x}{:02x}{:02x}".format(
        max(0, min(255, int(rgb[0]))),
        max(0, min(255, int(rgb[1]))),
        max(0, min(255, int(rgb[2]))),
    )


def hex_to_rgb(hex_code: str) -> Tuple[int, int, int]:
    hex_code = hex_code.lstrip("#")
    if len(hex_code) == 3:
        hex_code = "".join(c * 2 for c in hex_code)
    return tuple(int(hex_code[i:i+2], 16) for i in (0, 2, 4))


def color_distance(c1: Tuple[int, int, int], c2: Tuple[int, int, int]) -> float:
    """Euclidean distance in RGB color space."""
    return ((c1[0] - c2[0]) ** 2 + (c1[1] - c2[1]) ** 2 + (c1[2] - c2[2]) ** 2) ** 0.5


def extract_dominant_colors(image_bytes: bytes, max_colors: int = 5) -> List[str]:
    """
    Real Vision-based color extraction that properly handles:
    1. Alpha transparency in PNG / WebP (discards transparent or semi-transparent pixels).
    2. Background filtering (near-pure white canvas, pitch black padding, neutral grays).
    3. Saturation and vibrance weighting so brand logos prioritize actual logo emblems/icons.
    4. Perceptually distinct primary, secondary, and accent colors.
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
        image = image.convert("RGBA")
        image.thumbnail((120, 120), Image.Resampling.LANCZOS)

        buckets: Dict[Tuple[int, int, int], float] = {}

        for pixel in image.getdata():
            r, g, b, a = pixel
            # Discard transparent or semi-transparent pixels (crucial for PNG logos)
            if a < 110:
                continue

            # Convert to HSV
            h, s, v = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
            brightness = (r * 299 + g * 587 + b * 114) / 1000.0

            # Filter pure white or off-white background canvases
            if brightness > 238 and s < 0.15:
                continue
            # Filter pure black or near-black backgrounds
            if brightness < 28 and s < 0.2:
                continue
            # Filter dull washed out grays
            if s < 0.12 and (brightness > 200 or brightness < 50):
                continue

            # Quantize color into bins of size 24
            bin_r = min(255, (r // 24) * 24 + 12)
            bin_g = min(255, (g // 24) * 24 + 12)
            bin_b = min(255, (b // 24) * 24 + 12)
            bucket_key = (bin_r, bin_g, bin_b)

            # Weight by saturation and balanced brightness (boost vivid brand colors)
            weight = 1.0 + (s * 4.0) + (1.0 if 50 <= brightness <= 210 else 0.0)
            buckets[bucket_key] = buckets.get(bucket_key, 0.0) + weight

        distinct_colors: List[Tuple[int, int, int]] = []
        if buckets:
            # Sort buckets by weighted frequency descending
            sorted_buckets = sorted(buckets.items(), key=lambda item: item[1], reverse=True)

            for color, _ in sorted_buckets:
                # Ensure each color is distinct from already chosen ones
                if all(color_distance(color, c) >= 55 for c in distinct_colors):
                    distinct_colors.append(color)
                if len(distinct_colors) >= max_colors:
                    break

        # Fallback if image was purely monochrome (e.g. black & white icon)
        if not distinct_colors:
            return ["#0ea5e9", "#6366f1", "#10b981", "#f59e0b"]

        # If only 1 or 2 distinct colors found, create harmonious complementary colors
        if len(distinct_colors) == 1:
            r, g, b = distinct_colors[0]
            h, s, v = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
            # Shift hue for secondary
            sec_rgb = colorsys.hsv_to_rgb((h + 0.15) % 1.0, max(0.6, s), min(0.9, max(0.4, v)))
            acc_rgb = colorsys.hsv_to_rgb((h + 0.5) % 1.0, max(0.7, s), 0.95)
            distinct_colors.append(tuple(int(x * 255) for x in sec_rgb))
            distinct_colors.append(tuple(int(x * 255) for x in acc_rgb))
        elif len(distinct_colors) == 2:
            r, g, b = distinct_colors[0]
            h, s, v = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
            acc_rgb = colorsys.hsv_to_rgb((h + 0.33) % 1.0, max(0.7, s), 0.95)
            distinct_colors.append(tuple(int(x * 255) for x in acc_rgb))

        return [rgb_to_hex(c) for c in distinct_colors[:max_colors]]

    except Exception as e:
        print(f"Error analyzing logo: {e}")
        return ["#0ea5e9", "#6366f1", "#10b981", "#f59e0b"]


def analyze_logo_and_generate_theme(image_bytes: bytes, store_name: str = "Store") -> Dict[str, Any]:
    """
    Analyzes brand logo and generates a comprehensive, production-ready design palette.
    """
    dominant_colors = extract_dominant_colors(image_bytes)
    primary = dominant_colors[0] if dominant_colors else "#0ea5e9"
    secondary = dominant_colors[1] if len(dominant_colors) > 1 else "#6366f1"
    accent = dominant_colors[2] if len(dominant_colors) > 2 else "#10b981"

    return {
        "mode": "dark",
        "primaryColor": primary,
        "secondaryColor": secondary,
        "accentColor": accent,
        "backgroundDark": "#020617",
        "backgroundLight": "#f8fafc",
        "surfaceDark": "#0f172a",
        "surfaceLight": "#ffffff",
        "textDark": "#f8fafc",
        "textLight": "#0f172a",
        "dominantPalette": dominant_colors,
        "fontFamily": "Cairo, sans-serif",
    }
