# apps/ml/src/customers/rfm_service.py
"""
Unsupervised ML Customer Segmentation Service using Log-RFM Transformation and K-Means.
Implements Section 1A / [TASK-RENAD-ML] with Silhouette evaluation and deterministic mapping.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.metrics import davies_bouldin_score, silhouette_score
from sklearn.preprocessing import StandardScaler

from apps.ml.src.customers import mock_customer_store

SEGMENT_ACTIONS = {
    "VIP Champions": {
        "action_en": "Offer early access to new collections and dedicated loyalty rewards.",
        "action_ar": "قدم لهم وصول مبكر للمنتجات الجديدة ومكافآت ولاء مميزة للحفاظ عليهم.",
        "badge_color": "emerald",
    },
    "Loyal Customers": {
        "action_en": "Upsell premium bundles and offer value-add incentives.",
        "action_ar": "اقترح عليهم باقات مميزة وعروض تكميلية لزيادة قيمة سلة المشتريات.",
        "badge_color": "blue",
    },
    "New Customers": {
        "action_en": "Send onboarding welcome sequences and a second-order voucher.",
        "action_ar": "ارسل لهم رسائل ترحيب وكوبون خصم لتشجيع الطلب التاني.",
        "badge_color": "amber",
    },
    "At-Risk of Churn": {
        "action_en": "Launch targeted win-back campaign with a 15% discount.",
        "action_ar": "اطلق حملة استعادة فورية بكوبون خصم 15% للعملاء المعرضين للمغادرة.",
        "badge_color": "rose",
    },
    "Hibernating / Lost": {
        "action_en": "Re-engage via seasonal discount clearance or survey inquiries.",
        "action_ar": "حاول اعادة تنشيطهم بعروض التخفيضات الموسمية أو استبيانات الرأي.",
        "badge_color": "gray",
    },
}


class RfmSegmentationPipeline:
    def __init__(self, n_clusters: int = 5, random_state: int = 42):
        self.n_clusters = n_clusters
        self.random_state = random_state
        self.scaler = StandardScaler()
        self.kmeans = KMeans(n_clusters=self.n_clusters, n_init=10, random_state=self.random_state)

    def extract_rfm(self, orders: List[Dict], as_of_date: Optional[datetime] = None) -> pd.DataFrame:
        if not orders:
            return pd.DataFrame(columns=["customer_id", "recency", "frequency", "monetary"])

        if as_of_date is None:
            as_of_date = datetime(2026, 10, 21, 12, 0, 0, tzinfo=timezone.utc)

        df = pd.DataFrame(orders)
        df["created_at"] = pd.to_datetime(df["created_at"], utc=True)

        grouped = df.groupby("customer_id").agg(
            latest_order=("created_at", "max"),
            frequency=("id", "nunique"),
            monetary=("total", "sum"),
        ).reset_index()

        grouped["recency"] = (as_of_date - grouped["latest_order"]).dt.total_seconds() / (24 * 3600)
        grouped["recency"] = grouped["recency"].clip(lower=0.1)

        return grouped[["customer_id", "recency", "frequency", "monetary"]]

    def fit_predict(self, rfm_df: pd.DataFrame) -> Dict[str, Any]:
        if len(rfm_df) < self.n_clusters:
            raise ValueError(f"Insufficient customers ({len(rfm_df)}) to form {self.n_clusters} clusters")

        # 1. Skewness Correction using natural log transform: ln(1 + x)
        features_log = np.log1p(rfm_df[["recency", "frequency", "monetary"]].to_numpy())

        # 2. Standardization
        scaled = self.scaler.fit_transform(features_log)

        # 3. K-Means clustering
        labels = self.kmeans.fit_predict(scaled)

        # 4. Cluster Quality Metrics
        sil_score = float(silhouette_score(scaled, labels))
        db_score = float(davies_bouldin_score(scaled, labels))

        # 5. Programmatic Cluster Labeling
        centroids = self.kmeans.cluster_centers_

        # Deterministic cluster identification based on centroid feature profiles:
        # Centroid dimensions: [0: log_R, 1: log_F, 2: log_M]
        # We classify clusters by comparing their R, F, M centroids
        cluster_meta = []
        for c_idx in range(self.n_clusters):
            c_r, c_f, c_m = centroids[c_idx]
            cluster_meta.append({
                "cluster_id": c_idx,
                "r": c_r,
                "f": c_f,
                "m": c_m,
                "score": c_f + c_m - c_r,
            })

        # Sort by composite score
        sorted_by_score = sorted(cluster_meta, key=lambda x: x["score"], reverse=True)

        # Map highest to VIP, lowest to Hibernating
        label_mapping: Dict[int, str] = {}
        assigned_clusters = set()

        # Highest score -> VIP Champions
        vip_c = sorted_by_score[0]["cluster_id"]
        label_mapping[vip_c] = "VIP Champions"
        assigned_clusters.add(vip_c)

        # Lowest score (highest R, low F, low M) -> Hibernating / Lost
        hib_c = sorted(cluster_meta, key=lambda x: x["r"], reverse=True)[0]["cluster_id"]
        if hib_c not in assigned_clusters:
            label_mapping[hib_c] = "Hibernating / Lost"
            assigned_clusters.add(hib_c)

        # Remaining candidates:
        rem = [c for c in sorted_by_score if c["cluster_id"] not in assigned_clusters]

        # Highest recency remaining -> At-Risk of Churn
        rem_by_r = sorted(rem, key=lambda x: x["r"], reverse=True)
        if rem_by_r:
            at_risk_c = rem_by_r[0]["cluster_id"]
            label_mapping[at_risk_c] = "At-Risk of Churn"
            assigned_clusters.add(at_risk_c)

        rem = [c for c in sorted_by_score if c["cluster_id"] not in assigned_clusters]
        if len(rem) >= 2:
            # Between remaining, higher score is Loyal, lower is New
            label_mapping[rem[0]["cluster_id"]] = "Loyal Customers"
            label_mapping[rem[1]["cluster_id"]] = "New Customers"
        elif len(rem) == 1:
            label_mapping[rem[0]["cluster_id"]] = "Loyal Customers"

        # Fallback safeguard in case any cluster missed
        for c in range(self.n_clusters):
            if c not in label_mapping:
                label_mapping[c] = f"Cluster {c}"

        rfm_with_labels = rfm_df.copy()
        rfm_with_labels["cluster"] = labels
        rfm_with_labels["segment"] = rfm_with_labels["cluster"].map(label_mapping)

        # Segment summaries
        segments_summary = []
        for segment_name in ["VIP Champions", "Loyal Customers", "New Customers", "At-Risk of Churn", "Hibernating / Lost"]:
            seg_data = rfm_with_labels[rfm_with_labels["segment"] == segment_name]
            count = len(seg_data)
            avg_r = float(seg_data["recency"].mean()) if count > 0 else 0.0
            avg_f = float(seg_data["frequency"].mean()) if count > 0 else 0.0
            avg_m = float(seg_data["monetary"].mean()) if count > 0 else 0.0

            action_info = SEGMENT_ACTIONS.get(segment_name, {
                "action_en": "Monitor customer engagement.",
                "action_ar": "متابعة تفاعل العملاء.",
                "badge_color": "gray",
            })

            segments_summary.append({
                "segment_name": segment_name,
                "customer_count": int(count),
                "avg_recency_days": round(avg_r, 1),
                "avg_frequency": round(avg_f, 1),
                "avg_monetary_egp": round(avg_m, 2),
                "recommended_action_en": action_info["action_en"],
                "recommended_action_ar": action_info["action_ar"],
                "badge_color": action_info["badge_color"],
            })

        return {
            "silhouette_score": round(sil_score, 4),
            "davies_bouldin_score": round(db_score, 4),
            "total_customers": len(rfm_df),
            "segments": segments_summary,
            "customer_assignments": rfm_with_labels[["customer_id", "segment", "recency", "frequency", "monetary"]].to_dict(orient="records"),
        }


def run_rfm_segmentation(tenant_id: str = "tenant-demo-01") -> Dict[str, Any]:
    orders = mock_customer_store.list_tenant_orders(tenant_id, status="PAID")
    pipeline = RfmSegmentationPipeline(n_clusters=5)
    rfm_df = pipeline.extract_rfm(orders)
    result = pipeline.fit_predict(rfm_df)
    result["tenant_id"] = tenant_id
    return result
