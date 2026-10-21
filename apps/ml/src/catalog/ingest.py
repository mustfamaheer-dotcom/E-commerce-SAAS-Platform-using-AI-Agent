# apps/ml/src/catalog/ingest.py
import io
import pandas as pd
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from apps.ml.src.catalog.cleaner import clean_catalog
from apps.ml.src.catalog.classifier import classify_catalog_categories

router = APIRouter(prefix="/ml/v1/catalog", tags=["Catalog Ingestion & ML"])


class CatalogProductItem(BaseModel):
    sku: str
    name: str
    price: float
    cost: float
    quantity: Optional[int] = 0
    category: str
    category_confidence: Optional[float] = 1.0
    description: Optional[str] = None
    is_price_outlier: Optional[bool] = False


class IngestResponse(BaseModel):
    status: str
    tenant_id: Optional[str]
    total_rows: int
    valid_rows: int
    duplicates_removed: int
    outliers_flagged: int
    warnings: List[str]
    products: List[CatalogProductItem]


@router.post("/ingest-file", response_model=IngestResponse)
async def ingest_catalog_file(
    file: UploadFile = File(...),
    tenant_id: Optional[str] = Form(None),
):
    """
    Ingest merchant Excel (.xlsx, .xls) or CSV files:
    - Auto-normalizes bilingual (Arabic/English) headers
    - Imputes missing costs using median margins
    - Deduplicates identical SKUs
    - Flags statistical price outliers (IQR)
    - Auto-classifies uncategorized items into catalog categories
    """
    filename = file.filename or ""
    content = await file.read()

    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(content), engine="openpyxl")
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported file format. Please upload a .xlsx, .xls, or .csv file.",
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unable to parse file contents: {str(e)}",
        )

    if df.empty:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file contains no data rows.",
        )

    # 1. Clean, impute, deduplicate, outlier detection
    try:
        cleaned_df, stats = clean_catalog(df)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )

    # 2. Run Category Classifier
    classified_df = classify_catalog_categories(cleaned_df)

    # Format response products
    products_out = []
    for _, row in classified_df.iterrows():
        products_out.append(
            CatalogProductItem(
                sku=str(row.get("sku", "")),
                name=str(row.get("name", "")),
                price=float(row.get("price", 0.0)),
                cost=float(row.get("cost", 0.0)),
                quantity=int(row.get("quantity", 0)) if pd.notna(row.get("quantity")) else 0,
                category=str(row.get("category", "General")),
                category_confidence=float(row.get("category_confidence", 1.0)) if pd.notna(row.get("category_confidence")) else 1.0,
                description=str(row.get("description", "")) if pd.notna(row.get("description")) else None,
                is_price_outlier=bool(row.get("is_price_outlier", False)),
            )
        )

    return IngestResponse(
        status="success",
        tenant_id=tenant_id,
        total_rows=stats["total_rows"],
        valid_rows=stats["valid_rows"],
        duplicates_removed=stats["duplicates_removed"],
        outliers_flagged=stats["outliers_flagged"],
        warnings=stats["warnings"],
        products=products_out,
    )
