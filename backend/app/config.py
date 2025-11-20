import os

from dotenv import load_dotenv

load_dotenv()

BREVO_API_KEY = os.getenv("BREVO_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./plants.db")
PERENUAL_API_KEY = os.getenv("PERENUAL_API_KEY")
PERENUAL_BASE_URL = os.getenv("PERENUAL_BASE_URL", "https://perenual.com/api")