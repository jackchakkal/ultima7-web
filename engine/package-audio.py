"""Extract only The Black Gate audio choices from the official Exult packs."""
from pathlib import Path, PurePosixPath
import re
import shutil
import sys
import zipfile


def copy_entry(archive, name, destination):
    target = destination / PurePosixPath(name).name
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(archive.read(name))


def main():
    if len(sys.argv) != 3:
        raise SystemExit("usage: python engine/package-audio.py EXULT_AUDIO.zip JD_HARDING.zip")
    exult_path, jd_path = map(Path, sys.argv[1:])
    root = Path(__file__).resolve().parents[1] / "dist/audio"
    for directory in (root / "music/mt32", root / "music/jd-hardings-remix"):
        shutil.rmtree(directory, ignore_errors=True)
    with zipfile.ZipFile(exult_path) as pack:
        for source, target in (("jmsfx.flx", "sfx-soundblaster.flx"),
                               ("sqsfxbg.flx", "sfx-mt32.flx")):
            (root / target).write_bytes(pack.read(source))
        for name in pack.namelist():
            if not name.startswith("music/") or not name.lower().endswith(".ogg"):
                continue
            filename = PurePosixPath(name).name.lower()
            if re.fullmatch(r"\d\dbg\.ogg", filename) or filename in {
                "end01bg.ogg", "end02bg.ogg", "endcr01.ogg", "endcr02.ogg"
            }:
                copy_entry(pack, name, root / "music/mt32")
    with zipfile.ZipFile(jd_path) as pack:
        for name in pack.namelist():
            bg_track = name.startswith("BlackGate/") and name.lower().endswith(".ogg")
            ambiance = name.startswith("Ambiance/") and PurePosixPath(name).name.lower() in {
                "04bg.ogg", "05bg.ogg"
            }
            if bg_track or ambiance:
                copy_entry(pack, name, root / "music/jd-hardings-remix")
    (root / "README.txt").write_text(
        """Ultima VII: The Black Gate browser audio resources

Digital MT-32 recordings by Simon Quinn; MT-32 effects by Simon Quinn.
SoundBlaster effects by Joseph Morris. JD Harding's fan remix is separate.
Source packages and credits: https://exult.sourceforge.io/download.html
Only Black Gate audio is included; no Serpent Isle packs are copied.
""",
        encoding="utf-8",
    )
    print(f"Packaged Black Gate audio in {root}")


if __name__ == "__main__":
    main()
