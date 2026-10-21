# apps/ml/src/forecast/feature_builder.py
"""
Feature engineering for the sales forecasting pipeline.

Implements the Section 8.3 feature matrix on top of the gapless daily series
produced by `v_daily_product_timeseries` (or the offline mock store):

    sales_lag_7 / 14 / 28, trailing rolling mean 7 / 28, trailing rolling std 28,
    discount_pct, price_change_pct, day_of_week, weekend flags, month,
    is_holiday, holiday_weight, stock_level
"""
from datetime import date
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd

FEATURE_COLUMNS: List[str] = [
    "sales_lag_7",
    "sales_lag_14",
    "sales_lag_28",
    "sales_rolling_mean_7",
    "sales_rolling_mean_28",
    "sales_rolling_std_28",
    "discount_pct",
    "price_change_pct",
    "day_of_week",
    "is_weekend_fri",
    "is_weekend_sat",
    "month",
    "is_holiday",
    "holiday_weight",
    "stock_level",
]

TARGET_COLUMN = "target_units"
SCALED_TARGET_COLUMN = "target_units_scaled"
SCALE_COLUMN = "sales_rolling_mean_28"
MIN_SCALE = 0.5


def add_scaled_target(frame: pd.DataFrame) -> pd.DataFrame:
    """
    Add a scale-normalised target: `target_units / rolling_mean_28`.

    A pooled model can then learn the *pattern* of demand (weekend, promo,
    holiday) for the whole catalogue while each SKU keeps its own level,
    instead of regressing every product to the catalogue average.
    """
    frame = frame.copy()
    scale = frame[SCALE_COLUMN].fillna(0.0).clip(lower=MIN_SCALE)
    frame[SCALED_TARGET_COLUMN] = frame[TARGET_COLUMN] / scale
    return frame


def build_feature_frame(df: pd.DataFrame, target_horizon: int = 1) -> pd.DataFrame:
    """
    Build the full training feature frame.

    Expects at least: tenant_id, product_id, report_date, units_sold,
    discount_pct, avg_unit_price, stock_level, day_of_week, month,
    is_holiday (and optionally holiday_weight).
    """
    frame = df.copy()
    frame["report_date"] = pd.to_datetime(frame["report_date"]).dt.normalize()
    frame = frame.sort_values(["tenant_id", "product_id", "report_date"]).reset_index(drop=True)

    frame["units_sold"] = frame["units_sold"].fillna(0).astype(float)
    if "holiday_weight" not in frame.columns:
        frame["holiday_weight"] = np.where(frame.get("is_holiday", False), 1.0, 0.0)
    frame["is_holiday"] = frame["is_holiday"].fillna(False).astype(int)
    frame["holiday_weight"] = frame["holiday_weight"].fillna(0).astype(float)
    frame["day_of_week"] = frame["day_of_week"].fillna(
        frame["report_date"].dt.dayofweek.add(1)
    ).astype(int)
    frame["month"] = frame["month"].fillna(frame["report_date"].dt.month).astype(int)

    grouped = frame.groupby(["tenant_id", "product_id"], group_keys=False)

    for lag in (7, 14, 28):
        frame[f"sales_lag_{lag}"] = grouped["units_sold"].shift(lag)

    for window in (7, 28):
        frame[f"sales_rolling_mean_{window}"] = grouped["units_sold"].transform(
            lambda s: s.shift(1).rolling(window, min_periods=window).mean()
        )

    frame["sales_rolling_std_28"] = grouped["units_sold"].transform(
        lambda s: s.shift(1).rolling(28, min_periods=28).std(ddof=1)
    )

    frame["price_change_pct"] = grouped["avg_unit_price"].transform(
        lambda s: s.pct_change().replace([np.inf, -np.inf], 0).fillna(0)
    )

    frame["is_weekend_fri"] = (frame["day_of_week"] == 5).astype(int)
    frame["is_weekend_sat"] = (frame["day_of_week"] == 6).astype(int)

    frame[TARGET_COLUMN] = grouped["units_sold"].shift(-target_horizon)

    for column in ("discount_pct", "stock_level"):
        frame[column] = frame[column].fillna(0).astype(float)

    return frame


def supervised_rows(frame: pd.DataFrame) -> pd.DataFrame:
    """Return rows complete enough for training/serving."""
    required = [c for c in FEATURE_COLUMNS if c in frame.columns] + [TARGET_COLUMN]
    return frame.dropna(subset=required).reset_index(drop=True)


def time_based_split(frame: pd.DataFrame, train_ratio: float = 0.8) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Chronological split: first `train_ratio` of unique dates train, the rest test.

    Random shuffling is never used (it would leak future demand into training).
    """
    dates = np.sort(frame["report_date"].unique())
    if len(dates) < 5:
        raise ValueError("At least 5 distinct dates are required for a time-based split.")
    cutoff_index = max(1, int(len(dates) * train_ratio) - 1)
    cutoff = dates[cutoff_index]
    train = frame[frame["report_date"] <= cutoff].reset_index(drop=True)
    test = frame[frame["report_date"] > cutoff].reset_index(drop=True)
    return train, test


def assert_no_leakage(train: pd.DataFrame, test: pd.DataFrame) -> None:
    """Raise if the split lets any future data into the training set."""
    if train.empty or test.empty:
        raise AssertionError("Train/test split produced an empty partition.")
    max_train = pd.to_datetime(train["report_date"]).max()
    min_test = pd.to_datetime(test["report_date"]).min()
    if not max_train < min_test:
        raise AssertionError(
            f"Data leakage: train ends {max_train} but test starts {min_test}."
        )


def build_inference_row(
    units_history: List[float],
    last_row: Dict,
    future_date: date,
    is_holiday: bool = False,
    holiday_weight: float = 0.0,
) -> Dict[str, float]:
    """Build one future feature row by rolling the known history forward."""
    series = pd.Series(units_history, dtype=float)
    if len(series) < 28:
        series = pd.concat([pd.Series([0.0] * (28 - len(series))), series], ignore_index=True)

    return {
        "sales_lag_7": float(series.iloc[-7]),
        "sales_lag_14": float(series.iloc[-14]),
        "sales_lag_28": float(series.iloc[-28]),
        "sales_rolling_mean_7": float(series.iloc[-7:].mean()),
        "sales_rolling_mean_28": float(series.iloc[-28:].mean()),
        "sales_rolling_std_28": float(series.iloc[-28:].std(ddof=1) or 0.0),
        "discount_pct": float(last_row.get("discount_pct", 0.0)),
        "price_change_pct": 0.0,
        "day_of_week": int(future_date.isoweekday()),
        "is_weekend_fri": int(future_date.isoweekday() == 5),
        "is_weekend_sat": int(future_date.isoweekday() == 6),
        "month": int(future_date.month),
        "is_holiday": int(is_holiday),
        "holiday_weight": float(holiday_weight),
        "stock_level": float(last_row.get("stock_level", 0.0)),
    }
