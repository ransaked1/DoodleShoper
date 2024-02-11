from fastapi import APIRouter, Depends, Response
import logging
from uuid import UUID

from db.db import get_db, AsyncIOMotorClient
from schemas.user_resource import \
    create_user_resource as db_create_user_resouce,\
    get_user_resource as db_get_user_resource

from common.util import uuid_masker
from common.error import UnprocessableError

from models.create_user_resource import CreateUserResourceReq, CreateUserResourceResp
from models.get_user_resource import GetUserResourceResp

router = APIRouter()

@router.post('/signup', include_in_schema=False, status_code=201)
@router.post('', response_model=CreateUserResourceResp, status_code=201,
             responses={
                 400: {}
             }
             )
async def create_user_resource(
    user_resource_data: CreateUserResourceReq,
    db: AsyncIOMotorClient = Depends(get_db) # type: ignore
):
    logging.info('Received create user resource request')

    user_resource_db = await db_create_user_resouce(
        db,
        user_resource_data.name
    )

    return CreateUserResourceResp(id=user_resource_db.id)


@router.get('/login', include_in_schema=False, status_code=200)
@router.get('', response_model=GetUserResourceResp, status_code=200,
            responses={
                400: {}
            }
            )
async def get_user_resource(
    resource: UUID,
    db: AsyncIOMotorClient = Depends(get_db), # type: ignore
):
    logging.info(
        f'Received get user resource with uid: {uuid_masker(resource)}'
    )

    user_resource = await db_get_user_resource(
        db,
        resource
    )

    if None is user_resource:
        return Response(status_code=204)

    return GetUserResourceResp(name=user_resource.get("name"))