from fastapi import APIRouter, Depends, status
from typing import Annotated
import logging
from conf.config import Config

from db.db import get_db, AsyncIOMotorClient
from schemas.user_resource import (
    add_thread_user_resource as db_add_thread_user_resource,
    remove_thread_user_resource as db_remove_thread_user_resource,
    get_user_resource as db_get_user_resource,
)

from models.threads import (
    CreateThreadResourceResp, 
    ListThreadResourceResp, 
    SendMessageResourceReq,
    ListMessageResourceResp,
    SendMessageResourceResp,
    RunThreadResp,
    RunThreadStatusResp,
    SubmitToolsReqText
)

from services.google_search import fetch_search_results_text

from common.util import get_current_user
from common.constants import *

from openai import OpenAI

router = APIRouter()

client = OpenAI(api_key=Config.app_settings.get('openai_key'), default_headers={"OpenAI-Beta": "assistants=v2"})

@router.post('/text', status_code=status.HTTP_200_OK)
async def text_thread_new(
    current_user: Annotated[str, Depends(get_current_user)],
    db: AsyncIOMotorClient = Depends(get_db), # type: ignore
):
    logging.info(f'Creating new thread for: %s', Config.app_settings.get('openai_assistant'))

    new_thread = client.beta.threads.create()

    await db_add_thread_user_resource(db, current_user.get("username"), new_thread.id, TEXT_CONVERSATION)
    
    return CreateThreadResourceResp(id=new_thread.id)


@router.get('/text', status_code=status.HTTP_200_OK)
async def text_thread_list(
    current_user: Annotated[str, Depends(get_current_user)],
    db: AsyncIOMotorClient = Depends(get_db), # type: ignore
):
    logging.info(f'Listing threads for: %s', Config.app_settings.get('openai_assistant'))

    user_resource = await db_get_user_resource(db, current_user.get("username"))
    
    return ListThreadResourceResp(threads=user_resource.get("text_threads"))

@router.delete('/text', status_code=status.HTTP_204_NO_CONTENT)
async def text_thread_delete(
    thread_id: str,
    current_user: Annotated[str, Depends(get_current_user)],
    db: AsyncIOMotorClient = Depends(get_db), # type: ignore
):
    logging.info(f'Removing thread {thread_id}')

    await db_remove_thread_user_resource(db, current_user.get("username"), thread_id, TEXT_CONVERSATION)
    
    return None

@router.get('/text/{thread_id}/messages', status_code=status.HTTP_200_OK)
async def text_messages_list(
    thread_id,
    current_user: Annotated[str, Depends(get_current_user)],
):
    logging.info(f'Listing messages for thread {thread_id}')

    thread_messages = client.beta.threads.messages.list(thread_id, limit=50)
    
    return {'messages': thread_messages.data} # Replaced model with hardcoded response because new API version breaks the model code

    return ListMessageResourceResp(messages=thread_messages.data)

@router.post('/text/{thread_id}/messages', status_code=status.HTTP_200_OK)
async def text_messages_send(
    thread_id,
    content_data: SendMessageResourceReq,
    current_user: Annotated[str, Depends(get_current_user)],
):
    logging.info(f'Message to thread {thread_id}')

    thread_message = client.beta.threads.messages.create(
        thread_id,
        role="user",
        content=content_data.content,
    )

    return SendMessageResourceResp(id=thread_message.id)

@router.post('/text/{thread_id}/messages/assistant', status_code=status.HTTP_200_OK)
async def text_messages_send(
    thread_id,
    content_data: SendMessageResourceReq,
    current_user: Annotated[str, Depends(get_current_user)],
):
    logging.info(f'Into message to thread {thread_id}')

    thread_message = client.beta.threads.messages.create(
        thread_id,
        role="assistant",
        content=content_data.content,
    )

    return SendMessageResourceResp(id=thread_message.id)

@router.post('/text/{thread_id}/runs', status_code=status.HTTP_200_OK)
async def text_thread_run(
    thread_id,
    current_user: Annotated[str, Depends(get_current_user)],
):
    logging.info(f'Run thread {thread_id} for assistant {Config.app_settings.get("openai_assistant")}')

    run = client.beta.threads.runs.create(
        thread_id=thread_id,
        assistant_id=Config.app_settings.get("openai_assistant")
    )

    return RunThreadResp(id=run.id)

@router.get('/text/{thread_id}/runs/{run_id}', status_code=status.HTTP_200_OK)
async def text_thread_check(
    thread_id,
    run_id,
    current_user: Annotated[str, Depends(get_current_user)],
):
    logging.info(f'Run thread {thread_id} for assistant {Config.app_settings.get("openai_assistant")}')

    run = client.beta.threads.runs.retrieve(
        thread_id=thread_id,
        run_id=run_id
    )

    return {'status': run.status, 'action': run.required_action} # Replaced model with hardcoded response because new API version breaks the model code

    return RunThreadStatusResp(status=run.status, action=run.required_action)

@router.post('/text/{thread_id}/runs/{run_id}/submit_tool_outputs', status_code=status.HTTP_204_NO_CONTENT)
async def text_thread_submit_tool(
    thread_id,
    run_id,
    req_data: SubmitToolsReqText,
    current_user: Annotated[str, Depends(get_current_user)],
):
    logging.info(f'Submit tool outputs for call {req_data.tool_call_id}')

    run = client.beta.threads.runs.submit_tool_outputs(
        thread_id=thread_id,
        run_id=run_id,
        tool_outputs=[{
            "tool_call_id": req_data.tool_call_id,
            "output": fetch_search_results_text(req_data.prompt)
        }]
    )