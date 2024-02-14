from fastapi import APIRouter, Depends, HTTPException, status
from passlib.context import CryptContext
from datetime import datetime, timedelta
import logging
from conf.config import Config
from uuid import UUID

import jwt

from db.db import get_db, AsyncIOMotorClient
from schemas.user_resource import (
    create_user_resource as db_create_user_resouce,
    get_user_resource as db_get_user_resource
)
from common.util import uuid_masker
from common.error import UnprocessableError

from models.create_user_resource import CreateUserResourceReq, CreateUserResourceResp
from models.get_user_resource import GetUserResourceResp

router = APIRouter()

@router.post('/signup', include_in_schema=False, status_code=status.HTTP_201_CREATED)
@router.post('', response_model=CreateUserResourceResp, status_code=status.HTTP_201_CREATED)
async def signup(
    user_resource_data: CreateUserResourceReq,
    db: AsyncIOMotorClient = Depends(get_db) # type: ignore
):
    logging.info('Received create user resource request')

    hashed_password = Config.app_settings.get('pwd_context').hash(user_resource_data.password)
    user_resource_db = await db_create_user_resouce(
        db,
        user_resource_data.username,
        hashed_password
    )

    return CreateUserResourceResp(id=user_resource_db.id)


@router.get('/login', include_in_schema=False, status_code=status.HTTP_200_OK)
@router.get('', response_model=GetUserResourceResp, status_code=status.HTTP_200_OK)
async def login(
    username: str,
    password: str,
    db: AsyncIOMotorClient = Depends(get_db), # type: ignore
):
    logging.info(f'Received login request for: {username}')

    user_resource = await db_get_user_resource(db, username, password)
    
    if user_resource is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    if not Config.app_settings.get('pwd_context').verify(password, user_resource.get("password")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    # Generate JWT token
    token_data = {
        "sub": str(user_resource.id),
        "exp": datetime.utcnow() + timedelta(minutes=Config.app_settings.get('jwt_token_expiration'))
    }
    token = jwt.encode(token_data, Config.app_settings.get('jwt_secret'), algorithm=Config.app_settings.get('jwt_algorithm'))
    
    return GetUserResourceResp(username=user_resource.get("username"), access_token=token, token_type='bearer')