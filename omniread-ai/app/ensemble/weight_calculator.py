import math


def softmax_weights(maes: dict[str, float], temperature: float = 2.0) -> dict[str, float]:
    """w_i = softmax(-MAE_i / temperature). Used in Phase 2; Phase 1 uses fixed weights."""
    if not maes:
        return {}
    if temperature <= 0:
        temperature = 1.0
    scaled = {m: -v / temperature for m, v in maes.items()}
    shift = max(scaled.values())
    exps = {m: math.exp(v - shift) for m, v in scaled.items()}
    total = sum(exps.values()) or 1.0
    return {m: e / total for m, e in exps.items()}
