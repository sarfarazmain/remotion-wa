"""
Fork-safe process launcher for macOS.

On macOS + Python 3.14, ANY call that uses fork() from a multi-threaded
process (like Streamlit) crashes with SIGSEGV:
  "*** multi-threaded process forked ***"
  "crashed on child side of fork pre-exec"

This includes: subprocess.Popen, subprocess.run, os.system, os.popen.

SOLUTION: Use os.posix_spawnp() which does NOT fork — it directly calls
the POSIX posix_spawn() syscall to create a new process. This is safe
from any thread context.

All process launching in the dashboard MUST go through this module.
"""

import os
import signal
import sys
import stat
import tempfile
from pathlib import Path

RUNNER_SCRIPT = Path(__file__).parent / "runner.py"


def _spawn_script(script_path: str) -> int:
    """
    Execute a shell script using os.posix_spawnp (NO fork).
    Returns the PID of the spawned process.
    Does NOT wait for completion — caller decides whether to wait.
    """
    pid = os.posix_spawnp(
        "/bin/bash",
        ["/bin/bash", script_path],
        os.environ,
    )
    return pid


def spawn_shell(shell_cmd: str, log_path: str | None = None) -> int:
    """
    Run an arbitrary shell command in a new process (fire-and-forget).
    Uses posix_spawnp — completely fork-free.

    If log_path is provided, stdout+stderr are redirected to it.
    Returns the PID.
    """
    fd, script_path = tempfile.mkstemp(suffix=".sh", prefix="spawn_")
    with os.fdopen(fd, "w") as f:
        f.write("#!/bin/bash\n")
        if log_path:
            f.write(f'{shell_cmd} > "{log_path}" 2>&1\n')
        else:
            f.write(f"{shell_cmd}\n")
        f.write(f'rm -f "{script_path}"\n')  # Self-cleanup

    os.chmod(script_path, stat.S_IRWXU)
    return _spawn_script(script_path)


def spawn_shell_wait(shell_cmd: str) -> tuple[int, str]:
    """
    Run a shell command synchronously, wait for it, return (exit_code, output).
    Fork-free via posix_spawnp.
    """
    fd, out_path = tempfile.mkstemp(suffix=".txt", prefix="out_")
    os.close(fd)

    pid = spawn_shell(shell_cmd, log_path=out_path)
    _, status = os.waitpid(pid, 0)
    exit_code = os.waitstatus_to_exitcode(status)

    output = ""
    try:
        output = Path(out_path).read_text()
        os.unlink(out_path)
    except Exception:
        pass

    return exit_code, output


def kill_by_port(port: int):
    """
    Kill all processes listening on a given port.
    Fork-free: uses posix_spawnp to run lsof, then os.kill().
    """
    _, output = spawn_shell_wait(f"lsof -ti:{port} 2>/dev/null")
    for line in output.strip().split("\n"):
        line = line.strip()
        if line and line.isdigit():
            try:
                os.kill(int(line), signal.SIGKILL)
            except (ProcessLookupError, PermissionError):
                pass


def kill_by_name(pattern: str):
    """
    Kill processes matching a name pattern.
    Fork-free: uses posix_spawnp to run pgrep, then os.kill().
    """
    _, output = spawn_shell_wait(f"pgrep -f '{pattern}' 2>/dev/null")
    my_pid = os.getpid()
    for line in output.strip().split("\n"):
        line = line.strip()
        if line and line.isdigit():
            pid = int(line)
            if pid != my_pid:
                try:
                    os.kill(pid, signal.SIGKILL)
                except (ProcessLookupError, PermissionError):
                    pass


def launch_command(shell_cmd: str, log_path: str):
    """
    Launch a shell command via runner.py without blocking.
    Fork-free via posix_spawnp.

    runner.py runs in a separate single-threaded Python process,
    executes the command, and writes output + EXIT_CODE to log_path.
    """
    python_bin = sys.executable

    fd, script_path = tempfile.mkstemp(suffix=".sh", prefix="launch_")
    # Escape single quotes in shell_cmd so it survives as one bash argument
    escaped_cmd = shell_cmd.replace("'", "'\\''")
    with os.fdopen(fd, "w") as f:
        f.write("#!/bin/bash\n")
        f.write(f'"{python_bin}" "{RUNNER_SCRIPT}" "{log_path}" \'{escaped_cmd}\'\n')
        f.write(f'rm -f "{script_path}"\n')  # Self-cleanup

    os.chmod(script_path, stat.S_IRWXU)
    _spawn_script(script_path)


def run_and_wait(shell_cmd: str, timeout: int = 300) -> tuple[int, str]:
    """
    Run a shell command synchronously via runner.py.
    Returns (exit_code, log_contents).
    """
    import time

    fd, log_path = tempfile.mkstemp(suffix=".log", prefix="cmd_")
    os.close(fd)

    launch_command(shell_cmd, log_path)

    # Poll for completion
    waited = 0
    while waited < timeout:
        time.sleep(0.5)
        waited += 0.5
        try:
            content = Path(log_path).read_text()
            if "EXIT_CODE:" in content:
                lines = content.strip().split("\n")
                exit_line = [l for l in lines if l.startswith("EXIT_CODE:")]
                if exit_line:
                    code = int(exit_line[0].split(":")[1])
                    try:
                        os.unlink(log_path)
                    except Exception:
                        pass
                    return code, content
        except Exception:
            pass

    # Timeout
    content = ""
    try:
        content = Path(log_path).read_text()
        os.unlink(log_path)
    except Exception:
        pass
    return -1, content
