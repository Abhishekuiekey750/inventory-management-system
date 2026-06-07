from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import event
import datetime

class Base(DeclarativeBase):
    """
    SQLAlchemy DeclarativeBase subclass for 2.0-style model declarations.
    """
    pass

@event.listens_for(Base, "before_update", propagate=True)
def receive_before_update(mapper, connection, target):
    """
    SQLAlchemy event listener that automatically refreshes the `updated_at` 
    timestamp on any entity before it is updated.
    """
    if hasattr(target, "updated_at"):
        # Use timezone-aware UTC datetime
        target.updated_at = datetime.datetime.now(datetime.timezone.utc)
