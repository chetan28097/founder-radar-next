from datetime import datetime, timezone
from fastapi import APIRouter
from app.config import settings
from app.models.schemas import HealthResponse
from app.observability.tracer import is_tracer_active
from app.models.database import get_db_connection

router = APIRouter(tags=["Health & Status"])


@router.get("/health", response_model=HealthResponse)
@router.get("/api/health", response_model=HealthResponse)
def health_check():
    # Database check
    db_ok = False
    try:
        conn = get_db_connection()
        conn.execute("SELECT 1")
        conn.close()
        db_ok = True
    except Exception:
        db_ok = False

    crustdata_ok = bool(settings.CRUSTDATA_API_KEY)
    litellm_ok = bool(settings.LITELLM_API_KEY and settings.LITELLM_MODEL)
    neatlogs_ok = is_tracer_active() or bool(settings.NEATLOGS_API_KEY)

    overall_status = "healthy" if (db_ok and crustdata_ok and litellm_ok) else "degraded"

    return HealthResponse(
        status=overall_status,
        crustdata_connected=crustdata_ok,
        litellm_connected=litellm_ok,
        neatlogs_connected=neatlogs_ok,
        model_id=settings.LITELLM_MODEL,
        database_connected=db_ok,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
