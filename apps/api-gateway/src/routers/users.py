"""
User Management Router

Handles user profile operations and data source selection.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel
from typing import Dict, Any, Optional
import structlog

from ..dependencies import get_supabase_client

logger = structlog.get_logger()
router = APIRouter(tags=["users"])


class UserResponse(BaseModel):
    """User profile response model"""
    id: str
    email: str
    name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    has_selected_data_source: bool = False
    last_login: Optional[str] = None


@router.put("/data-source")
async def select_data_source(
    request: Request,
    supabase=Depends(get_supabase_client)
) -> Dict[str, Any]:
    """
    Mark that the user has selected their data source (sample or custom).
    This is called after onboarding when user completes data source selection.
    
    Returns:
        Success response with updated status
    """
    # Get user from session
    user_session = request.session.get("user")
    if not user_session or not user_session.get("user_id"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    user_id = user_session["user_id"]
    
    try:
        # Update user metadata in Supabase to mark data source as selected
        # Note: We only update the has_selected_data_source flag, not the entire session
        response = supabase.auth.admin.update_user_by_id(
            user_id,
            {
                "user_metadata": {
                    "has_selected_data_source": True
                }
            }
        )
        
        # Update session with new status
        user_session["has_selected_data_source"] = True
        request.session["user"] = user_session
        
        logger.info(
            "Data source selected",
            user_id=user_id
        )
        
        return {
            "success": True,
            "message": "Data source selection recorded",
            "has_selected_data_source": True
        }
        
    except Exception as e:
        logger.error(
            "Failed to update data source selection",
            user_id=user_id,
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update data source selection"
        )
