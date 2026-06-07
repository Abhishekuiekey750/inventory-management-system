from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.config import settings

# pool_pre_ping checks the connection health before executing queries, highly recommended in production
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator[Session, None, None]:
    """
    Dependency generator for obtaining a database session.
    Ensures that the session is always closed after the request is completed.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
