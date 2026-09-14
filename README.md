## TerraViT - Vision Transformer for Earth's Climate Intelligence

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-black.svg)](https://nextjs.org/)
[![PyTorch](https://img.shields.io/badge/AI-PyTorch%20%2F%20SatViT-EE4C2C.svg)](https://pytorch.org/)

TerraViT is an end-to-end Earth Observation and climate intelligence platform that combines **satellite-imagery Vision Transformers (ViT)** with real-time planetary climate data. It is engineered to detect land-cover change, quantify environmental hazards, visualize ecological shifts with pixel-level precision, and stream automated early-warning alerts through a modern, interactive web interface.

---

## What We Built

TerraViT bridges the gap between raw remote-sensing satellite data and proactive environmental decision-making. The platform unites deep learning vision models with real-time meteorological data feeds into a cohesive, production-grade system:

- **Satellite Imagery Intelligence**: Instant feature extraction and representation analysis from optical satellite imagery using pre-trained Vision Transformers.
- **Multi-Temporal Change Detection**: Bi-temporal comparison ("before" vs. "after") that computes patch-level feature differences to automatically surface land transformations.
- **Dynamic Visual Overlays**:
  - **AI Feature Heatmaps**: Highlighting areas with significant structural and spectral shifts across temporal checkpoints.
  - **Vegetation Stress & Loss Masks**: Identifying canopy loss, deforestation, and agricultural decline.
  - **Flood & Water Extent Masks**: Segmenting standing water accumulation, swollen riverbanks, and flood plains.
- **Geospatial Climate Risk Profiling**: Location-specific environmental risk evaluations (Heatwaves, Flooding, Vegetation Stress, Air Quality Proxy, and Overall Composite Risk) calculated on demand for any GPS coordinate.
- **Decadal Climate Risk Trends**: Analysis of 10-year historical climate patterns utilizing ERA5 atmospheric reanalysis data to identify long-term climate vulnerabilities.
- **Autonomous Early-Warning Engine**: Continuous background surveillance for registered geographical locations that detects threshold-breaching anomalies and streams live alerts via Server-Sent Events (SSE) and webhooks.
- **Interactive Full-Stack Web Application**: A responsive, responsive-first user interface built with Next.js 14, featuring before-and-after image comparison tools, risk dashboards, interactive charts, and live alert feeds.

---

## Use Cases

| Domain | Application Scenario |
|---|---|
| **Disaster Response & Flood Mapping** | Rapid assessment of flooded agricultural land and urban areas following intense storms or monsoons. Enables emergency teams to pinpoint inundated zones and deploy relief effectively. |
| **Deforestation & Wildfire Recovery** | Tracking canopy loss caused by illegal logging, clear-cutting, and agricultural expansion. Helps conservationists assess post-fire burn scars and track reforestation progress over time. |
| **Urban Sprawl & Heat Island Tracking** | Quantifying the transformation of natural landscapes into impervious surfaces (concrete, asphalt). Correlates urbanization with localized temperature spikes and microclimate alterations. |
| **Agricultural Health & Drought Stress** | Monitoring agricultural basins for crop stress, vegetative degradation, and severe moisture deficits to support food security initiatives and agricultural planning. |
| **Environmental Risk Due Diligence** | Equipping municipal authorities, insurers, researchers, and NGOs with historical risk trends and real-time hazard scoring for sustainable land zoning and asset protection. |
| **Autonomous Asset & Border Surveillance** | Continuous background monitoring of critical reservoirs, forest reserves, and remote perimeters with automated early warnings when environmental thresholds are breached. |

---

## Model Architecture: SatViT

At the heart of TerraViT's visual analysis is **SatViT**, a Masked Autoencoder (MAE) Vision Transformer specifically pre-trained on multi-spectral satellite imagery to understand complex remote-sensing patterns.

```
                              ┌────────────────────────────────────────┐
                              │       Input Satellite Image Pair       │
                              │           (Before & After)             │
                              └───────────────────┬────────────────────┘
                                                  │
                                                  ▼
                              ┌────────────────────────────────────────┐
                              │  Preprocessing & Channel Adaptation    │
                              │    (RGB to Multi-Spectral Projection)  │
                              └───────────────────┬────────────────────┘
                                                  │
                                                  ▼
                              ┌────────────────────────────────────────┐
                              │       Patch Partition & Unfolding      │
                              │     (Grid: 16x16 / 8x8 Patches)        │
                              └───────────────────┬────────────────────┘
                                                  │
                                                  ▼
                              ┌────────────────────────────────────────┐
                              │    2D Sine-Cosine Positional Embed     │
                              └───────────────────┬────────────────────┘
                                                  │
                                                  ▼
                              ┌────────────────────────────────────────┐
                              │       SatViT Transformer Encoder       │
                              │       (12 Layers · 768 Embedding Dim)  │
                              └───────────────────┬────────────────────┘
                                                  │
                                                  ▼
                              ┌────────────────────────────────────────┐
                              │       Lightweight MAE Decoder          │
                              │    (Feature Reconstruction & Latents)  │
                              └───────────────────┬────────────────────┘
                                                  │
                     ┌────────────────────────────┴────────────────────────────┐
                     ▼                                                         ▼
    ┌──────────────────────────────────┐                     ┌──────────────────────────────────┐
    │     Bi-Temporal Difference       │                     │    Multi-Spectral Indexing       │
    │   Per-patch latent distance      │                     │  (ExG Vegetation, NDWI-like)     │
    └────────────────┬─────────────────┘                     └────────────────┬─────────────────┘
                     │                                                         │
                     ▼                                                         ▼
    ┌──────────────────────────────────┐                     ┌──────────────────────────────────┐
    │     Normalized Change Heatmap    │                     │  Vegetation & Flood Masks (PNG)  │
    └──────────────────────────────────┘                     └──────────────────────────────────┘
```

### Model Characteristics

- **Patch Tokenization**: The input image is divided into a regular grid of spatial patches, which are flattened and projected into a dense embedding space.
- **2D Sine-Cosine Positional Encoding**: Preserves explicit 2-dimensional geospatial spatial coordinates across all patches without requiring learned position weights.
- **Transformer Encoder**: 12 Transformer encoder blocks featuring multi-head self-attention and MLP feed-forward networks (768 embedding dimension, 12 attention heads).
- **Transformer Decoder**: A lightweight decoder designed to reconstruct and correlate spatial representations across patches.
- **Spectral Channel Adapter**: While SatViT natively supports 15-channel multi-spectral remote-sensing data (such as Sentinel-2 bands), TerraViT's channel adaptation layer seamlessly handles standard 3-channel RGB optical imagery by repeating and aligning bands to the expected tensor dimensions.
- **Latent Difference Engine**: Change detection is derived by calculating the Euclidean norm of per-patch decoder representations between before and after temporal passes, producing a continuous spatial change intensity map.

### Supported Model Variants

| Specification | SatViT V1 | SatViT V2 (Default) |
|---|---|---|
| **Patch Size** | 16 × 16 | 8 × 8 |
| **Number of Patches** | 256 | 1 024 |
| **Spatial Detail** | Broad regional | Fine localized |
| **Encoder Depth / Dim** | 12 layers / 768 dim | 12 layers / 768 dim |
| **Encoder Heads** | 12 heads | 12 heads |
| **Decoder Depth / Dim** | 2 layers / 384 dim | 1 layer / 512 dim |
| **Decoder Heads** | 6 heads | 8 heads |
| **Input Channels** | 15 | 15 |

---

## License

This project is open source and available under the terms of the [MIT License](LICENSE).
