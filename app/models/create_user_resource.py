from uuid import UUID

from .user_resource_common import UserResourceBase
from .model import MongoModel

class CreateUserResourceReq(UserResourceBase):
    pass

class CreateUserResourceResp(MongoModel):
    id: UUID