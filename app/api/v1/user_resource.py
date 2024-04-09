import aioredis
import logging

from fastapi import APIRouter, Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordRequestForm
from typing import Annotated
from passlib.context import CryptContext
from datetime import datetime, timedelta
from conf.config import Config
from jose import jwt

from db.db import get_db, AsyncIOMotorClient
from schemas.user_resource import (
    create_user_resource as db_create_user_resouce,
    get_user_resource as db_get_user_resource,
)

from models.register_user import RegisterUserResourceReq, RegisterUserResourceResp
from models.login_user import LoginUserResourceResp

from common.util import get_current_user, get_redis_pool
from common.constants import *

router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post('/signup', response_model=RegisterUserResourceResp, status_code=status.HTTP_201_CREATED)
async def signup(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: AsyncIOMotorClient = Depends(get_db) # type: ignore
):
    logging.info('Received create user resource request')

    # Hash password and add user to database
    hashed_password = pwd_context.hash(form_data.password)
    user_resource = await db_create_user_resouce(
        db,
        form_data.username,
        hashed_password
    )

    return RegisterUserResourceResp(id=user_resource.id)


@router.post('/token', response_model=LoginUserResourceResp, status_code=status.HTTP_200_OK)
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: AsyncIOMotorClient = Depends(get_db), # type: ignore
):
    logging.info(f'Received login request for: {form_data.username}')

    # Search for user in database
    user_resource = await db_get_user_resource(db, form_data.username)

    # Check user exists in database
    if user_resource is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=INVALID_USER_PASS_MESSAGE
        )

    # Check passwords match
    if not pwd_context.verify(form_data.password, user_resource.get("hashed_password")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=INVALID_USER_PASS_MESSAGE
        )
    
    # Generate JWT token
    token_data = {
        "sub": form_data.username,
        "exp": datetime.utcnow() + timedelta(minutes=int(Config.app_settings.get('jwt_token_expiration')))
    }
    token = jwt.encode(token_data, Config.app_settings.get('jwt_secret'), algorithm=Config.app_settings.get('jwt_algorithm'))
    
    return LoginUserResourceResp(access_token=token, token_type='bearer')


@router.post('/logout', status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    authorization: str = Header(...),
    redis: aioredis.Redis = Depends(get_redis_pool)
):  
    logging.info(f'Logging out user')

    token = None
    # Extract the token from the Authorization header
    try:
        token_type, token = authorization.split()
        if token_type.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type. Must use Bearer token.",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    #logging.info("Logged out: %s", token)
    await redis.set(f'bl_{token}', token)

    logging.info(f'User logged out')
    return None


@router.get('/me', status_code=status.HTTP_200_OK)
async def read_users_me(
    current_user: Annotated[str, Depends(get_current_user)],
):
    logging.info(f'Getting data for me')
    
    return current_user