import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PORT: int = int(os.getenv("PORT", "8000"))
    MONGODB_URI: str = os.getenv(
        "MONGODB_URI",
        "mongodb+srv://pavithra:pavithrapavi6048@grocery.5jnaift.mongodb.net/?appName=grocery"
    )
    DB_NAME: str = os.getenv("DB_NAME", "test")
    AI_SERVICE_SECRET: str = os.getenv("AI_SERVICE_SECRET", "local_grocery_ai_secret_key_2026")
    NODE_BACKEND_URL: str = os.getenv("NODE_BACKEND_URL", "http://localhost:5000")
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "pavithrapavi6048@gmail.com")
    GMAIL_USER: str = os.getenv("GMAIL_USER", "")
    GMAIL_APP_PASSWORD: str = os.getenv("GMAIL_APP_PASSWORD", "")

settings = Settings()
