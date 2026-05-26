from fastapi import WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from app.core.database import get_db, SessionLocal
from app.models.models import User, Message
import json
from datetime import datetime


class ConnectionManager:
    def __init__(self):
        self.connections: dict[str, dict] = {}

    async def connect(self, websocket: WebSocket, user_id: int, username: str):
        await websocket.accept()
        key = f"{user_id}_{id(websocket)}"
        self.connections[key] = {
            "ws": websocket,
            "user_id": user_id,
            "username": username,
            "rooms": set(),
        }
        return key

    def disconnect(self, key: str):
        if key in self.connections:
            del self.connections[key]

    def join_room(self, key: str, room_id: int):
        if key in self.connections:
            self.connections[key]["rooms"].add(room_id)

    def leave_room(self, key: str, room_id: int):
        if key in self.connections:
            self.connections[key]["rooms"].discard(room_id)

    def get_room_users(self, room_id: int) -> list[str]:
        users = set()
        for conn in self.connections.values():
            if room_id in conn["rooms"]:
                users.add(conn["username"])
        return list(users)

    async def broadcast_to_room(self, room_id: int, message: dict):
        dead_keys = []
        for key, conn in self.connections.items():
            if room_id in conn["rooms"]:
                try:
                    await conn["ws"].send_json(message)
                except Exception:
                    dead_keys.append(key)
        for key in dead_keys:
            self.disconnect(key)


manager = ConnectionManager()


async def handle_websocket(websocket: WebSocket, token: str = Query(default="")):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.token == token).first()
        if not user:
            await websocket.close(code=4001, reason="Invalid token")
            return

        key = await manager.connect(websocket, user.id, user.username)

        try:
            while True:
                data = await websocket.receive_text()
                msg = json.loads(data)
                msg_type = msg.get("type")
                room_id = msg.get("room_id")

                if msg_type == "join_room":
                    manager.join_room(key, room_id)
                    users = manager.get_room_users(room_id)
                    await manager.broadcast_to_room(
                        room_id,
                        {"type": "user_joined", "username": user.username, "users": users},
                    )

                elif msg_type == "leave_room":
                    manager.leave_room(key, room_id)
                    users = manager.get_room_users(room_id)
                    await manager.broadcast_to_room(
                        room_id,
                        {"type": "user_left", "username": user.username, "users": users},
                    )

                elif msg_type == "chat_message":
                    content = msg.get("content", "").strip()
                    if not content:
                        continue

                    new_message = Message(room_id=room_id, user_id=user.id, content=content)
                    db.add(new_message)
                    db.commit()
                    db.refresh(new_message)

                    created_at = new_message.created_at.strftime("%Y-%m-%d %H:%M:%S") if new_message.created_at else ""

                    await manager.broadcast_to_room(
                        room_id,
                        {
                            "type": "new_message",
                            "id": new_message.id,
                            "room_id": room_id,
                            "user_id": user.id,
                            "username": user.username,
                            "content": content,
                            "created_at": created_at,
                        },
                    )

        except WebSocketDisconnect:
            pass
        except Exception:
            pass
        finally:
            rooms = list(manager.connections.get(key, {}).get("rooms", set()))
            manager.disconnect(key)
            for rid in rooms:
                users = manager.get_room_users(rid)
                await manager.broadcast_to_room(
                    rid,
                    {"type": "user_left", "username": user.username, "users": users},
                )
    finally:
        db.close()