from uuid import UUID

from .user_resource_common import UserResourceBase
from .model import MongoModel

class CreateUserResourceReq(UserResourceBase):
    username: str
    password: str

class CreateUserResourceResp(MongoModel):
    id: UUID