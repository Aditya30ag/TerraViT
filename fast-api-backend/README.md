# TerraViT FastAPI Backend

FastAPI backend for **TerraViT – The Vision Transformer for Earths Future**.

It loads the TerraViT model weights (by default `SatViT_V2.pt`) and exposes HTTP endpoints for health checks and image-based inference.

## Project structure

- `main.py` – FastAPI application entrypoint and API routes.
- `terravit_model.py` – TerraViT model wrapper (loading, preprocessing, inference).
- `schemas.py` – Pydantic models for request/response payloads.
- `SatViT_V1.pt`, `SatViT_V2.pt` – Model weight files.
- `requirements.txt` – Python dependencies.

## Setup

From the `fast-api-backend` directory (inside your WSL Ubuntu environment):

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

If your weights are not named `SatViT_V2.pt` or are in another location, set:

```bash
export TERRAVIT_WEIGHTS_PATH=/path/to/your/weights.pt
```

## Run the server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`.

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API overview

### `GET /health`

Returns basic service and model status.

### `POST /predict/image`

Accepts a satellite image file (`multipart/form-data`, field name `file`) and returns a generic prediction structure:

```json
{
  "top_class_index": 3,
  "top_class_score": 0.92,
  "raw_scores": [ ... ],
  "raw_output": null
}
```

You can adapt `terravit_model.py` to match your exact TerraViT head (classification, regression, multi-task, explanations, etc.).
