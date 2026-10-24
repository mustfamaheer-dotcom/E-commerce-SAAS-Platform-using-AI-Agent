# backend/core/auth.py
"""FastAPI Authentication and Authorization (RBAC) dependencies."""
from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from backend.db.database import get_db
from backend.models.user import User
from backend.core.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Extract authenticated user if valid token is provided, otherwise return None."""
    if not token:
        return None
    
    payload = decode_access_token(token)
    if not payload:
        return None
    
    user_id = payload.get("sub")
    if not user_id:
        return None
    
    user = db.query(User).filter(User.id == user_id).first()
    return user


def get_current_user(
    user: Optional[User] = Depends(get_current_user_optional)
) -> User:
    """Enforce authenticated user, raising 401 Unauthorized if missing."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided or invalid",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_roles(allowed_roles: List[str]):
    """Role-Based Access Control (RBAC) dependency factory."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role = (current_user.role or "owner").lower()
        allowed = [r.lower() for r in allowed_roles]
        if user_role not in allowed and "admin" not in user_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: role '{current_user.role}' lacks permission for this action",
            )
        return current_user
    return role_checker


def get_current_tenant_id(
    current_user: User = Depends(get_current_user)
) -> str:
    """Extract tenant_id guaranteed to belong to authenticated user."""
    if not current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Authenticated user is not associated with any store/tenant",
        )
    return current_user.tenant_id

