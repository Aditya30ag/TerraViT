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

        # Basic preprocessing assumptions (you can tune these later)
        self._transform = transforms.Compose(
            [
                transforms.Resize((224, 224)),
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

    def _preprocess(self, image: Image.Image) -> torch.Tensor:
        """Preprocess a PIL image into a model-ready tensor batch."""
        img = image.convert("RGB")
        tensor = self._transform(img).unsqueeze(0)  # shape: [1, C, H, W]
        return tensor.to(self._device)

    def predict(self, image: Image.Image) -> Dict[str, Any]:
        """Run inference and return a generic prediction dictionary.

        Note: This uses softmax over the first dimension of the model output.
        You should adapt this to your exact TerraViT head (e.g. regression, multi-label, etc.).
        """
        if self._model is None:
            self.load()

        input_tensor = self._preprocess(image)

        with torch.no_grad():
            output = self._model(input_tensor)

        # If the model returns a tensor of class logits, expose top class and scores
        if isinstance(output, torch.Tensor):
            # Assume output shape [1, num_classes] or [num_classes]
            logits = output.view(-1)
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
