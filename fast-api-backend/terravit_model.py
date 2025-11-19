import os
from typing import Any, Dict

import torch
from PIL import Image
from torchvision import transforms
from einops import rearrange

from SatViT_model import SatViT


class TerraViTModel:
    """Wrapper around the TerraViT Vision Transformer model weights."""

    def __init__(self) -> None:
        self._model = None
        self._device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        # Default to SatViT_V2.pt, but allow override via env var
        self._weights_path = os.getenv("TERRAVIT_WEIGHTS_PATH", "SatViT_V2.pt")

        # Store model-specific patch configuration once weights are known
        self._patch_hw: int | None = None
        self._num_patches: int | None = None
        self._num_channels: int | None = None

        # Basic RGB preprocessing before patchifying (resize + normalize)
        self._rgb_transform = transforms.Compose(
            [
                transforms.ToTensor(),
                transforms.Normalize(
                    mean=[0.485, 0.456, 0.406],
                    std=[0.229, 0.224, 0.225],
                ),
            ]
        )

    @property
    def device_str(self) -> str:
        return str(self._device)

    @property
    def is_loaded(self) -> bool:
        return self._model is not None

    def load(self) -> None:
        """Load the model weights into memory if not already loaded."""
        if self._model is not None:
            return

        if not os.path.exists(self._weights_path):
            raise RuntimeError(f"Model weights not found at '{self._weights_path}'")

        # Determine hyperparameters based on model version
        if "V1" in self._weights_path:
            # SatViT-V1 hyperparameters
            patch_hw = 16
            num_patches = 256
            encoder_dim = 768
            encoder_depth = 12
            encoder_num_heads = 12
            decoder_dim = 384
            decoder_depth = 2
            decoder_num_heads = 6
        else:
            # SatViT-V2 hyperparameters (default)
            patch_hw = 8
            num_patches = 1024
            encoder_dim = 768
            encoder_depth = 12
            encoder_num_heads = 12
            decoder_dim = 512
            decoder_depth = 1
            decoder_num_heads = 8

        num_channels = 15
        io_dim = int(patch_hw * patch_hw * num_channels)

        # Cache config for preprocessing helpers
        self._patch_hw = patch_hw
        self._num_patches = num_patches
        self._num_channels = num_channels

        # Instantiate the SatViT model architecture
        model = SatViT(
            io_dim=io_dim,
            num_patches=num_patches,
            encoder_dim=encoder_dim,
            encoder_depth=encoder_depth,
            encoder_num_heads=encoder_num_heads,
            decoder_dim=decoder_dim,
            decoder_depth=decoder_depth,
            decoder_num_heads=decoder_num_heads,
        )

        # Load the state_dict from the checkpoint
        state_dict = torch.load(self._weights_path, map_location=self._device)
        model.load_state_dict(state_dict)

        # Move to device and set to evaluation mode
        model.to(self._device)
        model.eval()
        self._model = model

    def _image_to_patches(self, image: Image.Image) -> torch.Tensor:
        """Convert a PIL image into SatViT patch tensor [1, num_patches, io_dim].

        The original SatViT was trained on multi-channel (e.g. Sentinel) data.
        For generic RGB uploads, we adapt by repeating / trimming channels to
        match the expected ``num_channels`` and then patchifying.
        """

        if self._patch_hw is None or self._num_patches is None or self._num_channels is None:
            raise RuntimeError("Model configuration not initialized; call load() first.")

        # Compute side length so that H=W=patch_hw*sqrt(num_patches)
        grid_size = int(self._num_patches ** 0.5)
        side = self._patch_hw * grid_size

        img = image.convert("RGB").resize((side, side))
        tensor = self._rgb_transform(img).unsqueeze(0).to(self._device)  # [1, 3, H, W]

        # Adjust channel count to expected num_channels (e.g. 15)
        c = tensor.shape[1]
        if c < self._num_channels:
            reps = (self._num_channels + c - 1) // c
            tensor = tensor.repeat(1, reps, 1, 1)
            tensor = tensor[:, : self._num_channels]
        elif c > self._num_channels:
            tensor = tensor[:, : self._num_channels]

        # Patchify: [B, C, H, W] -> [B, num_patches, patch_hw*patch_hw*num_channels]
        patches = tensor.unfold(2, self._patch_hw, self._patch_hw).unfold(3, self._patch_hw, self._patch_hw)
        # shape: [B, C, grid_h, grid_w, patch_hw, patch_hw]
        patches = patches.contiguous().view(
            1,
            self._num_channels,
            grid_size * grid_size,
            self._patch_hw,
            self._patch_hw,
        )
        patches = patches.permute(0, 2, 1, 3, 4).contiguous()  # [B, num_patches, C, ph, pw]
        patches = patches.view(1, self._num_patches, -1)  # [B, num_patches, io_dim]

        return patches

    def _image_logits(self, image: Image.Image) -> torch.Tensor:
        """Run SatViT on an image and return a 1D logits vector.

        We use the MAE decoder output averaged over patches as a simple
        per-dimension logit representation suitable for downstream tasks
        like classification or change detection.
        """

        if self._model is None:
            self.load()

        patches = self._image_to_patches(image)

        with torch.no_grad():
            loss, pred, mask = self._model(patches, mask_ratio=0.0)  # type: ignore[misc]

        # Aggregate over patches -> [io_dim]
        logits = pred.mean(dim=1).view(-1)
        return logits

    def predict(self, image: Image.Image) -> Dict[str, Any]:
        """Run inference and return a generic prediction dictionary.

        Note: This uses softmax over the first dimension of the model output.
        You should adapt this to your exact TerraViT head (e.g. regression, multi-label, etc.).
        """
        # Use the helper that maps images -> SatViT patch space -> logits
        logits = self._image_logits(image)

        probs = torch.softmax(logits, dim=0)
        top_prob, top_idx = torch.max(probs, dim=0)

        return {
            "top_class_index": int(top_idx.item()),
            "top_class_score": float(top_prob.item()),
            "raw_scores": probs.cpu().tolist(),
            "raw_output": None,
        }

        # Fallback: just stringify whatever the model returned
        return {
            "top_class_index": None,
            "top_class_score": None,
            "raw_scores": None,
            "raw_output": str(output),
        }


terravit_model = TerraViTModel()
