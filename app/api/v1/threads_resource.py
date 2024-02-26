from fastapi import APIRouter, Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import Annotated
import logging
from conf.config import Config

from db.db import get_db, AsyncIOMotorClient
from schemas.user_resource import (
    add_thread_user_resource as db_add_thread_user_resource,
    remove_thread_user_resource as db_remove_thread_user_resource,
    get_user_resource as db_get_user_resource,
)

from models.threads import CreateThreadResourceResp

from common.util import get_current_user
from openai import OpenAI

router = APIRouter()

client = OpenAI(api_key=Config.app_settings.get('openai_key'))

@router.post('/text/new', status_code=status.HTTP_200_OK)
async def text_thread_new(
    current_user: Annotated[str, Depends(get_current_user)],
    db: AsyncIOMotorClient = Depends(get_db), # type: ignore
):
    logging.info(f'Creating new thread for: %s', Config.app_settings.get('openai_assistant'))

    new_thread = client.beta.threads.create()

    await db_add_thread_user_resource(db, current_user.get("username"), new_thread.id)
    
    return CreateThreadResourceResp(id=new_thread.id)


@router.get('/text/list', status_code=status.HTTP_200_OK)
async def text_thread_list(
    current_user: Annotated[str, Depends(get_current_user)],
    db: AsyncIOMotorClient = Depends(get_db), # type: ignore
):
    logging.info(f'Listing threads for: %s', Config.app_settings.get('openai_assistant'))

    user_resource = await db_get_user_resource(db, current_user.get("username"))
    
    return user_resource.get("threads")

@router.delete('/text/delete', status_code=status.HTTP_204_NO_CONTENT)
async def text_thread_delete(
    thread_id: str,
    current_user: Annotated[str, Depends(get_current_user)],
    db: AsyncIOMotorClient = Depends(get_db), # type: ignore
):
    logging.info(f'Removing thread {thread_id}')

    await db_remove_thread_user_resource(db, current_user.get("username"), thread_id)
    
    return None