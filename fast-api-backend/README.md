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

## Alerts & Early Warning (new)

This backend includes a minimal prototype for alerts and early warnings. It stores alerts in-memory and exposes a Server-Sent Events (SSE) stream for real-time delivery to clients.

Environment variables:

- `ALERT_WEBHOOK_URL` — optional webhook URL to POST alerts to when created (best-effort delivery)
- `ALERT_POLL_SECONDS` — how often registered locations are polled for risk (default: 60)

Endpoints:

- `GET /alerts` — list recent alerts
- `POST /alerts` — create an alert (payload: `AlertCreate`)
- `POST /alerts/simulate` — convenience endpoint to simulate an alert
- `POST /alerts/from_image` — upload an image and (optionally) create an alert if the model is confident
- `GET /alerts/stream` — SSE stream for live alerts (connect with `EventSource`)
- `POST /alerts/register_location` — register a lat/lon to be monitored periodically (query or JSON: `lat`, `lon`, `alert_threshold`)

Notes:

- The current implementation is intentionally simple and in-memory for demo purposes. For production use, persist alerts to a database (Postgres, DynamoDB), add robust retry/outbox for webhook/email delivery, secure endpoints, and add auth.
- The monitoring policy is simple: flood alerts are triggered when the climate flood risk exceeds the registered threshold; fire alerts are triggered when a weighted heat + vegetation stress score exceeds the threshold.
