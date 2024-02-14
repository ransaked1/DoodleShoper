from pydantic import BaseModel, constr
from datetime import datetime
from uuid import UUID

from .model import MongoModel
from passlib.context import CryptContext

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserResourceBase(BaseModel):
    username: constr(max_length=255) # type: ignore
    password: constr(min_length=8, max_length=255) # type: ignore

    def hash_password(self):
        self.password = pwd_context.hash(self.password)

class UserResourceDB(UserResourceBase, MongoModel):
    id: UUID
    create_time: datetime
    deleted: bool

    def __init__(self, **data):
        super().__init__(**data)
        self.hash_password()