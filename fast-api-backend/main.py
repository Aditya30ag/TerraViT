from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict
from PIL import Image
import io
import httpx

from schemas import (
    PredictionResponse,
    HealthResponse,
    ClimateRiskRequest,
    ClimateRiskResponse,
    ClimateRiskScores,
)
from terravit_model import terravit_model

app = FastAPI(
    title="TerraViT Backend API",
    description="FastAPI backend for TerraViT – Vision Transformer climate intelligence using satellite imagery.",
    version="0.1.0",
)

# Allow local dev origins by default
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def load_model_on_startup() -> None:
    """Load the TerraViT model when the server starts."""
    terravit_model.load()


@app.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Health check endpoint returning model/device status."""
    return HealthResponse(
        status="ok",
        model_loaded=terravit_model.is_loaded,
        device=terravit_model.device_str,
    )


@app.post("/predict/image", response_model=PredictionResponse)
async def predict_from_image(file: UploadFile = File(...)) -> PredictionResponse:
    """Run TerraViT inference on an uploaded satellite image file."""
    if file.content_type is None or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail="Could not read image file.") from exc

    try:
        result: Dict = terravit_model.predict(image)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return PredictionResponse(**result)


@app.post("/risk/score", response_model=ClimateRiskResponse)
async def climate_risk_score(payload: ClimateRiskRequest) -> ClimateRiskResponse:
    """Compute simple climate risk scores for a location using external climate data.

    This uses the Open-Meteo API (no key required) to fetch basic climate variables
    and then normalizes them into 0–1 risk scores. The logic is intentionally
    simple and transparent so it can be refined later.
    """

    base_url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": payload.lat,
        "longitude": payload.lon,
        "hourly": "temperature_2m,precipitation,relativehumidity_2m",
        "forecast_days": 1,
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(base_url, params=params)
            resp.raise_for_status()
        except httpx.HTTPError as exc:  # noqa: TRY003
            raise HTTPException(status_code=502, detail=f"Climate API error: {exc}") from exc

    data = resp.json()
    hourly = data.get("hourly", {})

    temps = hourly.get("temperature_2m") or []
    precips = hourly.get("precipitation") or []
    humid = hourly.get("relativehumidity_2m") or []

    # Simple aggregates
    avg_temp = sum(temps) / len(temps) if temps else 20.0
    max_temp = max(temps) if temps else avg_temp
    total_precip = sum(precips) if precips else 0.0
    avg_humid = sum(humid) / len(humid) if humid else 50.0

    def clamp01(x: float) -> float:
        return max(0.0, min(1.0, x))

    # Heuristic risk scores (0–1). You can refine these later.
    heat_risk = clamp01((max_temp - 25.0) / 15.0)  # >40C -> ~1
    flood_risk = clamp01(total_precip / 50.0)  # 50mm/day -> 1
    vegetation_stress = clamp01((60.0 - avg_humid) / 40.0)  # very low humidity -> high stress
    air_quality_proxy = clamp01(heat_risk * 0.5 + vegetation_stress * 0.5)

    overall_risk = clamp01(
        0.35 * heat_risk
        + 0.30 * flood_risk
        + 0.20 * vegetation_stress
        + 0.15 * air_quality_proxy
    )

    scores = ClimateRiskScores(
        heat_risk=heat_risk,
        flood_risk=flood_risk,
        vegetation_stress=vegetation_stress,
        air_quality_proxy=air_quality_proxy,
        overall_risk=overall_risk,
    )

    summary = (
        "Climate risk snapshot: "
        f"overall={overall_risk:.2f}, heat={heat_risk:.2f}, "
        f"flood={flood_risk:.2f}, vegetation_stress={vegetation_stress:.2f}."
    )

    return ClimateRiskResponse(
        lat=payload.lat,
        lon=payload.lon,
        scores=scores,
        summary=summary,
    )


# Root endpoint for quick verification
@app.get("/")
async def root() -> Dict[str, str]:
    return {"message": "TerraViT FastAPI backend is running."}
