# 🌍 TerraViT - Vision Transformer for Earth's Future

> **TerraViT** is an AI-powered climate intelligence platform that combines a **satellite-imagery Vision Transformer** (ViT) with real-time climate data to detect land-cover change, assess environmental risk, and stream early-warning alerts - all through a modern, interactive web interface.

---

## What is TerraViT?

TerraViT wraps **SatViT** - a Masked Autoencoder (MAE) Vision Transformer pre-trained on multi-spectral satellite imagery - in a production-ready full-stack application. Users can:

- 🛰️ **Upload satellite images** and run instant AI inference to understand land-cover patterns
- 🔄 **Compare before/after images** to detect vegetation loss, flooding, or urban sprawl with visual heatmaps and masks
- 🌡️ **Get real-time climate risk scores** (heat, flood, vegetation stress, air quality) for any GPS coordinate via Open-Meteo
- 📈 **Explore 10-year historical climate trends** for any location
- 🚨 **Receive live early-warning alerts** over a Server-Sent Events (SSE) stream when risk thresholds are exceeded
- 🗺️ **Register locations** for continuous background monitoring with automated flood/fire alerting

---

## Tech Stack

| Layer | Technology |
|---|---|
| **AI Model** | SatViT (MAE ViT), PyTorch, `einops`, `torchvision` |
| **Backend** | FastAPI (Python), Uvicorn, Pydantic, `httpx` |
| **Climate Data** | Open-Meteo (forecast + ERA5 archive) |
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| **Real-time** | Server-Sent Events (SSE) |
| **Image Processing** | Pillow, NumPy |

---

## Project Structure

```
TerraViT/
├── fast-api-backend/        # Python FastAPI service
│   ├── main.py              # API routes & application entrypoint
│   ├── terravit_model.py    # TerraViT model wrapper (load, preprocess, infer)
│   ├── SatViT_model.py      # SatViT MAE architecture (encoder + decoder)
│   ├── schemas.py           # Pydantic request/response models
│   ├── SatViT_V1.pt         # Model weights – V1 (patch=16, patches=256)
│   ├── SatViT_V2.pt         # Model weights – V2 (patch=8, patches=1024)
│   └── requirements.txt     # Python dependencies
│
├── frontend/                # Next.js web application
│   ├── app/                 # App Router pages
│   │   ├── page.tsx                     # Landing page
│   │   ├── climate-intel/               # Climate risk dashboard
│   │   ├── satellite-change-detection/  # Before/after change detection
│   │   └── real-time-monitoring/        # Live alert stream
│   ├── components/
│   │   ├── landing/         # Hero, About, Capabilities, HowItWorks, etc.
│   │   └── ui/              # Shared shadcn/ui primitives
│   └── lib/                 # Utility helpers
│
└── images/                  # Sample before/after satellite image pairs for demo
```

---

## Architecture

The diagram below shows how every major piece of TerraViT fits together - from a user uploading a satellite image in the browser, through the FastAPI backend, down to the SatViT neural network, and back as scores, overlays, and real-time alerts.

```mermaid
flowchart TD
    subgraph Browser["Browser - Next.js Frontend"]
        direction TB
        LP["Landing Page\n(Hero / About / Capabilities)"]
        CI["Climate Intel Page\n(Risk scores + 10-yr history chart)"]
        CD["Change Detection Page\n(Before / After upload + overlays)"]
        RT["Real-Time Monitoring Page\n(SSE alert stream)"]
    end

    subgraph API["FastAPI Backend  (Python / Uvicorn)"]
        direction TB
        subgraph Inference["Model Inference"]
            EP1["POST /predict/image\nRun TerraViT on single satellite image"]
            EP2["POST /change/detect\nCompare before & after → change score"]
            EP3["POST /change/overlay\nGenerate heatmap + veg/flood masks PNG b64"]
        end
        subgraph Climate["Climate Risk"]
            EP4["POST /risk/score\nFetch live forecast → risk scores 0-1"]
            EP5["POST /risk/history\n10-yr ERA5 archive → yearly risk trend"]
        end
        subgraph Alerts["Alerts & Early Warning"]
            EP6["POST /alerts\nCreate alert manually"]
            EP7["POST /alerts/simulate\nDemo / test alert creation"]
            EP8["POST /alerts/from_image\nImage inference → auto-alert if confident"]
            EP9["GET /alerts/stream\nSSE stream for live delivery"]
            EP10["POST /alerts/register_location\nRegister lat/lon for background polling"]
            BG["Background Monitor\nPolls registered locations every N seconds\nFlood alert: flood_risk >= threshold\nFire alert: heat x0.6 + veg x0.4 >= threshold"]
        end
        HLT["GET /health\nModel and device status"]
    end

    subgraph Model["TerraViT Model Layer"]
        direction TB
        TMW["TerraViTModel wrapper\nterravit_model.py"]
        subgraph Pre["Pre-processing"]
            P1["PIL Image to RGB resize\nto patch_hw x grid_size"]
            P2["ImageNet normalize\nmean/std"]
            P3["Channel adapter\n3 RGB to 15 channels repeat/trim"]
            P4["Patchify\nB,C,H,W to B,N,io_dim"]
        end
        subgraph SatViT["SatViT MAE Architecture"]
            ENC["Transformer Encoder\n12 layers · 768 dim · 12 heads\n+ 2D sincos position embeddings"]
            DEC["Transformer Decoder\nV1: 2 layers 384 dim | V2: 1 layer 512 dim"]
        end
        subgraph Post["Post-processing"]
            PO1["_image_logits\npred.mean over patches to 1D logit vector"]
            PO2["image_patch_preds\npred per patch to N, io_dim tensor"]
            PO3["predict\nsoftmax to top_class_index and score"]
        end
        subgraph Overlay["Overlay Generation"]
            OV1["Per-patch decoder diff\nnorm of after_pred - before_pred"]
            OV2["Heatmap: normalize, smooth,\ncolorise red to yellow, PNG b64"]
            OV3["Veg mask: ExG proxy\n2G-R-B delta > adaptive threshold"]
            OV4["Flood mask: NDWI-like proxy\nG-R over G+R delta > adaptive threshold"]
            OV5["Morphological clean-up\nerode to dilate to outline extraction"]
        end
    end

    subgraph External["External APIs"]
        OM["Open-Meteo Forecast API\ntemperature, precipitation, humidity"]
        ERA5["Open-Meteo ERA5 Archive\ndaily aggregates per year"]
        WH["Webhook optional\nALERT_WEBHOOK_URL"]
    end

    CD -- "upload before+after images" --> EP2 & EP3
    CI -- "lat, lon" --> EP4 & EP5
    RT -- "EventSource" --> EP9

    EP2 --> TMW
    EP3 --> TMW
    EP1 --> TMW

    TMW --> Pre --> SatViT --> Post
    SatViT --> Overlay

    EP3 --> Overlay
    EP2 --> PO1

    EP4 --> OM
    EP5 --> ERA5

    EP9 -. "SSE push" .-> RT
    BG --> EP6
    EP10 --> BG
    EP6 -. "best-effort POST" .-> WH

    BG -- "reuses /risk/score logic" --> OM

    LP -.-> HLT
```

---

## API Reference

### Inference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Model load status + device (CPU/CUDA) |
| `POST` | `/predict/image` | Upload satellite image → top class index & score |
| `POST` | `/change/detect` | Upload before+after → per-class change score vector |
| `POST` | `/change/overlay` | Upload before+after → heatmap, veg mask, flood mask (PNG base64) |

### Climate Risk

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/risk/score` | `{lat, lon}` → real-time risk scores (heat, flood, veg, air, overall) |
| `POST` | `/risk/history` | `{lat, lon}` → 10-year yearly risk score history from ERA5 |

### Alerts & Early Warning

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/alerts` | List all stored alerts |
| `POST` | `/alerts` | Manually create an alert |
| `POST` | `/alerts/simulate` | Simulate an alert (demo/testing) |
| `POST` | `/alerts/from_image` | Upload image → auto-create alert if model confidence ≥ threshold |
| `GET` | `/alerts/stream` | SSE stream - connect via `EventSource` for live alerts |
| `POST` | `/alerts/register_location` | Register a lat/lon for background periodic monitoring |

### Risk Score Heuristics

All risk values are clamped to **[0, 1]**:

| Score | Formula |
|---|---|
| `heat_risk` | `clamp((max_temp − 25) / 15)` - saturates at 40 °C |
| `flood_risk` | `clamp(total_precip / 50)` - saturates at 50 mm/day (1 000 mm/yr for history) |
| `vegetation_stress` | `clamp((60 − avg_humidity) / 40)` - very low humidity → high stress |
| `air_quality_proxy` | `heat_risk × 0.5 + vegetation_stress × 0.5` |
| `overall_risk` | `0.35·heat + 0.30·flood + 0.20·veg + 0.15·air` |

---

## Quick Start

### Backend

```bash
cd fast-api-backend

# Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Point to custom weights
export TERRAVIT_WEIGHTS_PATH=/path/to/weights.pt

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Interactive docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
pnpm install        # or npm install / yarn
pnpm dev            # or npm run dev
```

Open http://localhost:3000

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `TERRAVIT_WEIGHTS_PATH` | `SatViT_V2.pt` | Path to the model weights file |
| `ALERT_WEBHOOK_URL` | *(unset)* | Optional URL to POST new alerts to |
| `ALERT_POLL_SECONDS` | `60` | Background monitoring poll interval (seconds) |

---

## Model Details

TerraViT uses **SatViT** - a Masked Autoencoder Vision Transformer trained on multi-spectral (15-channel) satellite data.

| | SatViT V1 | SatViT V2 |
|---|---|---|
| **Patch size** | 16 × 16 | 8 × 8 |
| **Num patches** | 256 | 1 024 |
| **Encoder dim** | 768 | 768 |
| **Encoder depth** | 12 | 12 |
| **Encoder heads** | 12 | 12 |
| **Decoder dim** | 384 | 512 |
| **Decoder depth** | 2 | 1 |
| **Decoder heads** | 6 | 8 |
| **Input channels** | 15 | 15 |

RGB images uploaded by users are automatically adapted to 15 channels by repeating the 3 RGB bands and trimming to the expected size.

---

## License

This project is for research and demonstration purposes.
