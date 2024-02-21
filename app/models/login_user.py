from .model import MongoModel
from pydantic import BaseModel

class LoginUserResourceResp(MongoModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None