import json
import os
import shutil
import subprocess
import threading
import time
from urllib import error, request

from app.core.config import settings


_process: subprocess.Popen | None = None


def ensure_ollama_running() -> None:
    if not _should_manage_ollama() or _ollama_healthcheck():
        return

    global _process
    env = os.environ.copy()
    env.setdefault("OLLAMA_HOST", settings.ollama_base_url)
    command = _resolve_ollama_command()
    if command is None:
        return
    try:
        _process = subprocess.Popen(
            [command, "serve"],
            env=env,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            start_new_session=True,
        )
    except OSError:
        _process = None
        return

    deadline = time.monotonic() + 12
    while time.monotonic() < deadline:
        if _ollama_healthcheck():
            return
        if _process.poll() is not None:
            return
        time.sleep(0.4)


def warmup_ollama_model() -> None:
    if not _should_manage_ollama() or not settings.ollama_warmup_on_startup:
        return
    thread = threading.Thread(target=_warmup_worker, name="ollama-warmup", daemon=True)
    thread.start()


def shutdown_managed_ollama() -> None:
    global _process
    if _process is None or _process.poll() is not None:
        _process = None
        return
    _process.terminate()
    try:
        _process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        _process.kill()
    finally:
        _process = None


def _should_manage_ollama() -> bool:
    return settings.ai_enabled and settings.ai_provider.lower() == "ollama" and settings.ollama_auto_start


def _resolve_ollama_command() -> str | None:
    configured = settings.ollama_binary_path.strip()
    if configured and os.path.isabs(configured) and os.path.exists(configured):
        return configured
    if configured:
        found = shutil.which(configured)
        if found:
            return found
    local_bin = os.path.expanduser("~/.local/bin/ollama")
    if os.path.exists(local_bin):
        return local_bin
    return None


def _ollama_healthcheck() -> bool:
    try:
        req = request.Request(
            url=f"{settings.ollama_base_url.rstrip('/')}/api/tags",
            headers={"Content-Type": "application/json"},
            method="GET",
        )
        with request.urlopen(req, timeout=2) as response:
            data = json.loads(response.read().decode("utf-8"))
    except (OSError, error.URLError, TimeoutError, json.JSONDecodeError):
        return False
    return isinstance(data, dict) and "models" in data


def _warmup_worker() -> None:
    if not _ollama_healthcheck():
        return

    body = {
        "model": settings.ollama_model,
        "prompt": "Responda somente OK.",
        "stream": False,
        "keep_alive": settings.ollama_keep_alive,
        "options": {
            "num_predict": 2,
            "num_ctx": settings.ollama_num_ctx,
        },
    }
    req = request.Request(
        url=f"{settings.ollama_base_url.rstrip('/')}/api/generate",
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with request.urlopen(req, timeout=min(settings.ai_timeout_seconds, 30)) as response:
            response.read()
    except (OSError, error.URLError, TimeoutError):
        return
