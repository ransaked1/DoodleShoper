"""
Main module.

This module provides the entry point of the application, instantiates FastAPI app and routes
"""

from fastapi import FastAPI
from openai import OpenAI
import os

app = FastAPI()

@app.get("/")
async def root():
    return {
        "api_version": "v0.1",
        "status": "live",
        "api_documentation": ""
    }