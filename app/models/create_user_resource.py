from uuid import UUID

from .user_resource_common import UserResourceBase, to_lower_camel_case
from .model import MongoModel


class CreateUserResourceReq(UserResourceBase):
    class Config:
        alias_generator = to_lower_camel_case


class CreateUserResourceResp(MongoModel):
    id: UUID