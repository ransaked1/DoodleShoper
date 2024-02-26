from uuid import UUID

from pydantic import BaseModel, constr
from .model import MongoModel

class CreateThreadResourceResp(MongoModel):
    id: str

class ListThreadResourceResp(MongoModel):
    threads: list

class ListMessageResourceResp(MongoModel):
    messages: list

class SendMessageResourceReq(BaseModel):
    content: str

class SendMessageResourceResp(MongoModel):
    id: str

class RunThreadResp(MongoModel):
    id: str

class RunThreadStatusResp(MongoModel):
    status: str