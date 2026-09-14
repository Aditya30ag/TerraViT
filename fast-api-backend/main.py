from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List
from datetime import datetime
from PIL import Image
import io
import httpx
import base64
import numpy as np

from schemas import (
    PredictionResponse,
    HealthResponse,
    ClimateRiskRequest,
    ClimateRiskResponse,
    ClimateRiskScores,
    ClimateRiskHistoryYear,
    ClimateRiskHistoryResponse,
    ChangeDetectResponse,
    OverlayResponse,
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


@app.post("/change/overlay", response_model=OverlayResponse)
async def change_overlay(
    before: UploadFile = File(...),
    after: UploadFile = File(...),
) -> OverlayResponse:
    """Return visual overlays (heatmap + heuristic masks) for before/after images.

    Overlays are returned as base64-encoded PNG strings (no data URI prefix).
    Heatmap is RGBA with alpha proportional to model feature change magnitude.
    Vegetation and Flood masks are computed at image resolution to eliminate blockiness,
    and output at the exact resolution/aspect ratio of the reference image.
    """
    for f, name in ((before, "before"), (after, "after")):
        if f.content_type is None or not f.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail=f"Uploaded {name} file must be an image.")

    try:
        before_bytes = await before.read()
        after_bytes = await after.read()
        before_img = Image.open(io.BytesIO(before_bytes)).convert("RGB")
        after_img = Image.open(io.BytesIO(after_bytes)).convert("RGB")
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail="Could not read one or both image files.") from exc

    if not terravit_model.is_loaded:
        terravit_model.load()

    try:
        # 1. Reference geometry alignment: use 'after' as spatial reference
        w_ref, h_ref = after_img.size
        if before_img.size != (w_ref, h_ref):
            before_aligned = before_img.resize((w_ref, h_ref), resample=Image.Resampling.BILINEAR)
        else:
            before_aligned = before_img

        # 2. Model patch-level predictions for Heatmap
        patch_hw = terravit_model._patch_hw or 8
        grid_size = int((terravit_model._num_patches or 1024) ** 0.5)
        model_side = patch_hw * grid_size

        before_model_in = before_aligned.resize((model_side, model_side), resample=Image.Resampling.BILINEAR)
        after_model_in = after_img.resize((model_side, model_side), resample=Image.Resampling.BILINEAR)

        before_pred = terravit_model.image_patch_preds(before_model_in)  # [L, io_dim]
        after_pred = terravit_model.image_patch_preds(after_model_in)

        import torch as _torch

        diffs = _torch.norm(after_pred - before_pred, dim=1).cpu().numpy()  # (L,)

        L = diffs.shape[0]
        if grid_size * grid_size != L:
            grid_size = int(round(L ** 0.5))

        heat_grid = diffs.reshape(grid_size, grid_size)

        # Robust normalization on model patch diffs
        flat = diffs.flatten()
        vmin = float(np.percentile(flat, 10))
        vmax = float(np.percentile(flat, 98))
        rng = max(vmax - vmin, 1e-6)
        norm = np.clip((heat_grid - vmin) / rng, 0.0, 1.0)

        # 3x3 Gaussian-like spatial smoothing on patch grid
        k = np.array([[1, 2, 1], [2, 4, 2], [1, 2, 1]], dtype=float) / 16.0
        padded = np.pad(norm, 1, mode="edge")
        smooth = (
            padded[:-2, :-2] * k[0, 0] + padded[:-2, 1:-1] * k[0, 1] + padded[:-2, 2:] * k[0, 2] +
            padded[1:-1, :-2] * k[1, 0] + padded[1:-1, 1:-1] * k[1, 1] + padded[1:-1, 2:] * k[1, 2] +
            padded[2:, :-2] * k[2, 0] + padded[2:, 1:-1] * k[2, 1] + padded[2:, 2:] * k[2, 2]
        )
        smooth = np.clip(smooth, 0.0, 1.0)

        # Smoothly upscale heatmap directly to reference image dimensions (w_ref, h_ref)
        smooth_pil = Image.fromarray((smooth * 255).astype(np.uint8)).resize(
            (w_ref, h_ref), resample=Image.Resampling.BICUBIC
        )
        heat_full = np.asarray(smooth_pil).astype(np.float32) / 255.0

        # Build true RGBA heatmap (transparent where change is low, vivid thermal ramp where change is high)
        heat_rgba = np.zeros((h_ref, w_ref, 4), dtype=np.uint8)
        change_mask = heat_full > 0.15
        t = np.clip((heat_full - 0.15) / 0.85, 0.0, 1.0)

        # Yellow (255, 230, 20) -> Orange (255, 120, 10) -> Red (230, 20, 20)
        heat_rgba[..., 0] = (255 * change_mask).astype(np.uint8)
        heat_rgba[..., 1] = (np.clip(230 * (1.0 - t ** 0.8), 20, 230) * change_mask).astype(np.uint8)
        heat_rgba[..., 2] = (np.clip(20 * (1.0 - t), 0, 20) * change_mask).astype(np.uint8)
        # Alpha ramps smoothly from 50 to 200 (max ~78% opacity)
        heat_rgba[..., 3] = (np.clip(50 + 150 * (t ** 0.7), 0, 200) * change_mask).astype(np.uint8)
        heat_img = Image.fromarray(heat_rgba, mode="RGBA")

        # 3. High-Resolution Spectral Indices for Vegetation Loss & Flood Detection
        # Process at reference resolution (or capped at 1024 max side for efficiency)
        max_dim = max(w_ref, h_ref)
        if max_dim > 1024:
            scale = 1024.0 / max_dim
            proc_w = int(round(w_ref * scale))
            proc_h = int(round(h_ref * scale))
            b_before_img = before_aligned.resize((proc_w, proc_h), resample=Image.Resampling.BILINEAR)
            b_after_img = after_img.resize((proc_w, proc_h), resample=Image.Resampling.BILINEAR)
        else:
            proc_w, proc_h = w_ref, h_ref
            b_before_img = before_aligned
            b_after_img = after_img

        b_before = np.asarray(b_before_img).astype(np.float32) / 255.0
        b_after = np.asarray(b_after_img).astype(np.float32) / 255.0

        Rb, Gb, Bb = b_before[..., 0], b_before[..., 1], b_before[..., 2]
        Ra, Ga, Ba = b_after[..., 0], b_after[..., 1], b_after[..., 2]

        # Excess Green (ExG): 2G - R - B
        exg_b = 2.0 * Gb - Rb - Bb
        exg_a = 2.0 * Ga - Ra - Ba
        # Vegetation presence check in 'before': must actually be green
        is_veg_before = (exg_b > 0.05) & (Gb > Rb) & (Gb > Bb * 0.85)
        # Vegetation loss: was green before, drop in ExG exceeds threshold, and relative drop is substantial
        veg_loss_raw = is_veg_before & ((exg_b - exg_a) > 0.08) & (exg_a < exg_b * 0.75)

        # True RGB Water Index: (B - R) / (B + R + eps) with green/brightness bounds
        wi_b = (Bb - Rb) / np.clip(Bb + Rb, 1e-6, None)
        wi_a = (Ba - Ra) / np.clip(Ba + Ra, 1e-6, None)
        bright_b = (Rb + Gb + Bb) / 3.0
        bright_a = (Ra + Ga + Ba) / 3.0

        # Water presence in 'before' and 'after'
        is_water_b = (Bb > Rb) & (Bb >= Gb * 0.85) & (wi_b > 0.05) & (bright_b < 0.60)
        is_water_a = (Ba > Ra) & (Ba >= Ga * 0.85) & (wi_a > 0.05) & (bright_a < 0.60)
        # Flood / water increase: must be water in 'after', was NOT water in 'before', and positive delta
        flood_raw = is_water_a & (~is_water_b) & ((wi_a - wi_b) > 0.08)

        # Morphological noise cleanup (opening = erode then dilate, removes single pixel noise)
        def morph_clean(binary: np.ndarray) -> np.ndarray:
            pad = 1
            padded = np.pad(binary, pad, mode="constant", constant_values=0)
            s = (
                padded[:-2, :-2] + padded[:-2, 1:-1] + padded[:-2, 2:] +
                padded[1:-1, :-2] + padded[1:-1, 1:-1] + padded[1:-1, 2:] +
                padded[2:, :-2] + padded[2:, 1:-1] + padded[2:, 2:]
            )
            eroded = (s == 9).astype(np.uint8)
            p_eroded = np.pad(eroded, pad, mode="constant", constant_values=0)
            s_dil = (
                p_eroded[:-2, :-2] + p_eroded[:-2, 1:-1] + p_eroded[:-2, 2:] +
                p_eroded[1:-1, :-2] + p_eroded[1:-1, 1:-1] + p_eroded[1:-1, 2:] +
                p_eroded[2:, :-2] + p_eroded[2:, 1:-1] + p_eroded[2:, 2:]
            )
            opened = (s_dil > 0).astype(np.uint8)
            return opened

        def extract_outline(mask: np.ndarray) -> np.ndarray:
            pad = 1
            padded = np.pad(mask, pad, mode="constant", constant_values=0)
            s = (
                padded[:-2, :-2] + padded[:-2, 1:-1] + padded[:-2, 2:] +
                padded[1:-1, :-2] + padded[1:-1, 1:-1] + padded[1:-1, 2:] +
                padded[2:, :-2] + padded[2:, 1:-1] + padded[2:, 2:]
            )
            eroded = (s == 9).astype(np.uint8)
            return (mask & (~eroded)).astype(np.uint8)

        veg_clean_proc = morph_clean(veg_loss_raw.astype(np.uint8))
        water_clean_proc = morph_clean(flood_raw.astype(np.uint8))

        # Resize masks to reference image dimensions (w_ref, h_ref) if downscaled
        if (proc_w, proc_h) != (w_ref, h_ref):
            veg_clean = np.asarray(
                Image.fromarray(veg_clean_proc * 255).resize((w_ref, h_ref), resample=Image.Resampling.NEAREST)
            ) > 127
            water_clean = np.asarray(
                Image.fromarray(water_clean_proc * 255).resize((w_ref, h_ref), resample=Image.Resampling.NEAREST)
            ) > 127
        else:
            veg_clean = veg_clean_proc.astype(bool)
            water_clean = water_clean_proc.astype(bool)

        veg_outline = extract_outline(veg_clean.astype(np.uint8))
        water_outline = extract_outline(water_clean.astype(np.uint8))

        # Helper to encode RGBA masks
        def mask_to_png_b64(mask_arr: np.ndarray, color: tuple[int, int, int], alpha: int = 150) -> str:
            rgba = np.zeros((h_ref, w_ref, 4), dtype=np.uint8)
            rgba[..., 0] = color[0]
            rgba[..., 1] = color[1]
            rgba[..., 2] = color[2]
            rgba[..., 3] = (mask_arr * alpha).astype(np.uint8)
            pil_img = Image.fromarray(rgba, mode="RGBA")
            bio = io.BytesIO()
            pil_img.save(bio, format="PNG")
            return base64.b64encode(bio.getvalue()).decode("ascii")

        veg_png = mask_to_png_b64(veg_clean.astype(np.uint8), color=(34, 197, 94), alpha=160)
        veg_outline_png = mask_to_png_b64(veg_outline, color=(22, 242, 77), alpha=255)
        water_png = mask_to_png_b64(water_clean.astype(np.uint8), color=(14, 165, 233), alpha=160)
        water_outline_png = mask_to_png_b64(water_outline, color=(56, 189, 248), alpha=255)

        # Heatmap PNG
        bio = io.BytesIO()
        heat_img.save(bio, format="PNG")
        heat_b64 = base64.b64encode(bio.getvalue()).decode("ascii")

        # Return overlays
        return OverlayResponse(
            heatmap_png_base64=heat_b64,
            vegetation_mask_png_base64=veg_png,
            vegetation_mask_outline_png_base64=veg_outline_png,
            flood_mask_png_base64=water_png,
            flood_mask_outline_png_base64=water_outline_png,
            heatmap_values=diffs.tolist(),
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Overlay generation failed: {exc}") from exc


# -------------------------
# Alerts & Early Warning
import uuid
import asyncio
import json
import os
import re
from typing import Any

from schemas import AlertCreate, Alert, RegisterLocationRequest


# In-memory alert store (prototype) and broadcast queue for SSE
_alerts: list[Alert] = []
_alert_queue: "asyncio.Queue[dict]" = asyncio.Queue()
_registered_locations: dict[str, dict[str, Any]] = {}
_monitor_task: asyncio.Task | None = None

ALERT_WEBHOOK_URL = os.getenv("ALERT_WEBHOOK_URL")
ALERT_POLL_SECONDS = int(os.getenv("ALERT_POLL_SECONDS", "60"))


async def dispatch_alert(alert: dict) -> None:
    """Dispatch alert to external webhook and other channels (best-effort)."""
    if ALERT_WEBHOOK_URL:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                await client.post(ALERT_WEBHOOK_URL, json=alert)
        except Exception:
            # best-effort: don't raise
            pass


@app.post("/alerts", response_model=Alert)
async def create_alert(payload: AlertCreate) -> Alert:
    """Create a new alert (manual or automated)."""
    alert_id = str(uuid.uuid4())
    alert = Alert(id=alert_id, **payload.dict())

    # store and broadcast
    _alerts.insert(0, alert)
    await _alert_queue.put(alert.dict())

    # dispatch webhooks in background
    asyncio.create_task(dispatch_alert(alert.dict()))

    return alert


@app.get("/alerts", response_model=list[Alert])
async def list_alerts() -> list[Alert]:
    return _alerts


@app.post("/alerts/simulate", response_model=Alert)
async def simulate_alert(lat: float, lon: float, alert_type: str = "flood", score: float = 0.9) -> Alert:
    """Simulate an alert for testing/demo purposes."""
    payload = AlertCreate(lat=lat, lon=lon, alert_type=alert_type, score=score)
    return await create_alert(payload)


@app.post("/alerts/from_image", response_model=Alert)
async def alert_from_image(lat: float, lon: float, file: UploadFile = File(...), alert_type: str = "anomaly", threshold: float = 0.7) -> Alert:
    """Run TerraViT on an uploaded image and optionally create an alert when the prediction is confident.

    This is a simple bridge for image-based detections: it uses the model's top_class_score
    as a proxy for confidence. If score >= threshold, an alert is created.
    """
    if file.content_type is None or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail="Could not read image file.") from exc

    if not terravit_model.is_loaded:
        terravit_model.load()

    result = terravit_model.predict(image)

    score = float(result.get("top_class_score", 0.0) or 0.0)

    if score >= float(threshold):
        payload = AlertCreate(lat=lat, lon=lon, alert_type=alert_type, score=score)
        return await create_alert(payload)

    # Not confident enough to create an alert; return a 204 with no content by convention
    from fastapi.responses import JSONResponse

    return JSONResponse(status_code=204, content={})


@app.get("/alerts/stream")
async def alerts_stream():
    """Server-Sent Events (SSE) stream of alerts. Connect with EventSource from clients."""

    async def event_generator():
        while True:
            data = await _alert_queue.get()

            # Normalize timestamp into an ISO string with explicit timezone (UTC 'Z')
            # so clients interpret the moment correctly in their local timezone.
            if isinstance(data, dict):
                payload = dict(data)
            else:
                payload = dict(data)

            ts = payload.get("timestamp")

            # If timestamp is a string but lacks timezone info, append Z to mark UTC
            if isinstance(ts, str):
                if "Z" not in ts and not re.search(r"[+-]\d\d:\d\d$", ts):
                    payload["timestamp"] = ts + "Z"
            else:
                # datetime-like object -> convert to UTC ISO and use 'Z' suffix
                if hasattr(ts, "astimezone"):
                    from datetime import timezone as _tz

                    payload["timestamp"] = ts.astimezone(_tz.utc).isoformat().replace("+00:00", "Z")
                elif hasattr(ts, "isoformat"):
                    payload["timestamp"] = ts.isoformat()

            yield f"data: {json.dumps(payload)}\n\n"

    from fastapi.responses import StreamingResponse

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.post("/alerts/register_location")
async def register_location(payload: RegisterLocationRequest) -> dict:
    """Register a location to be polled for automatic alerts.

    Accepts a JSON body with `lat`, `lon`, optional `id` and `alert_threshold`.
    Returns the registration id.
    """
    reg_id = payload.id or str(uuid.uuid4())
    _registered_locations[reg_id] = {"lat": float(payload.lat), "lon": float(payload.lon), "threshold": float(payload.alert_threshold)}

    global _monitor_task
    if _monitor_task is None:
        _monitor_task = asyncio.create_task(_monitor_registered_locations())

    return {"id": reg_id}


async def _monitor_registered_locations() -> None:
    from schemas import ClimateRiskRequest

    while True:
        try:
            if not _registered_locations:
                await asyncio.sleep(ALERT_POLL_SECONDS)
                continue

            tasks = []
            for reg_id, info in list(_registered_locations.items()):
                req = ClimateRiskRequest(lat=info["lat"], lon=info["lon"])
                tasks.append((reg_id, asyncio.create_task(climate_risk_score(req))))

            for reg_id, t in tasks:
                try:
                    resp = await t
                except Exception:
                    continue

                # Simple policy: create a flood alert when flood_risk > threshold,
                # create a fire alert when heat_risk and vegetation_stress combine > threshold.
                thr = _registered_locations.get(reg_id, {}).get("threshold", 0.7)
                scores = resp.scores

                if scores.flood_risk >= thr:
                    payload = AlertCreate(lat=resp.lat, lon=resp.lon, alert_type="flood", score=scores.flood_risk)
                    await create_alert(payload)

                if (scores.heat_risk * 0.6 + scores.vegetation_stress * 0.4) >= thr:
                    heat_score = float(scores.heat_risk * 0.6 + scores.vegetation_stress * 0.4)
                    payload = AlertCreate(lat=resp.lat, lon=resp.lon, alert_type="fire", score=heat_score)
                    await create_alert(payload)

                # Log each registration check explicitly for easier debugging
                print(
                    f"[RISK] reg={reg_id} lat={resp.lat}, lon={resp.lon}, flood={scores.flood_risk}, heat={scores.heat_risk}, veg={scores.vegetation_stress}"
                )

        except Exception:
            # swallow to keep background task alive
            pass

        await asyncio.sleep(ALERT_POLL_SECONDS)


# Root endpoint for quick verification
@app.get("/")
async def root() -> Dict[str, str]:
    return {"message": "TerraViT FastAPI backend is running."}
