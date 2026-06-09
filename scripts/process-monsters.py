#!/usr/bin/env python3
"""Split 2x2 monster sheets, dedupe, and export numbered PNGs."""

from __future__ import annotations

import json
import shutil
from collections import deque
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw
import imagehash

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT.parent.parent / ".cursor" / "projects" / "Users-niccomino-Desktop-monsterz" / "assets"
OUT = ROOT / "public" / "monsters"
SKIP_SHEETS = {"image-428b1d5d-511a-418f-a29a-95a518720e6a.png"}
BLOB_SHEETS = {"image-03cff508-0f9a-43a1-b0d2-5533eb6bdf90.png"}
CHECKERBOARD_SHEETS = {"image-23a970c9-fbf0-471e-868c-b6e48cef5624.png"}
MIN_BLOB_AREA = 8_000

# Near-duplicates flagged by visual review (lazy GPT recolors / same archetype)
MANUAL_REMOVALS: dict[str, str] = {
    "image-9b67f94d-e520-4e5b-8cf4-f4de7d87a3c9.png:bl": "Green slime stalks (dup of lollipop slime)",
    "image-cd840fdb-1ef7-4ce2-af91-ee626eabe761.png:tl": "Green cyclops wave (lazy recolor of pink cyclops)",
    "image-549bd4ab-17b7-4806-b27e-8a3e56221630.png:br": "Blue water shark (dup of anglerfish)",
    "image-a8388ef2-24bc-49b6-a36f-3dcd8d262d83.png:br": "Purple crystal (dup of candy crystal)",
    "image-cd840fdb-1ef7-4ce2-af91-ee626eabe761.png:tr": "Blue 3-eye furry (dup of teal 3-eye dragon)",
}

PHASH_THRESHOLD = 6
DHASH_THRESHOLD = 8
BG_THRESHOLD = 42
LIGHT_BG_THRESHOLD = 200


@dataclass
class MonsterCrop:
    source: str
    quadrant: str
    image: Image.Image
    phash: imagehash.ImageHash
    dhash: imagehash.ImageHash

    @property
    def key(self) -> str:
        return f"{self.source}:{self.quadrant}"


def split_grid(path: Path) -> dict[str, Image.Image]:
    img = Image.open(path).convert("RGBA")
    w, h = img.size
    hw, hh = w // 2, h // 2
    return {
        "tl": img.crop((0, 0, hw, hh)),
        "tr": img.crop((hw, 0, w, hh)),
        "bl": img.crop((0, hh, hw, h)),
        "br": img.crop((hw, hh, w, h)),
    }


def find_content_blobs(image: Image.Image) -> list[tuple[int, tuple[int, int, int, int]]]:
    rgba = image.convert("RGBA")
    width, height = rgba.size
    alpha = rgba.split()[-1]
    pixels = alpha.load()
    seen = bytearray(width * height)
    blobs: list[tuple[int, tuple[int, int, int, int]]] = []

    for start_y in range(height):
        for start_x in range(width):
            index = start_y * width + start_x
            if seen[index] or pixels[start_x, start_y] < 20:
                continue

            queue: deque[tuple[int, int]] = deque([(start_x, start_y)])
            seen[index] = 1
            min_x = max_x = start_x
            min_y = max_y = start_y
            area = 0

            while queue:
                x, y = queue.popleft()
                area += 1
                min_x = min(min_x, x)
                max_x = max(max_x, x)
                min_y = min(min_y, y)
                max_y = max(max_y, y)

                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if nx < 0 or ny < 0 or nx >= width or ny >= height:
                        continue
                    n_index = ny * width + nx
                    if seen[n_index] or pixels[nx, ny] < 20:
                        continue
                    seen[n_index] = 1
                    queue.append((nx, ny))

            if area >= MIN_BLOB_AREA:
                blobs.append((area, (min_x, min_y, max_x + 1, max_y + 1)))

    return blobs


def split_blobs(path: Path) -> dict[str, Image.Image]:
    image = remove_solid_background(Image.open(path).convert("RGBA"))
    blobs = find_content_blobs(image)
    blobs.sort(key=lambda item: ((item[1][1] + item[1][3]) / 2, (item[1][0] + item[1][2]) / 2))

    crops: dict[str, Image.Image] = {}
    pad = 12
    for index, (_, (left, top, right, bottom)) in enumerate(blobs, start=1):
        box = (
            max(0, left - pad),
            max(0, top - pad),
            min(image.width, right + pad),
            min(image.height, bottom + pad),
        )
        crops[f"m{index}"] = image.crop(box)

    return crops


def split_sheet(path: Path) -> dict[str, Image.Image]:
    if path.name in BLOB_SHEETS:
        return split_blobs(path)
    return split_grid(path)


def is_checker_flood_tone(r: int, g: int, b: int) -> bool:
    if max(r, g, b) - min(r, g, b) > 8:
        return False
    minimum = min(r, g, b)
    return 240 <= minimum <= 251


def is_checker_scrub_tone(r: int, g: int, b: int) -> bool:
    if max(r, g, b) - min(r, g, b) > 8:
        return False
    minimum = min(r, g, b)
    return 240 <= minimum <= 247


def is_checkerboard_pixel(r: int, g: int, b: int, a: int) -> bool:
    if a < 20:
        return True
    return is_checker_flood_tone(r, g, b)


def is_light_background_pixel(r: int, g: int, b: int, a: int) -> bool:
    if a < 20:
        return True
    if is_checkerboard_pixel(r, g, b, a):
        return True
    if min(r, g, b) >= LIGHT_BG_THRESHOLD:
        return True
    if min(r, g, b) >= 185 and max(r, g, b) - min(r, g, b) <= 18:
        return True
    return False


def is_dark_background_pixel(r: int, g: int, b: int, a: int) -> bool:
    if a < 20:
        return True
    return r <= BG_THRESHOLD and g <= BG_THRESHOLD and b <= BG_THRESHOLD


def detect_bg_mode(image: Image.Image) -> str:
    """Checkerboard exports need light-only removal to protect dark character details."""
    rgba = image.convert("RGBA")
    width, height = rgba.size
    pixels = rgba.load()
    sample_points = [
        (0, 0),
        (width - 1, 0),
        (0, height - 1),
        (width - 1, height - 1),
        (width // 2, 0),
        (0, height // 2),
        (width - 1, height // 2),
        (width // 2, height - 1),
    ]

    light = 0
    dark = 0
    for x, y in sample_points:
        r, g, b, a = pixels[x, y]
        if a < 20:
            continue
        if is_light_background_pixel(r, g, b, a):
            light += 1
        elif is_dark_background_pixel(r, g, b, a):
            dark += 1

    if light >= 4 and light >= dark:
        return "light"
    if dark > light:
        return "dark"
    return "both"


def is_background_pixel(r: int, g: int, b: int, a: int, mode: str) -> bool:
    if a < 20:
        return True
    if mode in {"dark", "both"} and is_dark_background_pixel(r, g, b, a):
        return True
    if mode in {"light", "both"} and is_light_background_pixel(r, g, b, a):
        return True
    return False


def flood_fill_background(
    rgba: Image.Image,
    predicate,
) -> Image.Image:
    width, height = rgba.size
    pixels = rgba.load()
    visited = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def index(x: int, y: int) -> int:
        return y * width + x

    def try_seed(x: int, y: int) -> None:
        i = index(x, y)
        if visited[i]:
            return
        r, g, b, a = pixels[x, y]
        if predicate(r, g, b, a):
            visited[i] = 1
            queue.append((x, y))

    for x in range(width):
        try_seed(x, 0)
        try_seed(x, height - 1)
    for y in range(height):
        try_seed(0, y)
        try_seed(width - 1, y)

    while queue:
        x, y = queue.popleft()
        pixels[x, y] = (0, 0, 0, 0)
        if x > 0:
            try_seed(x - 1, y)
        if x < width - 1:
            try_seed(x + 1, y)
        if y > 0:
            try_seed(x, y - 1)
        if y < height - 1:
            try_seed(x, y + 1)

    return rgba


def scrub_checkerboard_pixels(rgba: Image.Image) -> Image.Image:
    pixels = rgba.load()
    width, height = rgba.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a > 20 and is_checker_scrub_tone(r, g, b):
                pixels[x, y] = (0, 0, 0, 0)
    return rgba


def remove_checkerboard_background(image: Image.Image) -> Image.Image:
    """Remove GPT checkerboard exports without eating white character fills."""
    rgba = image.convert("RGBA")
    flood_fill_background(
        rgba,
        lambda r, g, b, a: a < 20 or is_checker_flood_tone(r, g, b),
    )
    scrub_checkerboard_pixels(rgba)
    return rgba


def remove_solid_background(image: Image.Image, mode: str | None = None) -> Image.Image:
    """Flood-fill background pixels connected to the image edge."""
    rgba = image.convert("RGBA")
    bg_mode = mode or detect_bg_mode(rgba)

    if bg_mode == "light":
        return remove_checkerboard_background(rgba)

    predicate = lambda r, g, b, a: is_background_pixel(r, g, b, a, bg_mode)
    return flood_fill_background(rgba, predicate)


def trim_crop(crop: Image.Image, source_name: str = "") -> Image.Image:
    if source_name in CHECKERBOARD_SHEETS:
        crop = remove_checkerboard_background(crop)
    else:
        crop = remove_solid_background(crop)
    alpha = crop.split()[-1]
    bbox = alpha.point(lambda p: 255 if p > 20 else 0).getbbox()
    if bbox is None:
        rgb = crop.convert("RGB")
        bbox = rgb.point(lambda p: 0 if p > BG_THRESHOLD else 255, mode="1").getbbox()
    if not bbox:
        return crop
    pad = 8
    l = max(0, bbox[0] - pad)
    t = max(0, bbox[1] - pad)
    r = min(crop.width, bbox[2] + pad)
    b = min(crop.height, bbox[3] + pad)
    return crop.crop((l, t, r, b))


def normalize(img: Image.Image, size: int = 256) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    thumb = img.copy()
    thumb.thumbnail((size - 16, size - 16), Image.Resampling.LANCZOS)
    x = (size - thumb.width) // 2
    y = (size - thumb.height) // 2
    canvas.paste(thumb, (x, y), thumb)
    return canvas


def extract_all() -> list[MonsterCrop]:
    crops: list[MonsterCrop] = []
    for path in sorted(ASSETS.glob("*.png")):
        if path.name in SKIP_SHEETS:
            continue
        for quadrant, raw in split_sheet(path).items():
            if path.name in BLOB_SHEETS:
                image = raw
            else:
                image = trim_crop(raw, path.name)
            rgb = image.convert("RGB")
            crops.append(
                MonsterCrop(
                    source=path.name,
                    quadrant=quadrant,
                    image=image,
                    phash=imagehash.phash(rgb),
                    dhash=imagehash.dhash(rgb),
                )
            )
    return crops


def is_hash_duplicate(a: MonsterCrop, b: MonsterCrop) -> bool:
    return (
        a.phash - b.phash <= PHASH_THRESHOLD
        and a.dhash - b.dhash <= DHASH_THRESHOLD
    )


def dedupe(crops: list[MonsterCrop]) -> tuple[list[MonsterCrop], list[dict]]:
    unique: list[MonsterCrop] = []
    removed: list[dict] = []

    for crop in crops:
        if crop.key in MANUAL_REMOVALS:
            removed.append(
                {
                    "source": crop.key,
                    "reason": f"manual: {MANUAL_REMOVALS[crop.key]}",
                }
            )
            continue

        match = next((u for u in unique if is_hash_duplicate(crop, u)), None)
        if match:
            removed.append(
                {
                    "source": crop.key,
                    "reason": f"hash match: {match.key} (phash={crop.phash - match.phash})",
                }
            )
            continue

        unique.append(crop)

    return unique, removed


def assign_stable_slots(unique: list[MonsterCrop]) -> list[tuple[int, MonsterCrop]]:
    manifest_path = OUT / "manifest.json"
    preserved: dict[str, int] = {}

    if manifest_path.exists():
        previous = json.loads(manifest_path.read_text())
        for entry in previous.get("monsters", []):
            preserved[entry["source"]] = int(entry["slot"])

    by_key = {crop.key: crop for crop in unique}
    used_slots = set(preserved.values())
    next_slot = max(used_slots, default=0) + 1

    for key in sorted(by_key):
        if key in preserved:
            continue
        while next_slot in used_slots:
            next_slot += 1
        preserved[key] = next_slot
        used_slots.add(next_slot)
        next_slot += 1

    assigned = [(slot, by_key[key]) for key, slot in preserved.items() if key in by_key]
    assigned.sort(key=lambda item: item[0])
    return assigned


def write_outputs(unique: list[MonsterCrop], removed: list[dict]) -> None:
    staging = OUT / "_staging"
    if staging.exists():
        shutil.rmtree(staging)
    staging.mkdir(parents=True)

    assigned = assign_stable_slots(unique)

    manifest = {
        "total_extracted": len(unique) + len(removed),
        "unique_count": len(unique),
        "target_count": 30,
        "removed": removed,
        "monsters": [],
    }

    for index, crop in assigned:
        target = staging / f"{index:02d}.png"
        normalize(crop.image).save(target, "PNG")
        manifest["monsters"].append(
            {
                "slot": f"{index:02d}",
                "source": crop.key,
            }
        )

    # Swap numbered PNGs into place, keep README + contact sheet out of numbered slots
    for old in OUT.glob("[0-9][0-9].png"):
        old.unlink()

    for png in sorted(staging.glob("*.png")):
        shutil.move(str(png), str(OUT / png.name))
    staging.rmdir()

    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")

    # Contact sheet for quick visual QA
    cols, cell = 7, 128
    rows = (len(assigned) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * cell, rows * cell), (30, 30, 30, 255))
    draw = ImageDraw.Draw(sheet)
    for i, (slot, crop) in enumerate(assigned):
        thumb = normalize(crop.image, 120)
        x = (i % cols) * cell + (cell - thumb.width) // 2
        y = (i // cols) * cell + 16
        sheet.paste(thumb, (x, y), thumb)
        draw.text((i % cols * cell + 4, i // cols * cell + 2), f"{slot:02d}", fill=(255, 255, 255))
    sheet.save(OUT / "_contact-sheet.png")


def main() -> None:
    if not ASSETS.exists():
        raise SystemExit(f"Assets folder not found: {ASSETS}")

    crops = extract_all()
    unique, removed = dedupe(crops)
    write_outputs(unique, removed)

    print(f"Extracted: {len(crops)}")
    print(f"Removed:   {len(removed)}")
    print(f"Unique:    {len(unique)}")
    if len(unique) < 30:
        print(f"Need {30 - len(unique)} more unique monsters for a full class of 30.")
    print("\nRemoved:")
    for item in removed:
        print(f"  - {item['source']}: {item['reason']}")


if __name__ == "__main__":
    main()
