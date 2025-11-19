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


class ClimateRiskRequest(BaseModel):
    lat: float
    lon: float
    date: Optional[str] = None  # ISO date; if omitted, use current/forecast


class ClimateRiskScores(BaseModel):
    heat_risk: float
    flood_risk: float
    vegetation_stress: float
    air_quality_proxy: float
    overall_risk: float


class ClimateRiskResponse(BaseModel):
    lat: float
    lon: float
    scores: ClimateRiskScores
    summary: str


class ClimateRiskHistoryYear(BaseModel):
    year: int
    scores: ClimateRiskScores


class ClimateRiskHistoryResponse(BaseModel):
    lat: float
    lon: float
    years: List[ClimateRiskHistoryYear]


class ChangeDetectResponse(BaseModel):
    change_score: float
    class_scores_before: Optional[List[float]] = None
    class_scores_after: Optional[List[float]] = None
    per_class_change: Optional[List[float]] = None
    dominant_change_class_index: Optional[int] = None
    summary: str
