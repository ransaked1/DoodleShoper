from .model import MongoModel

class LoginUserResourceResp(MongoModel):
    username: str
    access_token: str
    token_type: str