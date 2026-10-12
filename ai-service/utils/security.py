from fastapi import Header, HTTPException, status
from config.settings import settings

def verify_internal_secret(
    x_internal_secret: str = Header(default="", alias="X-Internal-Secret")
):
    """
    Ensures internal requests to AI service originate from authorized Node.js backend.
    """
    configured_secret = settings.AI_SERVICE_SECRET
    if not configured_secret:
        return True

    # If secret is provided and matches, allow
    if x_internal_secret == configured_secret:
        return True

    # Reject unauthorized direct external requests
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Unauthorized access: Invalid or missing internal service secret."
    )
