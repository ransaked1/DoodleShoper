from uuid import UUID

from pydantic import BaseModel, constr
from .model import MongoModel

class RegisterUserResourceReq(BaseModel):
    username: str
    password: constr(min_length=8, max_length=255) # type: ignore

class RegisterUserResourceResp(MongoModel):
    id: UUID