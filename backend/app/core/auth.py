"""
auth.py — JWT verification for Supabase Auth tokens.

Provides a FastAPI dependency `get_current_user` that:
  1. Reads the Authorization: Bearer <token> header
  2. Decodes and verifies the JWT against Supabase's JWT secret
  3. Returns user info (sub, email) or raises 401

Also provides `optional_user` which returns None instead of 401
for endpoints that work both authenticated and anonymously.
"""

import os
import logging
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt  # PyJWT

logger = logging.getLogger(__name__)

# Supabase JWT secret — found in Dashboard → Settings → API → JWT Secret
# Falls back to empty string; if empty, auth is effectively disabled (dev mode)
JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "").strip()
JWT_ALGORITHM = "HS256"

_bearer = HTTPBearer(auto_error=False)


class AuthUser:
    """Minimal user object extracted from a verified JWT."""
    def __init__(self, sub: str, email: str, role: str = "authenticated"):
        self.sub = sub      # Supabase user UUID
        self.email = email
        self.role = role

    def __repr__(self):
        return f"AuthUser(email={self.email!r})"


def _decode_token(token: str) -> dict:
    """Decode and verify a Supabase JWT. Raises on failure."""
    if not JWT_SECRET:
        # Dev mode: no secret configured → trust the token payload without verification
        logger.warning("SUPABASE_JWT_SECRET not set — skipping JWT verification (dev mode)")
        return jwt.decode(token, options={"verify_signature": False})

    return jwt.decode(
        token,
        JWT_SECRET,
        algorithms=[JWT_ALGORITHM],
        audience="authenticated",
    )


async def get_current_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> AuthUser:
    """
    **Required auth** dependency.
    Raises 401 if no valid token is provided.
    """
    if creds is None or not creds.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = _decode_token(creds.credentials)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

    return AuthUser(
        sub=payload.get("sub", ""),
        email=payload.get("email", ""),
        role=payload.get("role", "authenticated"),
    )


async def optional_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> Optional[AuthUser]:
    """
    **Optional auth** dependency.
    Returns AuthUser if a valid token is present, None otherwise.
    Useful for endpoints that work both ways.
    """
    if creds is None or not creds.credentials:
        return None

    try:
        payload = _decode_token(creds.credentials)
        return AuthUser(
            sub=payload.get("sub", ""),
            email=payload.get("email", ""),
            role=payload.get("role", "authenticated"),
        )
    except Exception:
        return None
