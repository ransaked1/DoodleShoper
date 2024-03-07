"""
Main module.

This module provides the entry point of the application, instantiates FastAPI app and routes
"""

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.openapi.utils import get_openapi

from common.error import BadRequest, UnprocessableError
from db.db import connect_and_init_db, close_db_connect
from conf.logging import setup_logging
from conf.config import Config

from api import health
from api.v1 import user_resource as user_resource_v1
from api.v1 import text_threads as text_threads_resource_v1
from api.v1 import mixed_threads as mixed_threads_resource_v1
from api.v1 import sketch_threads as sketch_threads_resource_v1

import logging

# Logging
setup_logging()

app = FastAPI()

app.add_event_handler("startup", Config.app_settings_validate)
app.add_event_handler("startup", connect_and_init_db)
app.add_event_handler("shutdown", close_db_connect)

# openapi schema
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title=Config.title,
        version=Config.version,
        routes=app.routes
    )

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi

# HTTP error responses
@app.exception_handler(BadRequest)
async def bad_request_handler(req: Request, exc: BadRequest) -> JSONResponse:
    return exc.gen_err_resp()


@app.exception_handler(RequestValidationError)
async def invalid_req_handler(
    req: Request,
    exc: RequestValidationError
) -> JSONResponse:
    logging.error(f'Invalid request. {str(exc)}')
    return JSONResponse(
        status_code=400,
        content={
            "type": "about:blank",
            'title': 'Bad Request',
            'status': 400,
            'detail': [str(exc)]
        }
    )


@app.exception_handler(UnprocessableError)
async def unprocessable_error_handler(
    req: Request,
    exc: UnprocessableError
) -> JSONResponse:
    return exc.gen_err_resp()

# API root info
@app.get("/", include_in_schema=False)
async def root():
    return {
        "api_version": Config.version,
        "status": "live",
        "api_documentation_path": "/docs",
    }

# API Path
app.include_router(
    health.router,
    prefix='/health',
    tags=["health"]
)

app.include_router(
    user_resource_v1.router,
    prefix='/api/v1/users',
    tags=["user resource v1"]
)

app.include_router(
    text_threads_resource_v1.router,
    prefix='/api/v1/threads',
    tags=["threads resource v1"]
)

app.include_router(
    mixed_threads_resource_v1.router,
    prefix='/api/v1/threads',
    tags=["threads resource v1"]
)

app.include_router(
    sketch_threads_resource_v1.router,
    prefix='/api/v1/threads',
    tags=["threads resource v1"]
)