import sqlite3
import os
import logging
from datetime import datetime, timezone
from app.config import settings

logger = logging.getLogger(__name__)

_initialized = False


def _init_db_with_conn(conn: sqlite3.Connection):
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS watchlists (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        color TEXT DEFAULT 'blue',
        created_at TEXT NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS saved_founders (
        id TEXT PRIMARY KEY,
        profile_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        headline TEXT,
        current_company TEXT,
        current_title TEXT,
        location TEXT,
        notes TEXT,
        tags TEXT DEFAULT '[]',
        raw_profile_json TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS watchlist_items (
        watchlist_id TEXT NOT NULL,
        founder_profile_id TEXT NOT NULL,
        added_at TEXT NOT NULL,
        PRIMARY KEY (watchlist_id, founder_profile_id),
        FOREIGN KEY (watchlist_id) REFERENCES watchlists(id) ON DELETE CASCADE
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS recent_searches (
        id TEXT PRIMARY KEY,
        query TEXT,
        filters_json TEXT,
        result_count INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
    )
    """)

    # Seed default watchlists if none exist
    cursor.execute("SELECT COUNT(*) FROM watchlists")
    if cursor.fetchone()[0] == 0:
        now = datetime.now(timezone.utc).isoformat()
        cursor.execute("""
        INSERT INTO watchlists (id, name, description, color, created_at)
        VALUES 
            ('wl_ai_founders', 'AI & Infrastructure Founders', 'High conviction builders in AI and ML infra', 'purple', ?),
            ('wl_fintech_ex_stripe', 'Ex-Stripe & Fintech Leaders', 'Founders emerging from payment & infrastructure giants', 'emerald', ?),
            ('wl_seed_watch', 'Seed Stage Stealth', 'Early stage ventures and recent spinouts', 'cyan', ?)
        """, (now, now, now))

    conn.commit()


def get_db_connection() -> sqlite3.Connection:
    global _initialized
    conn = sqlite3.connect(settings.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    if not _initialized:
        _init_db_with_conn(conn)
        _initialized = True
    return conn


def init_db():
    conn = get_db_connection()
    conn.close()
    logger.info("Database initialized.")
