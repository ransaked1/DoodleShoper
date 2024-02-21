import os
import logging

from common.error import InternalError

class Config:
    version = "0.1"
    title = "doodleshoper"

    app_settings = {
        'db_name': os.getenv('MONGODB_NAME'),
        'db_url': os.getenv('MONGODB_URL'),
        'db_username': os.getenv('MONGO_USER'),
        'db_password': os.getenv('MONGO_PASSWORD'),
        'jwt_secret': os.getenv('JWT_SECRET_KEY'),
        'jwt_algorithm': os.getenv('JWT_ALGORITHM'),
        'jwt_token_expiration': os.getenv('JWT_ACCESS_TOKEN_EXPIRE_MINUTES'),
        'openai_key': os.getenv('OPENAI_API_KEY'),
        'openai_assistant': os.getenv('OPENAI_ASSISTANT_ID'),
    }

    @classmethod
    def app_settings_validate(cls):
        for k, v in cls.app_settings.items():
            if '' == v:
                logging.error(f'Config variable error. {k} cannot be empty string.')
                raise InternalError([{"message": "Server configuration error"}])
            else:
                logging.info(f'Config variable {k} is {v}')