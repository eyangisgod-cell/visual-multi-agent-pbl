from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import Optional, List
import asyncpg
import os
from app.middleware.auth import require_auth, get_current_user

router = APIRouter(prefix="/auth", tags=["authentication"])


class TokenVerifyRequest(BaseModel):
    token: str


class TokenVerifyResponse(BaseModel):
    valid: bool
    user_id: Optional[str] = None
    username: Optional[str] = None


class UserInfo(BaseModel):
    id: str
    username: str
    nickname: Optional[str] = None
    grade: Optional[int] = None


class UserInfoResponse(BaseModel):
    user: UserInfo


@router.post("/verify")
async def verify_token(request: TokenVerifyRequest) -> TokenVerifyResponse:
    """
    Verify a JWT token and return user info
    This endpoint doesn't require authentication itself
    """
    from jose import jwt, JWTError

    JWT_SECRET = os.getenv("JWT_SECRET", "visual-pbl-jwt-secret-key-change-in-production")

    try:
        payload = jwt.decode(request.token, JWT_SECRET, algorithms=["HS256"])
        return TokenVerifyResponse(
            valid=True,
            user_id=payload.get("userId"),
            username=payload.get("username")
        )
    except JWTError:
        return TokenVerifyResponse(valid=False)


@router.get("/me", response_model=UserInfoResponse)
async def get_current_user_info(payload: dict = Depends(require_auth)):
    """
    Get current authenticated user information
    Requires valid JWT token in Authorization header
    """
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database configuration error"
        )

    try:
        conn = await asyncpg.connect(database_url)

        user = await conn.fetchrow(
            """
            SELECT id, username, nickname, grade, invitation_code
            FROM users
            WHERE id = $1
            """,
            payload.get("userId")
        )

        await conn.close()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        return UserInfoResponse(
            user=UserInfo(
                id=user["id"],
                username=user["username"],
                nickname=user["nickname"],
                grade=user["grade"]
            )
        )
    except asyncpg.PostgresError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
