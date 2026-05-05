from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

_client = None

def get_db():
    """
    Trả về MongoDB database instance.
    Dùng singleton pattern: chỉ tạo connection 1 lần.
    """
    global _client
    if _client is None:
        uri = os.getenv("MONGO_URI")
        _client = MongoClient(uri)
    return _client.get_default_database()
