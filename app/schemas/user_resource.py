from uuid import uuid4, UUID
from datetime import datetime
import logging
from pymongo import ReturnDocument

from conf.config import Config
from db.db import AsyncIOMotorClient
from models.user_resource_common import UserResourceDB
from common.util import uuid_masker

__db_name = Config.app_settings.get('db_name')
__db_collection = 'user_resource'

async def create_user_resource(
    conn: AsyncIOMotorClient, # type: ignore
    name: str
) -> UserResourceDB:
    new_user_resource = UserResourceDB(
        id=uuid4(),
        name=name,
        create_time=datetime.utcnow(),
        update_time=datetime.utcnow(),
        deleted=False,
    )
    logging.info(f'Inserting user resource {name} into db...')
    await conn[__db_name][__db_collection].insert_one(
        new_user_resource.mongo()
    )
    logging.info(
        f"User resource {name} inserted into db"
    )
    return new_user_resource

async def get_user_resource(
    conn: AsyncIOMotorClient, # type: ignore
    resource_id: UUID
) -> UserResourceDB | None:
    logging.info(f"Getting user resource {uuid_masker(resource_id)}...")
    user_resource = await conn[__db_name][__db_collection].find_one(
        {"$and": [
            {'_id': resource_id},
            {'deleted': False},
        ]},
    )
    if None is user_resource:
        logging.info(f"Resource {uuid_masker(resource_id)} is None")
    return user_resource