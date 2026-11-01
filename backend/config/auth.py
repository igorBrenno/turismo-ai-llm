import asyncio
from typing import Optional
from fastapi import Header, HTTPException
from firebase_admin import auth
from config.firebase import init_firebase


async def get_current_uid(authorization : Optional[str] = Header(default=None)) -> str:
    # Valida o ID token do Firebase enviado pelo front no header "Authorization: Bearer <token>"
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Usuário não autenticado.")

    init_firebase()
    token = authorization.split(" ", 1)[1]
    try:
        decoded = await asyncio.to_thread(auth.verify_id_token, token)
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado.")
    return decoded["uid"]
