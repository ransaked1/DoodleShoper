import os
import logging

from common.error import InternalError


class Config:
    version = "0.1"
    title = "doodleshoper"

    app_settings = {
        'db_name': os.getenv('MONGODB_NAME'),
        'db_url': os.getenv('MONGODB_URL'),
    }

    @classmethod
    def app_settings_validate(cls):
        for k, v in cls.app_settings.items():
            if '' == v:
                logging.error(f'Config variable error. {k} cannot be empty string.')
                raise InternalError([{"message": "Server configuration error"}])
            else:
                logging.info(f'Config variable {k} is {v}')