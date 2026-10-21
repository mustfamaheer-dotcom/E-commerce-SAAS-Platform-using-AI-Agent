# apps/ml/src/catalog/cleaner.py
import re
import numpy as np
import pandas as pd
from typing import Tuple, Dict, Any

COLUMN_MAP = {
    # Arabic column variations
    "الاسم": "name", "اسم المنتج": "name", "اسم السلعة": "name",
    "السعر": "price", "سعر البيع": "price", "سعر المنتج": "price",
    "التكلفة": "cost", "سعر الشراء": "cost", "سعر التكلفة": "cost",
    "الكمية": "quantity", "المخزون": "quantity", "عدد القطع": "quantity",
    "الوصف": "description", "وصف المنتج": "description",
    "الفئة": "category", "التصنيف": "category", "القسم": "category",
    "الكود": "sku", "رقم المنتج": "sku", "الباركود": "sku",

    # English column variations
    "title": "name", "product name": "name", "product_name": "name", "item": "name",
    "unit price": "price", "selling price": "price", "sale price": "price",
    "unit cost": "cost", "purchase price": "cost", "cost price": "cost",
    "stock": "quantity", "qty": "quantity", "units": "quantity",
    "desc": "description", "details": "description",
    "cat": "category", "product category": "category", "type": "category",
    "barcode": "sku", "item code": "sku", "item_code": "sku", "sku_code": "sku",
}


def clean_catalog(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """Clean uploaded catalog, impute missing costs, drop duplicate SKUs, and flag price outliers."""
    df = df.copy()
    warnings = []
    original_count = len(df)

    # 1. Normalize Column Headers
    normalized_cols = []
    for col in df.columns:
        clean_col = str(col).strip().lower()
        normalized_cols.append(COLUMN_MAP.get(clean_col, clean_col))
    df.columns = normalized_cols

    # Ensure required name column exists
    if "name" not in df.columns:
        raise ValueError("Catalog must contain a 'name' or 'الاسم' column.")

    # 2. Strip currency symbols and parse numeric prices and costs
    for col in ["price", "cost", "quantity"]:
        if col in df.columns:
            df[col] = (
                df[col]
                .astype(str)
                .str.replace(r"[^\d.\-]", "", regex=True)
                .replace("", np.nan)
                .astype(float)
            )

    # Default price to 0 if missing
    if "price" in df.columns:
        df["price"] = df["price"].fillna(0.0)

    # 3. Impute missing costs using category median margins
    if "cost" in df.columns and "category" in df.columns:
        missing_cost = df["cost"].isna() | (df["cost"] <= 0)
        if missing_cost.any():
            median_margins = (
                df[df["cost"] > 0]
                .groupby("category")
                .apply(lambda g: ((g["price"] - g["cost"]) / g["price"].replace(0, np.nan)).median())
                .to_dict()
            )
            for idx in df[missing_cost].index:
                cat = df.loc[idx, "category"]
                margin = median_margins.get(cat, 0.30)
                if pd.isna(margin) or margin <= 0 or margin >= 1:
                    margin = 0.30
                df.loc[idx, "cost"] = round(df.loc[idx, "price"] * (1 - margin), 2)
            warnings.append(f"Imputed {missing_cost.sum()} missing or zero-cost values via category margin medians.")
    elif "cost" not in df.columns and "price" in df.columns:
        # Default 30% margin fallback
        df["cost"] = (df["price"] * 0.70).round(2)
        warnings.append("No cost column found; estimated cost using standard 30% margin assumption.")

    # 4. SKU Handling & Duplicate Detection
    duplicates = 0
    if "sku" in df.columns:
        # Check duplicates only where sku is non-null and non-empty
        valid_sku_mask = df["sku"].notna() & (df["sku"].astype(str).str.strip() != "") & (df["sku"].astype(str).str.strip().str.lower() != "nan")
        if valid_sku_mask.any():
            dup_mask = valid_sku_mask & df.duplicated(subset=["sku"], keep="first")
            duplicates = int(dup_mask.sum())
            if duplicates > 0:
                df = df[~dup_mask].copy()
                warnings.append(f"Removed {duplicates} duplicate SKU rows.")

    # Assign generated SKUs to any missing rows
    if "sku" not in df.columns:
        df["sku"] = [f"SKU-{i+1001:05d}" for i in range(len(df))]
    else:
        missing_sku = df["sku"].isna() | (df["sku"].astype(str).str.strip() == "") | (df["sku"].astype(str).str.strip().str.lower() == "nan")
        if missing_sku.any():
            for i, idx in enumerate(df[missing_sku].index):
                df.loc[idx, "sku"] = f"SKU-{i+1001:05d}"

    # 5. Price Outlier Detection (IQR Method)
    outliers = 0
    if "price" in df.columns and len(df) >= 4:
        valid_prices = df[df["price"] > 0]["price"]
        if len(valid_prices) >= 4:
            q1 = valid_prices.quantile(0.25)
            q3 = valid_prices.quantile(0.75)
            iqr = q3 - q1
            lower_bound = max(0, q1 - 1.5 * iqr)
            upper_bound = q3 + 1.5 * iqr

            outlier_mask = (df["price"] < lower_bound) | (df["price"] > upper_bound)
            outliers = int(outlier_mask.sum())
            df["is_price_outlier"] = outlier_mask
            if outliers > 0:
                warnings.append(f"Flagged {outliers} statistical price outliers (IQR: [{lower_bound:.2f}, {upper_bound:.2f}]).")
        else:
            df["is_price_outlier"] = False
    else:
        df["is_price_outlier"] = False

    stats = {
        "total_rows": int(original_count),
        "valid_rows": int(len(df)),
        "duplicates_removed": duplicates,
        "outliers_flagged": outliers,
        "warnings": warnings,
    }

    return df, stats
