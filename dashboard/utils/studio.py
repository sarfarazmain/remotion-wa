"""
Remotion Studio + Cloudflare Tunnel lifecycle manager.

Starts/stops Remotion Studio (port 3000) and optionally a Cloudflare tunnel
so the composition can be previewed before rendering.

All process operations use posix_spawnp via launch.py — completely fork-free.
"""

import os
import re
import shutil
import tempfile
import time
from pathlib import Path

from .state import get_project_root
from .launch import spawn_shell, kill_by_port, kill_by_name

# Log files for Studio and Tunnel processes
_STUDIO_LOG = None
_TUNNEL_LOG = None


def start_studio() -> bool:
    """
    Start Remotion Studio on port 3000.
    Returns True if Studio started successfully.
    """
    global _STUDIO_LOG

    # Check if already running
    if is_studio_running():
        return True

    project_root = get_project_root()
    npx_bin = shutil.which("npx") or "npx"

    fd, log_path = tempfile.mkstemp(suffix=".log", prefix="studio_")
    os.close(fd)
    _STUDIO_LOG = log_path

    cmd = f'cd "{project_root}" && "{npx_bin}" remotion studio --port 3000'
    spawn_shell(cmd, log_path=log_path)

    # Poll for Studio to be ready
    for _ in range(60):  # 30 seconds
        time.sleep(0.5)
        if is_studio_running():
            return True
        try:
            log_content = Path(log_path).read_text()
            if "localhost:3000" in log_content or "Server" in log_content:
                return True
        except Exception:
            pass

    return False


def start_tunnel(port: int = 3000) -> str | None:
    """
    Start a Cloudflare tunnel pointing to localhost:{port}.
    Returns the public tunnel URL, or None if failed.
    """
    global _TUNNEL_LOG

    cloudflared_bin = shutil.which("cloudflared")
    if not cloudflared_bin:
        return None

    fd, log_path = tempfile.mkstemp(suffix=".log", prefix="tunnel_")
    os.close(fd)
    _TUNNEL_LOG = log_path

    cmd = f'"{cloudflared_bin}" tunnel --url http://localhost:{port}'
    spawn_shell(cmd, log_path=log_path)

    # Poll for tunnel URL in log
    url_re = re.compile(r"https://[a-z0-9-]+\.trycloudflare\.com")
    for _ in range(40):  # 20 seconds
        time.sleep(0.5)
        try:
            log_content = Path(log_path).read_text()
            match = url_re.search(log_content)
            if match:
                return match.group(0)
        except Exception:
            pass

    return None


def is_studio_running() -> bool:
    """Check if anything is listening on port 3000. (No fork — pure socket check.)"""
    try:
        import socket
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(1)
        result = s.connect_ex(("127.0.0.1", 3000))
        s.close()
        return result == 0
    except Exception:
        return False


def stop_studio():
    """Kill the Remotion Studio process on port 3000. Fork-free."""
    global _STUDIO_LOG
    kill_by_port(3000)
    if _STUDIO_LOG:
        try:
            os.unlink(_STUDIO_LOG)
        except Exception:
            pass
        _STUDIO_LOG = None


def stop_tunnel():
    """Kill all cloudflared tunnel processes. Fork-free."""
    global _TUNNEL_LOG
    kill_by_name("cloudflared tunnel")
    if _TUNNEL_LOG:
        try:
            os.unlink(_TUNNEL_LOG)
        except Exception:
            pass
        _TUNNEL_LOG = None


def get_studio_url() -> str:
    """Return the best URL to access Remotion Studio."""
    if _TUNNEL_LOG:
        try:
            log_content = Path(_TUNNEL_LOG).read_text()
            url_re = re.compile(r"https://[a-z0-9-]+\.trycloudflare\.com")
            match = url_re.search(log_content)
            if match:
                return match.group(0)
        except Exception:
            pass
    return "http://localhost:3000"


def cleanup():
    """Stop both Studio and tunnel."""
    stop_studio()
    stop_tunnel()
