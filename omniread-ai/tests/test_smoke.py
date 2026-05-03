"""Smoke tests that don't require a live MySQL connection."""

from app.cold_start.detector import classify_path
from app.ensemble.meta_learner import combine
from app.ensemble.weight_calculator import softmax_weights
from app.explainability.counterfactual import linear_counterfactual
from app.models.naive_baseline import NaiveBaselineModel


def test_classify_path():
    assert classify_path(0, "fiction") == "global_default"
    assert classify_path(5, None) == "global_default"
    assert classify_path(5, "fiction") == "category_avg"
    assert classify_path(10, "fiction") == "naive_only"
    assert classify_path(30, "fiction") == "ensemble"


def test_combine_weighted_average():
    preds = {"a": 4.0, "b": 6.0}
    weights = {"a": 0.5, "b": 0.5}
    assert combine(preds, weights) == 5.0


def test_combine_zero_weights_falls_back():
    preds = {"a": 4.0, "b": 6.0}
    assert combine(preds, {"a": 0.0, "b": 0.0}) == 5.0


def test_softmax_weights_sum_to_one():
    w = softmax_weights({"a": 1.0, "b": 2.0, "c": 3.0}, temperature=2.0)
    assert abs(sum(w.values()) - 1.0) < 1e-9
    assert w["a"] > w["b"] > w["c"]


def test_naive_baseline_runs_out_of_stock():
    nb = NaiveBaselineModel({"fallback_stockout_day": 7})
    ctx = {"sales_velocity": 2.0, "current_stock": 10}
    assert nb.predict(ctx, horizon=7) == 5.0


def test_naive_baseline_zero_velocity():
    nb = NaiveBaselineModel({"fallback_stockout_day": 7})
    ctx = {"sales_velocity": 0.0, "current_stock": 100}
    assert nb.predict(ctx, horizon=7) == 7.0


def test_counterfactual_below_target_returns_none():
    assert linear_counterfactual(current_stock=10, current_risk=0.3, attribution_current_stock=0.4) is None


def test_counterfactual_zero_stock_returns_none():
    assert linear_counterfactual(current_stock=0, current_risk=0.9, attribution_current_stock=0.4) is None


def test_counterfactual_zero_attribution_returns_none():
    assert linear_counterfactual(current_stock=10, current_risk=0.9, attribution_current_stock=0.0) is None


def test_counterfactual_normal_case():
    result = linear_counterfactual(current_stock=10, current_risk=0.9, attribution_current_stock=0.5)
    assert result is not None
    assert result["stock_needed"] > 10
    assert result["risk_reduced_to"] == 0.5
