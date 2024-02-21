import re
from uuid import UUID

from schemas.user_resource import get_user_resource as db_get_user_resource
from db.db import get_db, AsyncIOMotorClient

from fastapi import  Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from typing import Annotated
import logging
from conf.config import Config
from jose import jwt, JWTError

from db.db import get_db, AsyncIOMotorClient
from schemas.user_resource import get_user_resource as db_get_user_resource
from models.login_user import TokenData

import aioredis

redis_pool = None

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")

async def get_redis_pool():
    global redis_pool
    if not redis_pool:
        redis_pool = await aioredis.from_url(Config.app_settings.get('redis_url'), encoding="utf-8", decode_responses=True)
    return redis_pool


def uuid_masker(exposed_uuid: str | UUID) -> str:
    uuid_str = str(exposed_uuid)
    return re.sub(
        r"[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-",
        '********-****-****-****-',
        uuid_str
    )

async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: AsyncIOMotorClient = Depends(get_db), # type: ignore
    redis: aioredis.Redis = Depends(get_redis_pool)
):
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Decode JWT token
    try:
        payload = jwt.decode(token, Config.app_settings.get('jwt_secret'), algorithms=Config.app_settings.get('jwt_algorithm'))
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    # Check user is present in the database
    user = await db_get_user_resource(db, token_data.username)
    if user is None:
        raise credentials_exception
    
    # Check if the token is blacklisted in Redis
    if await redis.get(f'bl_{token}'):
        raise credentials_exception

    return user