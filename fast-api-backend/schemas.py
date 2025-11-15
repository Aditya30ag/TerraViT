from typing import List, Optional

from pydantic import BaseModel


class PredictionResponse(BaseModel):
    top_class_index: Optional[int] = None
    top_class_score: Optional[float] = None
    raw_scores: Optional[List[float]] = None
    raw_output: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    device: str
