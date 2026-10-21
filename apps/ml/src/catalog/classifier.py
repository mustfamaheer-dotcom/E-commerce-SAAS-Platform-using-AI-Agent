# apps/ml/src/catalog/classifier.py
import os
import joblib
import pandas as pd
from typing import List, Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "sku_classifier.joblib")

# Baseline training corpus (Arabic & English E-commerce Catalog Titles)
SEED_DATA = [
    # Electronics / Mobile Accessories
    ("iPhone 15 Pro Max Silicone Case with MagSafe", "Mobile Accessories"),
    ("جراب سيليكون شفاف لايفون 15 برو ماكس", "Mobile Accessories"),
    ("USB-C Fast Charging Cable 2M Braided", "Cables & Adapters"),
    ("كابل شحن سريع تايب سي قماش 2 متر", "Cables & Adapters"),
    ("Anker 20W PowerPort PD Wall Charger", "Chargers & Power"),
    ("شاحن انكر سريع 20 واط مخرج تايب سي", "Chargers & Power"),
    ("Wireless Bluetooth Earbuds Noise Cancelling", "Audio & Headphones"),
    ("سماعات بلوتوث لاسلكية عازلة للضوضاء", "Audio & Headphones"),
    ("Tempered Glass Screen Protector for Samsung S24", "Screen Protectors"),
    ("اسكرينة زجاجية حماية شاشة سامسونج اس 24", "Screen Protectors"),
    ("Magnetic Car Phone Mount Holder", "Car Accessories"),
    ("حامل موبايل مغناطيسي لفتحة تكييف السيارة", "Car Accessories"),
    ("Power Bank 20000mAh Dual Output Fast Charge", "Chargers & Power"),
    ("باور بانك 20 الف مللي امبير شحن سريع", "Chargers & Power"),
    ("Gaming Headset with Surround Mic 3.5mm", "Audio & Headphones"),
    ("سماعة العاب محيطية مع مايكروفون عازل", "Audio & Headphones"),
    ("Apple Watch Ultra Silicone Sport Band", "Smartwatch Accessories"),
    ("سوار سيليكون رياضي لساعة ابل الترا", "Smartwatch Accessories"),
    ("Laptop Stand Aluminum Ergonomic Foldable", "Computer Accessories"),
    ("حامل لابتوب المونيوم قابل للطي ومريح للعين", "Computer Accessories"),
]


def ensure_model_trained() -> Pipeline:
    """Load or automatically train and persist baseline category classifier."""
    os.makedirs(MODEL_DIR, exist_ok=True)
    if os.path.exists(MODEL_PATH):
        try:
            return joblib.load(MODEL_PATH)
        except Exception:
            pass

    # Train baseline model
    df_train = pd.DataFrame(SEED_DATA, columns=["name", "category"])
    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(
            max_features=5000,
            ngram_range=(1, 2),
            sublinear_tf=True,
            strip_accents="unicode",
        )),
        ("clf", LogisticRegression(
            max_iter=500,
            C=1.0,
            class_weight="balanced",
            solver="lbfgs",
        )),
    ])
    pipeline.fit(df_train["name"], df_train["category"])
    joblib.dump(pipeline, MODEL_PATH)
    return pipeline


def classify_catalog_categories(
    df: pd.DataFrame,
    confidence_threshold: float = 0.35,
) -> pd.DataFrame:
    """Predict and assign product categories for uncategorized catalog rows."""
    df = df.copy()
    pipeline = ensure_model_trained()

    if "category" not in df.columns:
        df["category"] = None

    uncategorized_mask = df["category"].isna() | (df["category"].astype(str).str.strip() == "")
    if not uncategorized_mask.any():
        df["category_confidence"] = 1.0
        return df

    names = df.loc[uncategorized_mask, "name"].fillna("").astype(str).tolist()
    if not names:
        return df

    preds = pipeline.predict(names)
    probs = pipeline.predict_proba(names).max(axis=1)

    for idx, pred, prob in zip(df[uncategorized_mask].index, preds, probs):
        if prob >= confidence_threshold:
            df.loc[idx, "category"] = pred
            df.loc[idx, "category_confidence"] = round(float(prob), 3)
        else:
            df.loc[idx, "category"] = "General Accessories"
            df.loc[idx, "category_confidence"] = round(float(prob), 3)

    return df
