import os
from pathlib import Path
from typing import Any

import yaml


def load_config() -> dict[str, Any]:
    cfg_path = Path(os.environ.get("AI_CONFIG_PATH", "config.yaml"))
    if not cfg_path.is_absolute():
        cfg_path = Path(__file__).resolve().parent.parent / cfg_path
    with cfg_path.open("r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    db_url = os.environ.get("DATABASE_URL")
    if db_url:
        cfg["database"]["url"] = db_url

    return cfg


CONFIG = load_config()
