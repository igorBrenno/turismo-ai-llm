from typing import Optional

# ============================================================
# LIMITE DE REVIEWS POR LOCAL NO APIFY
# Máximo de reviews buscadas por ponto turístico em qualquer busca
# (varredura da cidade, tela do ponto e verificação dos alertas).
#
# Para RETIRAR o limite, troque 30 por None.
# Atenção: sem limite o Apify busca todas as reviews de cada local,
# o que pode custar muito mais (e mais tokens na OpenAI).
# ============================================================
MAX_REVIEWS_PER_PLACE : Optional[int] = 30
