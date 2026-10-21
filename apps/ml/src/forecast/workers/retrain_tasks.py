# apps/ml/src/forecast/workers/retrain_tasks.py
"""Celery tasks that retrain and promote the tenant forecast champion model."""
from apps.ml.src.forecast.workers.celery_app import celery_app


@celery_app.task(name="retrain_tenant_forecast_models", bind=True)
def retrain_tenant_forecast_models(self, tenant_id: str = "tenant-demo-01", force: bool = False):
    """
    Weekly retraining job. Runs outside the request path so live inference is
    never blocked; promotion only happens when the new WAPE improves.
    """
    # Imported lazily so the task can be exercised (and mocked) in isolation.
    from apps.ml.src.forecast.predictor import get_predictor
    from apps.ml.src.forecast.train_forecast import run_training

    metrics = run_training(quick=False, promote=not force)
    # Swap the champion without restarting the API: the predictor re-reads the
    # promoted artifact on the next request.
    get_predictor().invalidate_cache()
    return {
        "tenant_id": tenant_id,
        "task_id": self.request.id,
        "model_name": metrics["model_name"],
        "WAPE": metrics["WAPE"],
        "MAE": metrics["MAE"],
        "coverage_95": metrics["coverage_95"],
        "conformal_offset": metrics.get("conformal_offset"),
    }
