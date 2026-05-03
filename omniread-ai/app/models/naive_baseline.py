import math


class NaiveBaselineModel:
    def __init__(self, cfg: dict):
        self.fallback = int(cfg.get("fallback_stockout_day", 7))

    def predict(self, ctx: dict, horizon: int) -> float:
        velocity = ctx["sales_velocity"]
        stock = ctx["current_stock"]
        if velocity <= 0:
            return float(min(self.fallback, horizon + 1))
        days = stock / velocity
        return float(min(math.ceil(days), horizon + 1))
