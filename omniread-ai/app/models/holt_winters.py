import warnings

from statsmodels.tools.sm_exceptions import ConvergenceWarning
from statsmodels.tsa.holtwinters import ExponentialSmoothing


class HoltWintersModel:
    def __init__(self, cfg: dict):
        self.cfg = cfg
        self.last_decomposition: dict | None = None

    def predict(self, ctx: dict, horizon: int) -> float:
        series = ctx["daily_series"]
        seasonal_periods = int(self.cfg.get("seasonal_periods", 7))
        if len(series) < seasonal_periods * 2:
            self.last_decomposition = None
            return self._fallback(ctx, horizon)
        try:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore", ConvergenceWarning)
                model = ExponentialSmoothing(
                    series,
                    trend=self.cfg.get("trend", "add"),
                    seasonal=self.cfg.get("seasonal", "add"),
                    seasonal_periods=seasonal_periods,
                    initialization_method="estimated",
                )
                fit = model.fit(
                    smoothing_level=self.cfg.get("smoothing_level"),
                    smoothing_trend=self.cfg.get("smoothing_trend"),
                    smoothing_seasonal=self.cfg.get("smoothing_seasonal"),
                    optimized=False,
                )
            forecast = fit.forecast(horizon)
            self.last_decomposition = {
                "level": float(fit.level[-1]) if len(fit.level) else 0.0,
                "trend": float(fit.trend[-1]) if len(fit.trend) else 0.0,
                "season_amplitude": float(max(fit.season) - min(fit.season)) if len(fit.season) else 0.0,
            }
            current_stock = ctx["current_stock"]
            cumulative = 0.0
            for i, demand in enumerate(forecast, start=1):
                cumulative += max(0.0, float(demand))
                if cumulative >= current_stock:
                    return float(i)
            return float(horizon + 1)
        except Exception:
            self.last_decomposition = None
            return self._fallback(ctx, horizon)

    def _fallback(self, ctx: dict, horizon: int) -> float:
        velocity = ctx["sales_velocity"]
        stock = ctx["current_stock"]
        if velocity <= 0:
            return float(horizon + 1)
        return float(min(int(stock / velocity) + 1, horizon + 1))
