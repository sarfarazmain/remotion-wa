"""
Dropbox upload utility with automatic token refresh.

Uses a long-lived refresh token (never expires) to obtain short-lived
access tokens (~4 hours). Videos up to 150 MB use the simple upload
endpoint; larger files use upload sessions (chunked, 8 MB per chunk).

Environment variables (in .env):
    DROPBOX_APP_KEY         - OAuth2 app key
    DROPBOX_APP_SECRET      - OAuth2 app secret
    DROPBOX_REFRESH_TOKEN   - Long-lived refresh token
    DROPBOX_UPLOAD_PATH     - Destination folder (e.g. /renders)
"""

import json
import os
import time
import urllib.request
import urllib.error
import urllib.parse
from pathlib import Path
from typing import Optional, Callable

# Chunk size for upload sessions (8 MB)
CHUNK_SIZE = 8 * 1024 * 1024

# Max file size for simple upload (150 MB)
SIMPLE_UPLOAD_MAX = 150 * 1024 * 1024

# Cache the access token in-memory to avoid refreshing on every call
_token_cache = {"access_token": None, "expires_at": 0}


def _load_env() -> dict:
    """Load Dropbox credentials from environment (dotenv should be loaded already)."""
    keys = {
        "app_key": os.environ.get("DROPBOX_APP_KEY", ""),
        "app_secret": os.environ.get("DROPBOX_APP_SECRET", ""),
        "refresh_token": os.environ.get("DROPBOX_REFRESH_TOKEN", ""),
        "upload_path": os.environ.get("DROPBOX_UPLOAD_PATH", "/renders"),
    }
    return keys


def _get_access_token() -> str:
    """
    Get a valid short-lived access token, refreshing if needed.
    Access tokens last ~4 hours; we refresh with 5 min buffer.
    """
    now = time.time()
    if _token_cache["access_token"] and _token_cache["expires_at"] > now + 300:
        return _token_cache["access_token"]

    env = _load_env()
    if not all([env["app_key"], env["app_secret"], env["refresh_token"]]):
        raise ValueError(
            "Missing Dropbox credentials. Set DROPBOX_APP_KEY, "
            "DROPBOX_APP_SECRET, and DROPBOX_REFRESH_TOKEN in .env"
        )

    data = urllib.parse.urlencode({
        "grant_type": "refresh_token",
        "refresh_token": env["refresh_token"],
        "client_id": env["app_key"],
        "client_secret": env["app_secret"],
    }).encode()

    req = urllib.request.Request(
        "https://api.dropboxapi.com/oauth2/token",
        data=data,
        method="POST",
    )

    try:
        resp = urllib.request.urlopen(req, timeout=30)
        result = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        raise RuntimeError(f"Dropbox token refresh failed ({e.code}): {body}")

    _token_cache["access_token"] = result["access_token"]
    _token_cache["expires_at"] = now + result.get("expires_in", 14400)

    return _token_cache["access_token"]


def is_configured() -> bool:
    """Check if Dropbox credentials are configured."""
    env = _load_env()
    return all([env["app_key"], env["app_secret"], env["refresh_token"]])


def _simple_upload(
    file_path: Path,
    dest_path: str,
    token: str,
) -> dict:
    """Upload a file <=150MB using the simple upload endpoint."""
    with open(file_path, "rb") as f:
        file_data = f.read()

    api_arg = json.dumps({
        "path": dest_path,
        "mode": "overwrite",
        "autorename": False,
        "mute": False,
    })

    req = urllib.request.Request(
        "https://content.dropboxapi.com/2/files/upload",
        data=file_data,
        headers={
            "Authorization": f"Bearer {token}",
            "Dropbox-API-Arg": api_arg,
            "Content-Type": "application/octet-stream",
        },
        method="POST",
    )

    resp = urllib.request.urlopen(req, timeout=300)
    return json.loads(resp.read())


def _session_upload(
    file_path: Path,
    dest_path: str,
    token: str,
    on_progress: Optional[Callable[[float], None]] = None,
) -> dict:
    """Upload a file >150MB using upload sessions (8MB chunks)."""
    file_size = file_path.stat().st_size
    uploaded = 0

    with open(file_path, "rb") as f:
        # Start session
        chunk = f.read(CHUNK_SIZE)
        uploaded += len(chunk)

        req = urllib.request.Request(
            "https://content.dropboxapi.com/2/files/upload_session/start",
            data=chunk,
            headers={
                "Authorization": f"Bearer {token}",
                "Dropbox-API-Arg": json.dumps({"close": False}),
                "Content-Type": "application/octet-stream",
            },
            method="POST",
        )
        resp = urllib.request.urlopen(req, timeout=120)
        result = json.loads(resp.read())
        session_id = result["session_id"]

        if on_progress:
            on_progress(uploaded / file_size)

        # Append chunks
        while True:
            chunk = f.read(CHUNK_SIZE)
            if not chunk:
                break

            remaining = file_size - uploaded - len(chunk)
            is_last = remaining <= 0

            if is_last:
                # Finish session with commit
                api_arg = json.dumps({
                    "cursor": {
                        "session_id": session_id,
                        "offset": uploaded,
                    },
                    "commit": {
                        "path": dest_path,
                        "mode": "overwrite",
                        "autorename": False,
                        "mute": False,
                    },
                })
                req = urllib.request.Request(
                    "https://content.dropboxapi.com/2/files/upload_session/finish",
                    data=chunk,
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Dropbox-API-Arg": api_arg,
                        "Content-Type": "application/octet-stream",
                    },
                    method="POST",
                )
                resp = urllib.request.urlopen(req, timeout=300)
                uploaded += len(chunk)
                if on_progress:
                    on_progress(1.0)
                return json.loads(resp.read())
            else:
                # Append
                api_arg = json.dumps({
                    "cursor": {
                        "session_id": session_id,
                        "offset": uploaded,
                    },
                    "close": False,
                })
                req = urllib.request.Request(
                    "https://content.dropboxapi.com/2/files/upload_session/append_v2",
                    data=chunk,
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Dropbox-API-Arg": api_arg,
                        "Content-Type": "application/octet-stream",
                    },
                    method="POST",
                )
                urllib.request.urlopen(req, timeout=120)
                uploaded += len(chunk)
                if on_progress:
                    on_progress(uploaded / file_size)

    # If we somehow exit the loop without finishing (empty file edge case)
    # finish the session
    api_arg = json.dumps({
        "cursor": {"session_id": session_id, "offset": uploaded},
        "commit": {
            "path": dest_path,
            "mode": "overwrite",
            "autorename": False,
            "mute": False,
        },
    })
    req = urllib.request.Request(
        "https://content.dropboxapi.com/2/files/upload_session/finish",
        data=b"",
        headers={
            "Authorization": f"Bearer {token}",
            "Dropbox-API-Arg": api_arg,
            "Content-Type": "application/octet-stream",
        },
        method="POST",
    )
    resp = urllib.request.urlopen(req, timeout=300)
    return json.loads(resp.read())


def upload_video(
    file_path: Path,
    slug: str,
    on_progress: Optional[Callable[[float], None]] = None,
) -> dict:
    """
    Upload a rendered video to Dropbox.

    Args:
        file_path:    Local path to the .mp4 file
        slug:         Topic slug (used for the destination filename)
        on_progress:  Optional callback(float) for upload progress [0.0, 1.0]

    Returns:
        Dropbox file metadata dict with keys like 'path_display', 'size', etc.

    Raises:
        ValueError:  If credentials are missing
        RuntimeError: If upload fails
        FileNotFoundError: If file doesn't exist
    """
    if not file_path.exists():
        raise FileNotFoundError(f"Video file not found: {file_path}")

    env = _load_env()
    token = _get_access_token()

    # Build destination path: /renders/the-clearing-house.mp4
    upload_dir = env["upload_path"].rstrip("/")
    dest_path = f"{upload_dir}/{slug}.mp4"

    file_size = file_path.stat().st_size

    try:
        if file_size <= SIMPLE_UPLOAD_MAX:
            result = _simple_upload(file_path, dest_path, token)
        else:
            result = _session_upload(file_path, dest_path, token, on_progress)
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        raise RuntimeError(f"Dropbox upload failed ({e.code}): {body}")

    return result


def get_shared_link(path: str) -> Optional[str]:
    """
    Get or create a shared link for a file on Dropbox.
    Returns the URL or None if sharing fails (e.g. missing sharing.write scope).
    """
    try:
        token = _get_access_token()
    except Exception:
        return None

    # First try to get existing shared links
    data = json.dumps({"path": path}).encode()
    req = urllib.request.Request(
        "https://api.dropboxapi.com/2/sharing/list_shared_links",
        data=data,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        resp = urllib.request.urlopen(req, timeout=30)
        result = json.loads(resp.read())
        links = result.get("links", [])
        if links:
            return links[0].get("url")
    except urllib.error.HTTPError:
        pass

    # Create a new shared link
    data = json.dumps({
        "path": path,
        "settings": {
            "requested_visibility": "public",
        },
    }).encode()
    req = urllib.request.Request(
        "https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings",
        data=data,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        resp = urllib.request.urlopen(req, timeout=30)
        result = json.loads(resp.read())
        return result.get("url")
    except urllib.error.HTTPError:
        # Likely missing sharing.write scope — not critical
        return None


def get_dropbox_web_url(path: str) -> str:
    """
    Construct a Dropbox web URL to view the file.
    For App Folder apps, the actual path in Dropbox is /Apps/<AppName>/<path>.
    """
    # URL-encode the path for the Dropbox web viewer
    clean_path = path.lstrip("/")
    return f"https://www.dropbox.com/home/Apps/WealthArchiveRender/{clean_path}"
