import json
from pathlib import Path

from app.config import CONFIG


def _load_category_cache() -> dict:
    cache_path = Path(__file__).parent.parent.parent / "cache" / "category_avg.json"
    if not cache_path.exists():
        return {}
    try:
        with open(cache_path) as f:
            data = json.load(f)
            return data.get("category_stats", {})
    except Exception:
        return {}


def get_category_avg(category: str | None) -> dict | None:
    """Return cached category average data if available."""
    if not category:
        return None
    stats = _load_category_cache()
    return stats.get(category)


def classify_path(history_days: int, category: str | None) -> str:
    """Return one of: global_default, category_avg, naive_only, ensemble."""
    cs = CONFIG["cold_start"]
    if history_days == 0 or not category:
        return "global_default"
    if history_days < int(cs["short_history_days"]):
        cat_avg = get_category_avg(category)
        if cat_avg:
            return "category_avg"
        return "global_default"
    if history_days < int(cs["min_history_days"]):
        return "naive_only"
    return "ensemble"
