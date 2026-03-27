"""Convert user-provided PNGs from Cursor assets into optimized WebP in images/."""
from pathlib import Path

from PIL import Image

ASSETS = Path(
    r"c:\Users\jmend\.cursor\projects\c-Users-jmend-OneDrive-Documents-ANTIGRAVITY-FOLDER-Claude-Code-Open-Router\assets"
)
OUT = Path(__file__).resolve().parents[1] / "images"
MAX_W = 1400
QUALITY = 82

PAIRS = [
    (
        "c__Users_jmend_AppData_Roaming_Cursor_User_workspaceStorage_2bf50608527baac5d26343c210d5c8b4_images_vaginal-infection-orientation-houston-c97b6af8-fc95-452b-8e37-10aa2b567727.png",
        "vaginal-infection-orientation-houston.webp",
    ),
    (
        "c__Users_jmend_AppData_Roaming_Cursor_User_workspaceStorage_2bf50608527baac5d26343c210d5c8b4_images_clinical-trial-patient-hispanic.webp-fb352b5e-59d5-4dc8-b7ab-5da7fefcbf22.png",
        "clinical-trial-patient-hispanic.webp",
    ),
    (
        "c__Users_jmend_AppData_Roaming_Cursor_User_workspaceStorage_2bf50608527baac5d26343c210d5c8b4_images_vaginal-yeast-infection-care-houston.webp-b203cc73-cdb4-45be-af61-f534c44e43ff.png",
        "vaginal-yeast-infection-care-houston.webp",
    ),
    (
        "c__Users_jmend_AppData_Roaming_Cursor_User_workspaceStorage_2bf50608527baac5d26343c210d5c8b4_images_std-testing-confidential-clinic-houston.webp-8684fb06-4713-4f88-88fd-3652e646e361.png",
        "std-testing-confidential-clinic-houston.webp",
    ),
    (
        "c__Users_jmend_AppData_Roaming_Cursor_User_workspaceStorage_2bf50608527baac5d26343c210d5c8b4_images_knee-osteoarthritis-clinical-trial-houston.webp-60c61a98-9f58-466c-b113-cfc76bb3f2fa.png",
        "knee-osteoarthritis-clinical-trial-houston.webp",
    ),
    (
        "c__Users_jmend_AppData_Roaming_Cursor_User_workspaceStorage_2bf50608527baac5d26343c210d5c8b4_images_pap-smear-screening-women-clinic.webp-acb9ad9f-d7ea-4c4d-b4cc-5963480dcc20.png",
        "pap-smear-screening-women-clinic.webp",
    ),
]


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for src_name, dest_name in PAIRS:
        src = ASSETS / src_name
        if not src.is_file():
            raise SystemExit(f"Missing source: {src}")
        im = Image.open(src).convert("RGB")
        w, h = im.size
        if w > MAX_W:
            nh = int(h * (MAX_W / w))
            im = im.resize((MAX_W, nh), Image.Resampling.LANCZOS)
        dest = OUT / dest_name
        im.save(dest, "WEBP", quality=QUALITY, method=6)
        print(f"{dest_name}: {w}x{h} -> {im.size[0]}x{im.size[1]} ({dest.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
