from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import Annotated
from passlib.context import CryptContext
from datetime import datetime, timedelta
import logging
from conf.config import Config
from jose import jwt, JWTError

from db.db import get_db, AsyncIOMotorClient
from schemas.user_resource import (
    create_user_resource as db_create_user_resouce,
    get_user_resource as db_get_user_resource,
)

from models.register_user import RegisterUserResourceReq, RegisterUserResourceResp
from models.login_user import LoginUserResourceResp, TokenData

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post('/signup', response_model=RegisterUserResourceResp, status_code=status.HTTP_201_CREATED)
async def signup(
    user_resource_data: RegisterUserResourceReq,
    db: AsyncIOMotorClient = Depends(get_db) # type: ignore
):
    logging.info('Received create user resource request')
    logging.info(f'Password: {user_resource_data.password}')

    hashed_password = pwd_context.hash(user_resource_data.password)
    user_resource = await db_create_user_resouce(
        db,
        user_resource_data.username,
        hashed_password
    )

    return RegisterUserResourceResp(id=user_resource.id)


@router.post('/token', response_model=LoginUserResourceResp, status_code=status.HTTP_200_OK)
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: AsyncIOMotorClient = Depends(get_db), # type: ignore
):
    logging.info(f'Received login request for: {form_data.username}')

    user_resource = await db_get_user_resource(db, form_data.username)
    if user_resource is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    logging.info(f'{form_data.password} vs {user_resource.get("hashed_password")}')

    if not pwd_context.verify(form_data.password, user_resource.get("hashed_password")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    # Generate JWT token
    token_data = {
        "sub": form_data.username,
        "exp": datetime.utcnow() + timedelta(minutes=int(Config.app_settings.get('jwt_token_expiration')))
    }
    token = jwt.encode(token_data, Config.app_settings.get('jwt_secret'), algorithm=Config.app_settings.get('jwt_algorithm'))
    
    return LoginUserResourceResp(access_token=token, token_type='bearer')

# @router.post('/logout', status_code=status.HTTP_204_NO_CONTENT)
# @router.post('', status_code=status.HTTP_204_NO_CONTENT)
# async def logout(
#     username: str,
#     token: str,
#     db: AsyncIOMotorClient = Depends(get_db), # type: ignore
# ):
#     logging.info(f'Received logout request for: {username}')

#     await db_remove_token(db, username, token)
    
#     return None

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], db: AsyncIOMotorClient = Depends(get_db)): # type: ignore
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, Config.app_settings.get('jwt_secret'), algorithms=Config.app_settings.get('jwt_algorithm'))
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    user = await db_get_user_resource(db, token_data.username)
    if user is None:
        raise credentials_exception
    return user

@router.get('/me', status_code=status.HTTP_200_OK)
async def read_users_me(
    current_user: Annotated[str, Depends(get_current_user)],
):
    logging.info(f'Getting data for me')
    
    return current_user