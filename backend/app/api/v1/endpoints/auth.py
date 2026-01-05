from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select

from app.core.db import get_session
from app.core.config import ACCESS_TOKEN_EXPIRE_MINUTES
from app.core.security import (
    hash_password,
    create_access_token,
    authenticate_user,
    get_current_user,
)
from app.models import User, UserCreate, UserRead, Token

router = APIRouter()


@router.post("/signup", response_model=UserRead)
async def signup(user_data: UserCreate, session: Session = Depends(get_session)):
    """Register a new user."""
    # Check if user already exists
    statement = select(User).where(User.email == user_data.email)
    existing_user = session.exec(statement).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user
    user = User(
        email=user_data.email,
        hashed_password=hash_password(user_data.password)
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    return user


@router.post("/token", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session)
):
    """Login and get an access token."""
    user = authenticate_user(session, form_data.username, form_data.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": str(user.id)},  # JWT sub claim must be a string
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return Token(access_token=access_token, token_type="bearer")


@router.get("/me", response_model=UserRead)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current authenticated user info."""
    return current_user
