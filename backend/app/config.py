import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

# Load .env file from backend root
load_dotenv(override=True)


class Settings(BaseSettings):
    PROJECT_NAME: str = "Founder Radar"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"

    # Crustdata Configuration
    CRUSTDATA_API_KEY: str = os.getenv("CRUSTDATA_API_KEY", "")
    CRUSTDATA_API_URL: str = "https://api.crustdata.com/person/search"
    CRUSTDATA_API_VERSION: str = "2025-11-01"

    # LiteLLM & Claude Configuration
    LITELLM_API_KEY: str = os.getenv("LITELLM_API_KEY", "")
    LITELLM_BASE_URL: str = os.getenv("LITELLM_BASE_URL", "https://litellm.vision.aivar.app").rstrip("/")
    LITELLM_MODEL: str = os.getenv("LITELLM_MODEL", "claude-sonnet-4.6")

    # Neatlogs Observability
    NEATLOGS_API_KEY: str = os.getenv("NEATLOGS_API_KEY", "")
    NEATLOGS_WORKFLOW: str = "founder-radar"

    # Database
    DATABASE_PATH: str = os.getenv("DATABASE_PATH", "founder_radar.db")

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
