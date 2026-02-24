#!/usr/bin/env python3
"""
Standalone subprocess runner — runs a shell command and writes output to a file.

IMPORTANT: This script is launched via posix_spawnp from Streamlit (multi-threaded).
On macOS 26 + Python 3.14, the child process inherits networking library state
from its parent. When subprocess.Popen(shell=True, stdout=PIPE) is used, it
internally calls fork() — macOS's atfork handlers in libnetwork/NEFlowDirector
detect the inherited multi-threaded networking state and SIGSEGV:
    "*** multi-threaded process forked ***"
    "crashed on child side of fork pre-exec"

FIX: Instead of subprocess.Popen (fork+exec), we use os.execvp() to directly
replace this process with /bin/bash running the command. Output is redirected
to the log file via shell redirection (no PIPE needed, no fork needed).

Usage:
    python runner.py <log_file> <shell_command>

The runner writes all stdout+stderr to <log_file>, then appends
EXIT_CODE:<code> on the last line when done.
"""

import os
import sys


def main():
    if len(sys.argv) < 3:
        print("Usage: runner.py <log_file> <shell_command>", file=sys.stderr)
        sys.exit(1)

    log_path = sys.argv[1]
    shell_cmd = " ".join(sys.argv[2:])

    # Build a wrapper script that:
    # 1. Runs the command with stdout+stderr going to the log file (line-buffered via stdbuf)
    # 2. Captures the exit code
    # 3. Appends EXIT_CODE:<code> to the log file
    #
    # We use os.execvp to REPLACE this process with /bin/bash.
    # No fork(), no subprocess — completely safe on macOS 26 + Python 3.14.
    #
    # The stdbuf/unbuffer trick ensures line-buffered output for the dashboard
    # to poll in real-time, even when the child process (node/npx) uses
    # block-buffering by default when stdout is not a TTY.
    wrapper = (
        f'{{ {shell_cmd} ; }} > "{log_path}" 2>&1\n'
        f'_EXIT_CODE=$?\n'
        f'echo "" >> "{log_path}"\n'
        f'echo "EXIT_CODE:$_EXIT_CODE" >> "{log_path}"\n'
    )

    # Replace this process entirely with bash — no fork, no crash
    os.execvp("/bin/bash", ["/bin/bash", "-c", wrapper])


if __name__ == "__main__":
    main()
