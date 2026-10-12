import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from app.models.database import get_db_connection
from app.models.schemas import ResearchResponse


class ProfileCacheRepository:

    @staticmethod
    def upsert_raw(profile_id: str, raw: Dict[str, Any]):
        conn = get_db_connection()
        now = datetime.now(timezone.utc).isoformat()
        conn.execute("""
        INSERT INTO profile_cache (profile_id, raw_json, fetched_at)
        VALUES (?, ?, ?)
        ON CONFLICT(profile_id) DO UPDATE SET
            raw_json=excluded.raw_json,
            fetched_at=excluded.fetched_at
        """, (profile_id, json.dumps(raw), now))
        conn.commit()
        conn.close()

    @staticmethod
    def get_raw(profile_id: str) -> Optional[Dict[str, Any]]:
        conn = get_db_connection()
        row = conn.execute(
            "SELECT raw_json FROM profile_cache WHERE profile_id = ?", (profile_id,)
        ).fetchone()
        conn.close()
        if not row:
            return None
        try:
            return json.loads(row["raw_json"])
        except Exception:
            return None


class ResearchRepository:

    @staticmethod
    def save(result: ResearchResponse):
        conn = get_db_connection()
        conn.execute("""
        INSERT INTO research_results (profile_id, payload_json, generated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(profile_id) DO UPDATE SET
            payload_json=excluded.payload_json,
            generated_at=excluded.generated_at
        """, (result.profile_id, result.model_dump_json(), result.generated_at))
        conn.commit()
        conn.close()

    @staticmethod
    def get_latest(profile_id: str) -> Optional[ResearchResponse]:
        conn = get_db_connection()
        row = conn.execute(
            "SELECT payload_json FROM research_results WHERE profile_id = ?", (profile_id,)
        ).fetchone()
        conn.close()
        if not row:
            return None
        try:
            return ResearchResponse.model_validate_json(row["payload_json"])
        except Exception:
            return None

    @staticmethod
    def researched_at_map(profile_ids: List[str]) -> Dict[str, str]:
        if not profile_ids:
            return {}
        conn = get_db_connection()
        placeholders = ",".join("?" for _ in profile_ids)
        rows = conn.execute(
            f"SELECT profile_id, generated_at FROM research_results WHERE profile_id IN ({placeholders})",
            profile_ids,
        ).fetchall()
        conn.close()
        return {r["profile_id"]: r["generated_at"] for r in rows}
