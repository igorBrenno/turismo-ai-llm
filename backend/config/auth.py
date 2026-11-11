from typing import Any, Dict, Optional

from fastapi import Header, HTTPException
from firebase_admin import auth as firebase_auth

from config.firebase import init_firebase


def get_current_user(authorization: Optional[str] = Header(default=None)) -> Dict[str, Any]:
    scheme, _, token = (authorization or "").partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Autenticação necessária.")

    init_firebase()
    try:
        return firebase_auth.verify_id_token(token)
    except (ValueError, firebase_auth.InvalidIdTokenError):
        raise HTTPException(status_code=401, detail="Sessão inválida ou expirada.")
    except firebase_auth.CertificateFetchError:
        raise HTTPException(status_code=503, detail="Não foi possível validar a sessão agora.")
