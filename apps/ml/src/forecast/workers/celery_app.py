# apps/ml/src/forecast/workers/celery_app.py
"""Celery application for asynchronous tenant forecast retraining."""
import os

from celery import Celery
from celery.schedules import crontab

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "techzone_forecast",
    broker=os.getenv("CELERY_BROKER_URL", f"{REDIS_URL.rstrip('/')}".replace("/0", "/1")),
    # No result backend by default: the retrain job is fire-and-forget and a
    # missing Redis must not block the HTTP request that queued it.
    backend=os.getenv("CELERY_RESULT_BACKEND"),
    include=["apps.ml.src.forecast.workers.retrain_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Africa/Cairo",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=60 * 30,
    # The retrain job is fire-and-forget: no result backend is contacted, so a
    # missing Redis broker fails fast instead of blocking the HTTP request.
    task_ignore_result=True,
    result_backend_always_retry=False,
    broker_connection_timeout=1,
    broker_connection_max_retries=0,
    broker_connection_retry_on_startup=False,
    broker_transport_options={
        "socket_connect_timeout": 1,
        "socket_timeout": 1,
        "retry_policy": {"max_retries": 0, "interval_start": 0, "interval_step": 0, "interval_max": 0},
    },
    result_backend_transport_options={
        "socket_connect_timeout": 1,
        "socket_timeout": 1,
        "retry_policy": {"max_retries": 0},
    },
    task_always_eager=os.getenv("CELERY_TASK_ALWAYS_EAGER", "0") == "1",
    task_eager_propagates=True,
)

celery_app.conf.beat_schedule = {
    "weekly-forecast-retrain": {
        "task": "retrain_tenant_forecast_models",
        "schedule": crontab(day_of_week="mon", hour=2, minute=0),
        "args": ("tenant-demo-01",),
    }
}
