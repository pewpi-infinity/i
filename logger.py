#!/usr/bin/env python3
"""
Simple logging helper.
- Appends timestamped entries to logs/txt.log
- Optional helper to auto-commit the log file to git (use with care)
"""
import os
from datetime import datetime
import subprocess

ROOT = os.path.abspath(os.path.dirname(__file__))
LOG_DIR = os.path.join(ROOT, "logs")
LOG_FILE = os.path.join(LOG_DIR, "txt.log")

os.makedirs(LOG_DIR, exist_ok=True)

def timestamp():
    return datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3] + " UTC"

def append_log(text: str, kind: str = "INFO"):
    """
    Append a line to logs/txt.log.
    kind: "IN" (user), "OUT" (bot), "INFO" (misc)
    """
    line = f"[{timestamp()}] [{kind}] {text}\n"
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(line)
    return LOG_FILE

def commit_log(commit_message: str = None, file_path: str = None, push: bool = False):
    """
    Optionally commit the log file to the repository.
    WARNING: this will call git in the repo. Make sure credentials are set up,
    and be careful about committing PII or secrets to a repo (private or public).
    Returns (ok: bool, output: str).
    """
    file_path = file_path or LOG_FILE
    commit_msg = commit_message or f"Auto log update: {timestamp()}"
    try:
        subprocess.check_output(["git", "add", file_path], stderr=subprocess.STDOUT)
        subprocess.check_output(["git", "commit", "-m", commit_msg], stderr=subprocess.STDOUT)
        out = "committed"
        if push:
            subprocess.check_output(["git", "push"], stderr=subprocess.STDOUT)
            out += " and pushed"
        return True, out
    except subprocess.CalledProcessError as e:
        return False, e.output.decode(errors="replace")
    except FileNotFoundError:
        return False, "git not found"