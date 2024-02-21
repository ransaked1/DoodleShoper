from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from typing import Annotated
from passlib.hash import bcrypt
from datetime import datetime, timedelta
import logging
from conf.config import Config
from uuid import UUID

import jwt

from db.db import get_db, AsyncIOMotorClient
from schemas.user_resource import (
    create_user_resource as db_create_user_resouce,
    get_user_resource as db_get_user_resource,
    update_token as db_update_token,
    remove_token as db_remove_token,
    check_token as db_check_token
)
from common.util import uuid_masker
from common.error import UnprocessableError

from models.register_user import RegisterUserResourceReq, RegisterUserResourceResp
from models.login_user import LoginUserResourceResp

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

@router.post('/signup', include_in_schema=False, status_code=status.HTTP_201_CREATED)
@router.post('', response_model=RegisterUserResourceResp, status_code=status.HTTP_201_CREATED)
async def signup(
    user_resource_data: RegisterUserResourceReq,
    db: AsyncIOMotorClient = Depends(get_db) # type: ignore
):
    logging.info('Received create user resource request')
    logging.info(f'Password: {user_resource_data.password}')

    hashed_password = bcrypt.hash(user_resource_data.password)
    user_resource = await db_create_user_resouce(
        db,
        user_resource_data.username,
        hashed_password
    )

    return RegisterUserResourceResp(id=user_resource.id)


@router.post('/login', include_in_schema=False, status_code=status.HTTP_200_OK)
@router.post('', response_model=LoginUserResourceResp, status_code=status.HTTP_200_OK)
async def login(
    username: str,
    password: str,
    db: AsyncIOMotorClient = Depends(get_db), # type: ignore
):
    logging.info(f'Received login request for: {username}')

    user_resource = await db_get_user_resource(db, username)
    if user_resource is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    if not bcrypt.verify(password, user_resource.get("password")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    # Generate JWT token
    token_data = {
        "sub": username,
        "exp": datetime.utcnow() + timedelta(minutes=int(Config.app_settings.get('jwt_token_expiration')))
    }
    token = jwt.encode(token_data, Config.app_settings.get('jwt_secret'), algorithm=Config.app_settings.get('jwt_algorithm'))

    user_resource = await db_update_token(db, username, token)
    
    return LoginUserResourceResp(username=username, access_token=token, token_type='bearer')

@router.post('/logout', include_in_schema=False, status_code=status.HTTP_204_NO_CONTENT)
@router.post('', status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    username: str,
    token: str,
    db: AsyncIOMotorClient = Depends(get_db), # type: ignore
):
    logging.info(f'Received logout request for: {username}')

    await db_remove_token(db, username, token)
    
    return None

# validation = await db_check_token(db, username, token)