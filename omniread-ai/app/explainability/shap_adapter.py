"""
SHAP Adapter for OmniRead AI Forecasting Service

Provides real SHAP values for Random Forest predictions.
Used by the explainability layer (Phase 2).
"""

from typing import Dict, List, Optional

import joblib
import numpy as np
import shap


class SHAPAdapter:
    """Computes SHAP-based feature importances for Random Forest models."""

    def __init__(self, model_path: str = "models/random_forest-v1.0/model.joblib"):
        self.model = None
        self.feature_names: List[str] = []
        self.explainer = None
        self._load_model(model_path)

    def _load_model(self, model_path: str) -> None:
        """Load model from joblib file."""
        try:
            import os
            from pathlib import Path

            resolved = Path(model_path)
            if not resolved.exists():
                resolved = Path(__file__).parent.parent / model_path

            if not resolved.exists():
                return

            metadata = joblib.load(resolved)
            self.model = metadata["model"]
            self.feature_names = metadata.get("feature_names", [])

            if self.model is not None:
                self.explainer = shap.TreeExplainer(self.model)

        except Exception:
            self.model = None
            self.explainer = None

    def is_available(self) -> bool:
        """Return True if model is loaded and ready."""
        return self.model is not None and self.explainer is not None

    def compute_shap_values(self, features: Dict[str, float]) -> Dict[str, float]:
        """Compute SHAP values for a single prediction.

        Args:
            features: Dictionary of feature name -> value

        Returns:
            Dictionary of feature name -> SHAP contribution (normalized to sum to 1.0)
        """
        if not self.is_available():
            return {}

        x = np.array([[float(features.get(f, 0.0)) for f in self.feature_names]])

        try:
            shap_values = self.explainer.shap_values(x)
            if isinstance(shap_values, list):
                shap_values = shap_values[0]

            contributions = {}
            total = sum(abs(v) for v in shap_values[0]) or 1.0
            for i, feat in enumerate(self.feature_names):
                contributions[feat] = round(abs(shap_values[0][i]) / total, 4)

            return contributions

        except Exception:
            return {}

    def compute_feature_importance(self, features: Dict[str, float]) -> Dict[str, float]:
        """Compute SHAP-based feature importance as normalized contributions.

        Returns top features with highest absolute SHAP values.
        """
        return self.compute_shap_values(features)


def get_shap_adapter(model_path: str = "models/random_forest-v1.0/model.joblib") -> SHAPAdapter:
    """Factory function to get SHAP adapter instance."""
    return SHAPAdapter(model_path)
