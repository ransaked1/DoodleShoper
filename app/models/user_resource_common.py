from pydantic import BaseModel, constr
from datetime import datetime
from uuid import UUID

from .model import MongoModel

class UserResourceBase(BaseModel):
    username: constr(max_length=255) # type: ignore
    password: constr(min_length=8, max_length=255) # type: ignore

class UserResourceDB(UserResourceBase, MongoModel):
    id: UUID
    token: list
    create_time: datetime
    deleted: bool