from pymongo import MongoClient
from config.settings import settings

client = None
db = None

def get_db():
    global client, db
    if db is None:
        client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=5000)
        db_name = settings.DB_NAME or "test"
        try:
            default_db = client.get_default_database()
            if default_db is not None and default_db.name:
                db_name = default_db.name
        except Exception:
            pass
        db = client[db_name]
    return db

def check_db_connection() -> bool:
    try:
        get_db().command("ping")
        return True
    except Exception as e:
        print(f"MongoDB connection ping failed: {e}")
        return False
