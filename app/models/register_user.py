from uuid import UUID

from .user_resource_common import UserResourceBase
from .model import MongoModel

class RegisterUserResourceReq(UserResourceBase):
    username: str
    password: str

class RegisterUserResourceResp(MongoModel):
    id: UUID