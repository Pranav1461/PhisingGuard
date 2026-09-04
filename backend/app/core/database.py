import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Engine selection with automatic fallback to local SQLite when the
# configured PostgreSQL database is unreachable (e.g. wrong password, no
# network, placeholder env values).
# ---------------------------------------------------------------------------

def _make_engine(url: str):
    """Create a SQLAlchemy engine for the given URL."""
    create_kwargs = {}
    if url.startswith("sqlite"):
        create_kwargs["connect_args"] = {"check_same_thread": False}
    return create_engine(url, **create_kwargs, pool_pre_ping=True)


def _engine_is_reachable(engine) -> bool:
    """Return True if we can connect to the given engine."""
    try:
        with engine.connect() as conn:
            conn.execute(__import__("sqlalchemy").text("SELECT 1"))
        return True
    except Exception:
        return False


_primary_engine = _make_engine(settings.DATABASE_URL)

if _engine_is_reachable(_primary_engine):
    engine = _primary_engine
    logger.info(f"Using configured database: {settings.DATABASE_URL.split('@')[-1]}")
else:
    fallback_url = "sqlite:///./phishguard.db"
    engine = _make_engine(fallback_url)
    logger.warning(
        f"Configured database unreachable — falling back to local SQLite: {fallback_url}. "
        "Set DATABASE_URL to a valid PostgreSQL connection for production use."
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def init_db():
    from backend.app.models import analysis, simulator          # noqa: F401
    Base.metadata.create_all(bind=engine)

def get_db():
    init_db()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
