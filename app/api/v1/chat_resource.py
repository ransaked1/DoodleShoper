from fastapi import APIRouter, Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import Annotated
from passlib.context import CryptContext
import logging
from conf.config import Config

from db.db import get_db, AsyncIOMotorClient
from schemas.user_resource import (
    create_user_resource as db_create_user_resouce,
    get_user_resource as db_get_user_resource,
)

from models.register_user import RegisterUserResourceReq, RegisterUserResourceResp
from models.login_user import LoginUserResourceResp

from common.util import validate_credentials
from openai import OpenAI

router = APIRouter()

client = OpenAI(api_key=Config.app_settings.get('openai_key'))

@router.get('/text/list', status_code=status.HTTP_200_OK)
async def text_list_threads(
    current_user: Annotated[str, Depends(validate_credentials)],
):
    logging.info(f'Listing threads for: %s', Config.app_settings.get('openai_assistant'))

    logging.info(client.api_key)

    my_assistant =  client.beta.assistants.retrieve("asst_XJHh0Rq7rOk01ls8MXBDvLMQ")

    logging.info(my_assistant.name)
    
    return None