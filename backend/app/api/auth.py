from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User
from pydantic import BaseModel
from datetime import datetime
import secrets

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str


class UserResponse(BaseModel):
    id: int
    username: str
    token: str
    created_at: str


def get_current_user(request: Request, db: Session = Depends(get_db)) -> dict:
    authorization = request.headers.get("Authorization", "")
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    token = authorization.replace("Bearer ", "")
    user = db.query(User).filter(User.token == token).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return {
        "id": user.id,
        "username": user.username,
        "token": user.token,
        "created_at": user.created_at.strftime("%Y-%m-%d %H:%M:%S") if user.created_at else ""
    }


@router.post("/login")
async def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()
    if user:
        return {"user": UserResponse(
            id=user.id,
            username=user.username,
            token=user.token,
            created_at=user.created_at.strftime("%Y-%m-%d %H:%M:%S") if user.created_at else "",
        )}

    token = secrets.token_hex(32)
    new_user = User(username=req.username, token=token)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"user": UserResponse(
        id=new_user.id,
        username=new_user.username,
        token=new_user.token,
        created_at=new_user.created_at.strftime("%Y-%m-%d %H:%M:%S") if new_user.created_at else "",
    )}


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return {"user": UserResponse(
        id=user["id"],
        username=user["username"],
        token=user["token"],
        created_at=user["created_at"],
    )}