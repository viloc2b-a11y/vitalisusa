"""Generate small SEO-named WebP placeholders for VITALIS (gradients, no stock photos)."""
from __future__ import annotations

import os
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "images"
W, H = 960, 540  # 16:9, modest size for heroes


def gradient(name: str, c1: tuple[int, int, int], c2: tuple[int, int, int]) -> None:
    img = Image.new("RGB", (W, H))
    px = img.load()
    for y in range(H):
        t = y / max(H - 1, 1)
        r = int(c1[0] * (1 - t) + c2[0] * t)
        g = int(c1[1] * (1 - t) + c2[1] * t)
        b = int(c1[2] * (1 - t) + c2[2] * t)
        for x in range(W):
            px[x, y] = (r, g, b)
    # Soft vignette (keeps file small, looks less flat)
    draw = ImageDraw.Draw(img, "RGBA")
    draw.rectangle([0, 0, W, H], outline=(0, 0, 0, 0))
    path = OUT / name
    img.save(path, "WEBP", quality=72, method=6)
    print(f"Wrote {path} ({path.stat().st_size // 1024} KB)")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    # Navy / teal / warm tones — distinct per topic, on-brand
    specs = [
        ("knee-osteoarthritis-clinical-trial-houston.webp", (15, 45, 75), (42, 120, 110)),
        ("pap-smear-screening-women-clinic.webp", (90, 55, 70), (180, 120, 130)),
        ("std-testing-confidential-clinic-houston.webp", (20, 50, 85), (35, 90, 95)),
        ("clinical-trial-patient-hispanic.webp", (0, 54, 92), (42, 157, 143)),
        ("vaginal-yeast-infection-care-houston.webp", (55, 75, 95), (130, 150, 170)),
        ("abnormal-vaginal-discharge-education-houston.webp", (70, 85, 100), (120, 140, 155)),
        ("womens-intimate-health-hub-houston.webp", (45, 65, 90), (95, 125, 145)),
        ("gynecologic-consultation-women-houston.webp", (75, 60, 85), (140, 115, 130)),
        ("vaginal-infection-orientation-houston.webp", (40, 70, 85), (90, 130, 125)),
        ("intimate-wellbeing-trust-houston.webp", (50, 80, 95), (100, 145, 140)),
        ("candidiasis-education-womens-health-houston.webp", (65, 75, 95), (115, 135, 155)),
        ("womens-health-orientation-spanish-houston.webp", (0, 65, 95), (45, 130, 125)),
    ]
    for fname, c1, c2 in specs:
        gradient(fname, c1, c2)


if __name__ == "__main__":
    main()
