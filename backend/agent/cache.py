# backend/agent/cache.py
import json
import time
import logging
from typing import Any, Callable, Optional
from backend import config

logger = logging.getLogger(__name__)

# Fallback in-memory cache if redis is not reachable
_local_cache: dict[str, tuple[float, Any]] = {}
_redis_client = None

def _get_redis():
    global _redis_client
    if _redis_client is not None:
        return _redis_client
    try:
        import redis
        client = redis.from_url(config.REDIS_URL, decode_responses=True, socket_timeout=1)
        client.ping()
        _redis_client = client
        return _redis_client
    except Exception:
        return None

def get_cached(key: str) -> Optional[Any]:
    r = _get_redis()
    if r:
        try:
            val = r.get(key)
            if val:
                return json.loads(val)
        except Exception:
            pass
    # Local memory fallback
    if key in _local_cache:
        expire_at, data = _local_cache[key]
        if time.time() < expire_at:
            return data
        else:
            del _local_cache[key]
    return None

def set_cached(key: str, data: Any, ttl_seconds: int = 120):
    r = _get_redis()
    if r:
        try:
            r.setex(key, ttl_seconds, json.dumps(data, default=str))
            return
        except Exception:
            pass
    _local_cache[key] = (time.time() + ttl_seconds, data)

def invalidate_cache(prefix: str):
    r = _get_redis()
    if r:
        try:
            keys = r.keys(f"{prefix}*")
            if keys:
                r.delete(*keys)
        except Exception:
            pass
    to_delete = [k for k in _local_cache if k.startswith(prefix)]
    for k in to_delete:
        del _local_cache[k]
