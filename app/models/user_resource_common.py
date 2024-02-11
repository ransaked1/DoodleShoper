from pydantic import BaseModel, constr
from datetime import datetime
from uuid import UUID

from .model import MongoModel


def to_lower_camel_case(string: str) -> str:
    split_str = string.split('_')
    return split_str[0] + ''.join(word.capitalize() for word in split_str[1:])


class UserResourceBase(BaseModel):
    name: constr(max_length=255) # type: ignore


class UserResourceDB(UserResourceBase, MongoModel):
    id: UUID
    create_time: datetime
    deleted: bool