# backend/db/database.py
import os
from pathlib import Path
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

# Ensure .env is loaded from backend directory
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / ".env")

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./techzone.db")

# Engine options with connection health checks & resilient pooling
engine_kwargs = {}
if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs.update({
        "pool_pre_ping": True,
        "pool_size": 20,
        "max_overflow": 30,
        "pool_recycle": 1800,
    })

engine = create_engine(DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from backend.models import (
        tenant,
        user,
        product,
        category,
        order,
        coupon,
        customer,
        agent_session,
    )
    Base.metadata.create_all(bind=engine)

    # Resilient auto-migration for existing database schemas
    try:
        with engine.connect() as conn:
            if engine.dialect.name == "postgresql":
                conn.execute(text("ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS governorate VARCHAR(100) DEFAULT 'القاهرة';"))
                conn.execute(text("ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS social_links JSON DEFAULT '{}';"))
                conn.commit()
            elif engine.dialect.name == "sqlite":
                conn.execute(text("ALTER TABLE store_settings ADD COLUMN governorate VARCHAR(100) DEFAULT 'القاهرة';"))
                conn.execute(text("ALTER TABLE store_settings ADD COLUMN social_links JSON DEFAULT '{}';"))
                conn.commit()
    except Exception:
        pass
