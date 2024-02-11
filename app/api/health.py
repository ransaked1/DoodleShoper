from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from db.db import get_db

import logging
import platform
import psutil

router = APIRouter()

@router.get('/', include_in_schema=False)
@router.get('')
async def health(db: AsyncIOMotorClient = Depends(get_db)): # type: ignore
    try:
        # Ping database
        await db.command('ping')
        db_status = 'up'
        logging.info('Health check successful')
    except Exception as ex:
        db_status = 'down'
        logging.error(ex)

    # Get system information
    system_info = {
        "system": platform.system(),
        "architecture": platform.architecture(),
        "memory": psutil.virtual_memory()._asdict(),
        "disk": psutil.disk_usage('/')._asdict()
    }

    return {
        "database": db_status,
        "system_info": system_info
    }