import asyncio
from dataclasses import dataclass
from typing import Optional
from fastapi import Depends, Header, HTTPException
from firebase_admin import auth
from config.firebase import init_firebase


@dataclass(frozen=True)
class CurrentUser:
    uid : str
    email : Optional[str]


async def get_current_user(authorization : Optional[str] = Header(default=None)) -> CurrentUser:
    # Valida o ID token do Firebase enviado pelo front no header "Authorization: Bearer <token>"
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Usuário não autenticado.")

    init_firebase()
    token = authorization.split(" ", 1)[1]
    try:
        decoded = await asyncio.to_thread(auth.verify_id_token, token)
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado.")
    return CurrentUser(uid=decoded["uid"], email=decoded.get("email"))


async def get_current_uid(user : CurrentUser = Depends(get_current_user)) -> str:
    return user.uid
