from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import get_current_user
from app.models import User
from app.schemas.diagram import ArchitectureRequest
from app.services.pricing import calculate_costs, PRICING

router = APIRouter()


@router.post("/estimate")
async def estimate_costs(
    request: ArchitectureRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Estimate monthly costs for the provided architecture.

    Args:
        request: Architecture diagram with nodes and edges
        current_user: Authenticated user

    Returns:
        Cost estimate with total and breakdown by resource
    """
    try:
        result = calculate_costs(request.nodes)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating costs: {str(e)}"
        )


@router.get("/pricing")
async def get_pricing(
    current_user: User = Depends(get_current_user)
):
    """
    Get the pricing catalog for all supported resources.

    Returns:
        Dictionary of resource types and their monthly costs
    """
    return {
        "pricing": PRICING,
        "currency": "USD",
        "period": "monthly"
    }
