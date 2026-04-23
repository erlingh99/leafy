import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

MIGRATIONS_PATH = Path(__file__).parent.parent / "alembic.ini"
DATABASE_PATH = "sqlite+aiosqlite:////app/data/plants.db"
PERENUAL_BASE_URL = "https://perenual.com/api"
BREVO_API_KEY = os.getenv("BREVO_API_KEY")
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
PERENUAL_API_KEY = os.getenv("PERENUAL_API_KEY")