from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List
from datetime import datetime
from PIL import Image
import io
import httpx

from schemas import (
    PredictionResponse,
    HealthResponse,
    ClimateRiskRequest,
    ClimateRiskResponse,
    ClimateRiskScores,
    ClimateRiskHistoryYear,
    ClimateRiskHistoryResponse,
    ChangeDetectResponse,
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


@app.post("/risk/history", response_model=ClimateRiskHistoryResponse)
async def climate_risk_history(payload: ClimateRiskRequest) -> ClimateRiskHistoryResponse:
    """Return simple yearly climate risk scores over the last 10 years for a location.

    This uses the Open-Meteo ERA5 archive API to fetch daily aggregates for each
    year, then applies the same heuristic scoring used in `/risk/score`.
    """

    def clamp01(x: float) -> float:
        return max(0.0, min(1.0, x))

    async def compute_year_scores(client: httpx.AsyncClient, year: int) -> ClimateRiskHistoryYear:
        base_url = "https://archive-api.open-meteo.com/v1/era5"
        params = {
            "latitude": payload.lat,
            "longitude": payload.lon,
            "start_date": f"{year}-01-01",
            "end_date": f"{year}-12-31",
            "daily": "temperature_2m_max,precipitation_sum,relative_humidity_2m_mean",
        }

        resp = await client.get(base_url, params=params)
        resp.raise_for_status()
        data = resp.json()
        daily = data.get("daily", {})

        temps = daily.get("temperature_2m_max") or []
        precips = daily.get("precipitation_sum") or []
        humid = daily.get("relative_humidity_2m_mean") or []

        avg_temp = sum(temps) / len(temps) if temps else 20.0
        max_temp = max(temps) if temps else avg_temp
        total_precip = sum(precips) if precips else 0.0
        avg_humid = sum(humid) / len(humid) if humid else 50.0

        heat_risk = clamp01((max_temp - 25.0) / 15.0)
        flood_risk = clamp01(total_precip / 1000.0)  # 1000mm/year -> ~1
        vegetation_stress = clamp01((60.0 - avg_humid) / 40.0)
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

        return ClimateRiskHistoryYear(year=year, scores=scores)

    current_year = datetime.utcnow().year
    years: List[int] = list(range(current_year - 9, current_year + 1))

    history_years: List[ClimateRiskHistoryYear] = []

    async with httpx.AsyncClient(timeout=20.0) as client:
        for year in years:
            try:
                year_scores = await compute_year_scores(client, year)
            except httpx.HTTPError:
                # Best-effort history: skip years that fail instead of aborting
                continue
            history_years.append(year_scores)

    return ClimateRiskHistoryResponse(
        lat=payload.lat,
        lon=payload.lon,
        years=history_years,
    )


@app.post("/change/detect", response_model=ChangeDetectResponse)
async def change_detect(
    before: UploadFile = File(...),
    after: UploadFile = File(...),
) -> ChangeDetectResponse:
    """Detect change between two satellite images using TerraViT logits difference.

    This V1 implementation:
    - runs TerraViT on both images,
    - computes softmax probabilities for each,
    - defines a change score as the mean absolute difference across classes,
    - returns per-class change vector and a brief summary.
    """

    for f, name in ((before, "before"), (after, "after")):
        if f.content_type is None or not f.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail=f"Uploaded {name} file must be an image.")

    try:
        before_bytes = await before.read()
        after_bytes = await after.read()
        before_img = Image.open(io.BytesIO(before_bytes))
        after_img = Image.open(io.BytesIO(after_bytes))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail="Could not read one or both image files.") from exc

    if not terravit_model.is_loaded:
        try:
            terravit_model.load()
        except RuntimeError as exc:  # noqa: TRY003
            raise HTTPException(status_code=500, detail=str(exc)) from exc

    import torch

    try:
        # Use the same image->logits pathway as generic prediction
        before_logits = terravit_model._image_logits(before_img)  # type: ignore[attr-defined]
        after_logits = terravit_model._image_logits(after_img)  # type: ignore[attr-defined]

        before_probs = torch.softmax(before_logits, dim=0)
        after_probs = torch.softmax(after_logits, dim=0)

        per_class_change = (after_probs - before_probs).tolist()
        change_score = torch.mean(torch.abs(after_probs - before_probs)).item()

        if len(per_class_change) > 0:
            diffs_abs = torch.abs(after_probs - before_probs)
            dominant_idx = int(torch.argmax(diffs_abs).item())
        else:
            dominant_idx = None

        summary = (
            f"Change score: {change_score:.3f}. "
            "Positive per_class_change values indicate classes that increased in probability from before to after."
        )

        return ChangeDetectResponse(
            change_score=change_score,
            class_scores_before=before_probs.tolist(),
            class_scores_after=after_probs.tolist(),
            per_class_change=per_class_change,
            dominant_change_class_index=dominant_idx,
            summary=summary,
        )
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Change detection failed: {exc}") from exc


# Root endpoint for quick verification
@app.get("/")
async def root() -> Dict[str, str]:
    return {"message": "TerraViT FastAPI backend is running."}
