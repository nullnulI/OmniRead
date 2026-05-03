from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

from app.config import CONFIG

_engine: Engine | None = None


def engine() -> Engine:
    global _engine
    if _engine is None:
        _engine = create_engine(
            CONFIG["database"]["url"],
            pool_pre_ping=True,
            pool_recycle=3600,
            future=True,
        )
    return _engine


def fetchall(sql: str, **params) -> list[dict]:
    with engine().connect() as conn:
        rows = conn.execute(text(sql), params).mappings().all()
    return [dict(r) for r in rows]


def fetchone(sql: str, **params) -> dict | None:
    with engine().connect() as conn:
        row = conn.execute(text(sql), params).mappings().first()
    return dict(row) if row else None
