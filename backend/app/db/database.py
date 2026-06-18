"""SQLAlchemy engine, session factory, and Base for WomenAId."""
from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import DATABASE_URL

# check_same_thread=False is required for SQLite used from FastAPI's threadpool.
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def init_db() -> None:
    """Create all tables. Imports models so they register on Base first."""
    from app.models import (  # noqa: F401  (registers tables on Base)
        anonymized_stat,
        audit,
        consent,
        patient,
        risk_assessment,
        symptom,
        user,
    )

    Base.metadata.create_all(bind=engine)


def get_db():
    """FastAPI dependency yielding a request-scoped DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
