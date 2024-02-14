from uuid import UUID

from .model import MongoModel

class GetUserResourceResp(MongoModel):
    username: str
    access_token: str
    token_type: str