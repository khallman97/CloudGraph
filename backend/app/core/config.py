import os

# Database
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://cloudgraph:cloudgraph@localhost:5432/cloudgraph")

# JWT Settings
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-please-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
