from uuid import UUID

from pydantic import BaseModel, constr
from .model import MongoModel

class CreateThreadResourceResp(MongoModel):
    id: str

class ListThreadResourceResp(MongoModel):
    threads: list