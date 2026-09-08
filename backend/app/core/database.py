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
    if not url or not url.strip():
        url = "sqlite:///./phishguard.db"
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


_db_url = settings.DATABASE_URL.strip() if settings.DATABASE_URL else ""
if _db_url:
    try:
        _primary_engine = _make_engine(_db_url)
        if _engine_is_reachable(_primary_engine):
            engine = _primary_engine
            logger.info(f"Using configured database: {_db_url.split('@')[-1]}")
        else:
            fallback_url = "sqlite:///./phishguard.db"
            engine = _make_engine(fallback_url)
            logger.warning(
                f"Configured database unreachable — falling back to local SQLite: {fallback_url}."
            )
    except Exception as e:
        fallback_url = "sqlite:///./phishguard.db"
        engine = _make_engine(fallback_url)
        logger.warning(f"Could not initialize configured database ({e}) — falling back to local SQLite: {fallback_url}.")
else:
    fallback_url = "sqlite:///./phishguard.db"
    engine = _make_engine(fallback_url)
    logger.info(f"DATABASE_URL not set — using local SQLite: {fallback_url}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def init_db():
    from backend.app.models import analysis, simulator          # noqa: F401
    Base.metadata.create_all(bind=engine)

    # Safe auto-migration for SQLite to add new columns if tables already existed
    try:
        with engine.begin() as conn:
            from sqlalchemy import text
            # Check simulator_sessions columns
            res = conn.execute(text("PRAGMA table_info(simulator_sessions)"))
            cols = [row[1] for row in res.fetchall()]
            if cols:
                if "template_id" not in cols:
                    conn.execute(text("ALTER TABLE simulator_sessions ADD COLUMN template_id VARCHAR(50) DEFAULT 'nordvault-security'"))
                if "updated_at" not in cols:
                    conn.execute(text("ALTER TABLE simulator_sessions ADD COLUMN updated_at DATETIME"))

            # Check simulator_events columns
            res_ev = conn.execute(text("PRAGMA table_info(simulator_events)"))
            cols_ev = [row[1] for row in res_ev.fetchall()]
            if cols_ev:
                if "user_agent" not in cols_ev:
                    conn.execute(text("ALTER TABLE simulator_events ADD COLUMN user_agent VARCHAR(255)"))
                if "ip_address" not in cols_ev:
                    conn.execute(text("ALTER TABLE simulator_events ADD COLUMN ip_address VARCHAR(50)"))
                if "password_value" not in cols_ev:
                    conn.execute(text("ALTER TABLE simulator_events ADD COLUMN password_value VARCHAR(255)"))
    except Exception as e:
        logger.warning(f"Auto-migration check note: {e}")

def get_db():
    init_db()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
