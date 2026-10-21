# apps/ml/src/analytics/anomaly_service.py
"""
Statistical Revenue & Profit Anomaly Detection Engine.
Applies Rolling Z-Score (|Z| > 2.5) and Interquartile Range (IQR) filtering to detect financial spikes & drops.
"""
import math
from typing import List, Dict, Any, Optional
import numpy as np
import pandas as pd


def detect_series_anomalies(
    dates: List[str],
    values: List[float],
    metric_name: str = "net_profit",
    z_threshold: float = 2.5,
) -> List[Dict[str, Any]]:
    """
    Detects anomalous data points using Rolling Z-Score and IQR.
    """
    if len(values) < 5:
        return []

    series = pd.Series(values, index=dates, dtype=float)
    mean = series.mean()
    std = series.std(ddof=1)
    if std == 0 or np.isnan(std):
        std = 1e-4

    # IQR bounds
    q1 = series.quantile(0.25)
    q3 = series.quantile(0.75)
    iqr = q3 - q1
    lower_iqr = q1 - 1.5 * iqr
    upper_iqr = q3 + 1.5 * iqr

    # 7-day rolling baseline for expected value
    rolling_mean = series.rolling(window=min(7, len(series)), min_periods=1, center=False).mean()

    anomalies = []
    for d, val in zip(dates, values):
        z_score = (val - mean) / std
        expected_val = float(rolling_mean.get(d, mean))

        # Flag if |Z| > threshold or outside IQR bounds
        is_z_anomaly = abs(z_score) >= z_threshold
        is_iqr_anomaly = val < lower_iqr or val > upper_iqr

        if is_z_anomaly or is_iqr_anomaly:
            severity = "high" if abs(z_score) >= 3.0 else "medium"
            direction = "spike" if val > expected_val else "drop"

            anomalies.append({
                "metric": metric_name,
                "date": str(d),
                "value": round(float(val), 2),
                "expected_value": round(expected_val, 2),
                "z_score": round(float(z_score), 2),
                "severity": severity,
                "direction": direction,
                "percentage_deviation": round(((val - expected_val) / max(abs(expected_val), 1.0)) * 100, 1),
            })

    # Sort anomalies by magnitude of Z-Score (most severe first)
    anomalies.sort(key=lambda x: abs(x["z_score"]), reverse=True)
    return anomalies
