from pathlib import Path

import joblib
import numpy as np


class RandomForestModel:
    def __init__(self, cfg: dict):
        self.feature_names: list[str] = list(cfg.get("feature_names", []))
        self.model = None
        self._try_load()

    def _try_load(self) -> None:
        path = Path("models/random_forest-v1.0/model.joblib")
        if path.exists():
            try:
                metadata = joblib.load(path)
                if isinstance(metadata, dict) and "model" in metadata:
                    self.model = metadata["model"]
                    if "feature_names" in metadata and metadata["feature_names"]:
                        self.feature_names = metadata["feature_names"]
                else:
                    self.model = metadata
            except Exception:
                self.model = None

    def predict(self, ctx: dict) -> float:
        if self.model is None:
            return self._heuristic(ctx)
        x = np.array([[float(ctx.get(f, 0.0)) for f in self.feature_names]])
        return float(self.model.predict(x)[0])

    def feature_importances(self) -> dict[str, float]:
        if self.model is None or not hasattr(self.model, "feature_importances_"):
            return {}
        return dict(zip(self.feature_names, self.model.feature_importances_.tolist()))

    def _heuristic(self, ctx: dict) -> float:
        velocity = ctx["sales_velocity"]
        stock = ctx["current_stock"]
        if velocity <= 0:
            return 8.0
        return float(min(stock / velocity + 0.5, 8.0))