from uuid import uuid4, UUID
from datetime import datetime
import logging
from pymongo import ReturnDocument
from fastapi import HTTPException, status

from conf.config import Config
from db.db import AsyncIOMotorClient
from models.user_resource_common import UserResourceDB

__db_name = Config.app_settings.get('db_name')
__db_collection = 'user_resource'

async def create_user_resource(
    conn: AsyncIOMotorClient, # type: ignore
    username: str,
    password: str
) -> UserResourceDB:
    user_resource = await conn[__db_name][__db_collection].find_one(
        {"$and": [
            {'username': username},
            {'deleted': False},
        ]},
    )

    # Raise conflict if user alredy has registered
    if user_resource!=None:
        logging.info(f"Resource {username} is None")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already registered"
        )

    new_user_resource = UserResourceDB(
        id=uuid4(),
        username=username,
        hashed_password=password,
        create_time=datetime.utcnow(),
        update_time=datetime.utcnow(),
        deleted=False,
    )
    logging.info(f'Inserting user resource {username} into db...')
    await conn[__db_name][__db_collection].insert_one(
        new_user_resource.mongo()
    )
    logging.info(
        f"User resource {username} inserted into db"
    )
    return new_user_resource

async def get_user_resource(
    conn: AsyncIOMotorClient, # type: ignore
    username: str
) -> UserResourceDB | None:
    logging.info(f"Getting user resource {username}...")
    user_resource = await conn[__db_name][__db_collection].find_one(
        {"$and": [
            {'username': username},
            {'deleted': False},
        ]},
    )

    # If user is not found, raise exception
    if user_resource==None:
        logging.info(f"Resource {username} is None")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    return user_resource