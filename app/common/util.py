import re
from uuid import UUID

from schemas.user_resource import get_user_resource as db_get_user_resource
from db.db import get_db, AsyncIOMotorClient
from fastapi import  Depends


def uuid_masker(exposed_uuid: str | UUID) -> str:
    uuid_str = str(exposed_uuid)
    return re.sub(
        r"[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-",
        '********-****-****-****-',
        uuid_str
    )