# backend/db/database.py
import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # Use local sqlite database for robust, zero-friction local execution
    db_path = Path(__file__).resolve().parent.parent / "techzone.db"
    DATABASE_URL = f"sqlite:///{db_path}"

# SQLite specific connect args
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
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
