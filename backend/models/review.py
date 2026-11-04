from pydantic import BaseModel
from typing import Optional
class ReviewSchema(BaseModel):
    review_id : str
    author : str
    rating : float
    text : str
    date : Optional[str] = None
    place_id : Optional[str] = None
    