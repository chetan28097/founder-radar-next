import os
import tempfile

from app.config import settings
from app.models import database

# Tests must never touch the real founder_radar.db or ship spans with the real
# Neatlogs key. config.py loads .env with override=True, so environment variables
# cannot override it; patch the settings object before any test module imports the app.
_tmp_dir = tempfile.mkdtemp(prefix="founder-radar-tests-")
settings.DATABASE_PATH = os.path.join(_tmp_dir, "test.db")
settings.NEATLOGS_API_KEY = ""
database._initialized = False
