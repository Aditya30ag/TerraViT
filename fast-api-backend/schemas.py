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
