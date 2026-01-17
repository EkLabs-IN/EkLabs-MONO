"""
Routers Package

Contains all API route handlers organized by domain:
- auth: Authentication and authorization endpoints
- chat: Chat interface endpoints (to be implemented)
- ingestion: Data ingestion endpoints (to be implemented)
"""

from . import auth

__all__ = ["auth"]
