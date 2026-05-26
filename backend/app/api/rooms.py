from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Room, Message, User, RoomMember
from app.api.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/api/rooms", tags=["rooms"])


class RoomResponse(BaseModel):
    id: int
    name: str
    created_by: int
    created_at: str


class MessageResponse(BaseModel):
    id: int
    room_id: int
    user_id: int
    username: str
    content: str
    created_at: str


@router.get("")
async def list_rooms(user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    rooms = db.query(Room).join(RoomMember).filter(RoomMember.user_id == user["id"]).all()
    return {"rooms": [RoomResponse(
        id=r.id,
        name=r.name,
        created_by=r.created_by or 0,
        created_at=r.created_at.strftime("%Y-%m-%d %H:%M:%S") if r.created_at else ""
    ) for r in rooms]}


class CreateRoomRequest(BaseModel):
    name: str


@router.post("")
async def create_room(req: CreateRoomRequest, user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    new_room = Room(name=req.name, created_by=user["id"])
    db.add(new_room)
    db.commit()
    db.refresh(new_room)
    
    # 自动加入房间
    member = RoomMember(room_id=new_room.id, user_id=user["id"])
    db.add(member)
    db.commit()
    
    return {"room": RoomResponse(
        id=new_room.id,
        name=new_room.name,
        created_by=new_room.created_by or 0,
        created_at=new_room.created_at.strftime("%Y-%m-%d %H:%M:%S") if new_room.created_at else ""
    )}


class JoinRoomRequest(BaseModel):
    room_id: int


@router.post("/join")
async def join_room(req: JoinRoomRequest, user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    room = db.query(Room).filter(Room.id == req.room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    existing = db.query(RoomMember).filter(
        RoomMember.room_id == req.room_id,
        RoomMember.user_id == user["id"]
    ).first()
    
    if not existing:
        member = RoomMember(room_id=req.room_id, user_id=user["id"])
        db.add(member)
        db.commit()

    return {"room": RoomResponse(
        id=room.id,
        name=room.name,
        created_by=room.created_by or 0,
        created_at=room.created_at.strftime("%Y-%m-%d %H:%M:%S") if room.created_at else ""
    )}


@router.get("/{room_id}/messages")
async def get_messages(room_id: int, user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    messages = db.query(Message, User.username).join(User).filter(
        Message.room_id == room_id
    ).order_by(Message.created_at.asc()).limit(100).all()
    
    return {"messages": [
        MessageResponse(
            id=msg.id,
            room_id=msg.room_id,
            user_id=msg.user_id,
            username=username,
            content=msg.content,
            created_at=msg.created_at.strftime("%Y-%m-%d %H:%M:%S") if msg.created_at else ""
        )
        for msg, username in messages
    ]}