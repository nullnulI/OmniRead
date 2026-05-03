def combine(predictions: dict[str, float], weights: dict[str, float]) -> float:
    """Weighted average; falls back to plain mean if weights sum to zero."""
    if not predictions:
        return 0.0
    total_w = sum(weights.get(m, 0.0) for m in predictions)
    if total_w <= 0:
        return sum(predictions.values()) / len(predictions)
    return sum(p * weights.get(m, 0.0) for m, p in predictions.items()) / total_w
