import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from app.models.database import get_db_connection
from app.models.schemas import (
    SavedFounder, SavedFounderCreate, Watchlist, WatchlistCreate
)


class SavedRepository:

    @staticmethod
    def get_saved_founders() -> List[SavedFounder]:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM saved_founders ORDER BY created_at DESC")
        rows = cursor.fetchall()

        founders = []
        for row in rows:
            # Fetch associated watchlists
            cursor.execute(
                "SELECT watchlist_id FROM watchlist_items WHERE founder_profile_id = ?",
                (row["profile_id"],)
            )
            watchlist_ids = [w[0] for w in cursor.fetchall()]

            tags = []
            if row["tags"]:
                try:
                    tags = json.loads(row["tags"])
                except Exception:
                    tags = []

            raw_profile = None
            if row["raw_profile_json"]:
                try:
                    raw_profile = json.loads(row["raw_profile_json"])
                except Exception:
                    raw_profile = None

            founders.append(
                SavedFounder(
                    id=row["id"],
                    profile_id=row["profile_id"],
                    name=row["name"],
                    headline=row["headline"],
                    current_company=row["current_company"],
                    current_title=row["current_title"],
                    location=row["location"],
                    watchlist_ids=watchlist_ids,
                    notes=row["notes"],
                    tags=tags,
                    raw_profile=raw_profile,
                    created_at=row["created_at"],
                    updated_at=row["updated_at"],
                )
            )

        conn.close()
        return founders

    @staticmethod
    def get_saved_founder(profile_id: str) -> Optional[SavedFounder]:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM saved_founders WHERE profile_id = ?", (profile_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            return None

        cursor.execute(
            "SELECT watchlist_id FROM watchlist_items WHERE founder_profile_id = ?",
            (profile_id,)
        )
        watchlist_ids = [w[0] for w in cursor.fetchall()]

        tags = []
        if row["tags"]:
            try:
                tags = json.loads(row["tags"])
            except Exception:
                tags = []

        raw_profile = None
        if row["raw_profile_json"]:
            try:
                raw_profile = json.loads(row["raw_profile_json"])
            except Exception:
                raw_profile = None

        conn.close()
        return SavedFounder(
            id=row["id"],
            profile_id=row["profile_id"],
            name=row["name"],
            headline=row["headline"],
            current_company=row["current_company"],
            current_title=row["current_title"],
            location=row["location"],
            watchlist_ids=watchlist_ids,
            notes=row["notes"],
            tags=tags,
            raw_profile=raw_profile,
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )

    @staticmethod
    def save_founder(data: SavedFounderCreate) -> SavedFounder:
        conn = get_db_connection()
        cursor = conn.cursor()

        now = datetime.now(timezone.utc).isoformat()
        item_id = str(uuid.uuid4())
        tags_json = json.dumps(data.tags)
        raw_json = json.dumps(data.raw_profile) if data.raw_profile else None

        cursor.execute("""
        INSERT INTO saved_founders 
        (id, profile_id, name, headline, current_company, current_title, location, notes, tags, raw_profile_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(profile_id) DO UPDATE SET
            name=excluded.name,
            headline=excluded.headline,
            current_company=excluded.current_company,
            current_title=excluded.current_title,
            location=excluded.location,
            notes=COALESCE(excluded.notes, saved_founders.notes),
            updated_at=excluded.updated_at
        """, (
            item_id, data.profile_id, data.name, data.headline,
            data.current_company, data.current_title, data.location,
            data.notes, tags_json, raw_json, now, now
        ))

        if data.watchlist_id:
            cursor.execute("""
            INSERT OR IGNORE INTO watchlist_items (watchlist_id, founder_profile_id, added_at)
            VALUES (?, ?, ?)
            """, (data.watchlist_id, data.profile_id, now))

        conn.commit()
        conn.close()
        return SavedRepository.get_saved_founder(data.profile_id)

    @staticmethod
    def remove_saved_founder(profile_id: str) -> bool:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM saved_founders WHERE profile_id = ?", (profile_id,))
        cursor.execute("DELETE FROM watchlist_items WHERE founder_profile_id = ?", (profile_id,))
        conn.commit()
        conn.close()
        return True

    @staticmethod
    def update_notes(profile_id: str, notes: str) -> bool:
        conn = get_db_connection()
        cursor = conn.cursor()
        now = datetime.now(timezone.utc).isoformat()
        cursor.execute("""
        UPDATE saved_founders 
        SET notes = ?, updated_at = ?
        WHERE profile_id = ?
        """, (notes, now, profile_id))
        conn.commit()
        conn.close()
        return True

    @staticmethod
    def get_watchlists() -> List[Watchlist]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        SELECT w.*, COUNT(wi.founder_profile_id) as member_count
        FROM watchlists w
        LEFT JOIN watchlist_items wi ON w.id = wi.watchlist_id
        GROUP BY w.id
        ORDER BY w.created_at ASC
        """)
        rows = cursor.fetchall()
        watchlists = [
            Watchlist(
                id=r["id"],
                name=r["name"],
                description=r["description"],
                color=r["color"],
                member_count=r["member_count"],
                created_at=r["created_at"],
            )
            for r in rows
        ]
        conn.close()
        return watchlists

    @staticmethod
    def create_watchlist(data: WatchlistCreate) -> Watchlist:
        conn = get_db_connection()
        cursor = conn.cursor()
        now = datetime.now(timezone.utc).isoformat()
        wl_id = f"wl_{uuid.uuid4().hex[:8]}"

        cursor.execute("""
        INSERT INTO watchlists (id, name, description, color, created_at)
        VALUES (?, ?, ?, ?, ?)
        """, (wl_id, data.name, data.description, data.color, now))

        conn.commit()
        conn.close()
        return Watchlist(
            id=wl_id,
            name=data.name,
            description=data.description,
            color=data.color,
            member_count=0,
            created_at=now,
        )

    @staticmethod
    def add_to_watchlist(watchlist_id: str, profile_id: str) -> bool:
        conn = get_db_connection()
        cursor = conn.cursor()
        now = datetime.now(timezone.utc).isoformat()
        cursor.execute("""
        INSERT OR IGNORE INTO watchlist_items (watchlist_id, founder_profile_id, added_at)
        VALUES (?, ?, ?)
        """, (watchlist_id, profile_id, now))
        conn.commit()
        conn.close()
        return True

    @staticmethod
    def remove_from_watchlist(watchlist_id: str, profile_id: str) -> bool:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        DELETE FROM watchlist_items 
        WHERE watchlist_id = ? AND founder_profile_id = ?
        """, (watchlist_id, profile_id))
        conn.commit()
        conn.close()
        return True

    @staticmethod
    def record_search(query: str, filters: Dict[str, Any], count: int):
        conn = get_db_connection()
        cursor = conn.cursor()
        search_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        filters_json = json.dumps(filters)

        cursor.execute("""
        INSERT INTO recent_searches (id, query, filters_json, result_count, created_at)
        VALUES (?, ?, ?, ?, ?)
        """, (search_id, query, filters_json, count, now))

        conn.commit()
        conn.close()

    @staticmethod
    def get_recent_searches(limit: int = 10) -> List[Dict[str, Any]]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        SELECT * FROM recent_searches 
        ORDER BY created_at DESC 
        LIMIT ?
        """, (limit,))
        rows = cursor.fetchall()
        results = []
        for r in rows:
            f = {}
            if r["filters_json"]:
                try:
                    f = json.loads(r["filters_json"])
                except Exception:
                    f = {}
            results.append({
                "id": r["id"],
                "query": r["query"],
                "filters": f,
                "result_count": r["result_count"],
                "created_at": r["created_at"],
            })
        conn.close()
        return results
