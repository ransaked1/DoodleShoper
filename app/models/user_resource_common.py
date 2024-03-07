from pydantic import BaseModel, constr
from datetime import datetime
from uuid import UUID

from .model import MongoModel

class UserResourceBase(BaseModel):
    username: constr(max_length=255) # type: ignore
    hashed_password: str # type: ignore

class UserResourceDB(UserResourceBase, MongoModel):
    id: UUID
    text_threads: list
    mixed_threads: list
    sketch_threads: list
    create_time: datetime
    deleted: bool