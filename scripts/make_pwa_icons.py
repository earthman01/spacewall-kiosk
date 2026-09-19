#!/usr/bin/env python3
"""Generate distinct SPACEWALL / HEARTH PWA icons (PNG)."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
ICONS = ROOT / "icons"
FONT = Path("/usr/share/fonts/truetype/macos/Inter-Bold.ttf")
SIZES = (192, 512)


def load_font(size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONT), size=size)


def draw_letter(
    size: int,
    letter: str,
    bg: tuple[int, int, int],
    fg: tuple[int, int, int],
    glow: tuple[int, int, int] | None = None,
) -> Image.Image:
    img = Image.new("RGB", (size, size), bg)
    draw = ImageDraw.Draw(img)
    font = load_font(int(size * 0.62))
    bbox = draw.textbbox((0, 0), letter, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (size - tw) / 2 - bbox[0]
    y = (size - th) / 2 - bbox[1] - size * 0.02

    if glow:
        glow_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        gdraw = ImageDraw.Draw(glow_layer)
        gdraw.text((x, y), letter, font=font, fill=(*glow, 180))
        glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=size * 0.045))
        img = Image.alpha_composite(img.convert("RGBA"), glow_layer).convert("RGB")
        draw = ImageDraw.Draw(img)

    draw.text((x, y), letter, font=font, fill=fg)
    return img


def main() -> None:
    ICONS.mkdir(parents=True, exist_ok=True)
    spacewall = {
        "letter": "S",
        "bg": (7, 7, 8),
        "fg": (255, 0, 51),
        "glow": (255, 0, 51),
        "prefix": "spacewall",
    }
    hearth = {
        "letter": "H",
        "bg": (12, 10, 11),
        "fg": (196, 90, 72),
        "glow": (106, 36, 48),
        "prefix": "hearth",
    }
    for spec in (spacewall, hearth):
        for size in SIZES:
            img = draw_letter(
                size, spec["letter"], spec["bg"], spec["fg"], spec["glow"]
            )
            out = ICONS / f"{spec['prefix']}-{size}.png"
            img.save(out, "PNG")
            print(f"wrote {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
