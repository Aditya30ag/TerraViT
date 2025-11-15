from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict
from PIL import Image
import io

from schemas import PredictionResponse, HealthResponse
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


# Root endpoint for quick verification
@app.get("/")
async def root() -> Dict[str, str]:
    return {"message": "TerraViT FastAPI backend is running."}
