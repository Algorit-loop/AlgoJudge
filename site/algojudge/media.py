"""Storing uploaded images for problem statements.

Files are content-addressed (sha256), so re-uploading the same image is free and names are unguessable.
Only raster formats are accepted, detected from the file's bytes rather than its name or the client's
Content-Type: SVG can carry scripts, so it is refused.
"""

import hashlib
import os
import tempfile
from pathlib import Path

# magic bytes -> extension
_SIGNATURES: list[tuple[bytes, str]] = [
    (b"\x89PNG\r\n\x1a\n", "png"),
    (b"\xff\xd8\xff", "jpg"),
    (b"GIF87a", "gif"),
    (b"GIF89a", "gif"),
]


def detect_image_type(data: bytes) -> str | None:
    for magic, ext in _SIGNATURES:
        if data.startswith(magic):
            return ext
    if len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "webp"
    return None


def save_problem_image(media_dir: str, problem_code: str, data: bytes, ext: str) -> str:
    """Write the image and return its path relative to media_dir."""
    name = f"{hashlib.sha256(data).hexdigest()[:32]}.{ext}"
    rel = Path("problems") / problem_code / name
    target = Path(media_dir) / rel
    if not target.exists():
        target.parent.mkdir(parents=True, exist_ok=True)
        # Write to a temp file then rename, so nginx never serves a half-written image.
        fd, tmp = tempfile.mkstemp(dir=target.parent, prefix=".upload-")
        with os.fdopen(fd, "wb") as f:
            f.write(data)
        os.chmod(tmp, 0o644)
        os.replace(tmp, target)
    return rel.as_posix()
