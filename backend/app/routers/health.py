from fastapi import APIRouter

router = APIRouter()

@router.get("/health", tags=["Health"])
def health_check():
    """
    Returns the application health status.
    Used for docker health checks and platform keep-alive monitoring (e.g. on Render).
    """
    return {"status": "healthy"}
