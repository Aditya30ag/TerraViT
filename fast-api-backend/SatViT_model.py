import torch
from torch import nn, einsum
from einops import rearrange
import numpy as np


# --------------------------------------------------------
# POSITION EMBEDDINGS ###
# --------------------------------------------------------

def get_2d_sincos_pos_embed(embed_dim, grid_size, cls_token=False):
    """
    grid_size: int of the grid height and width
    return:
    pos_embed: [grid_size*grid_size, embed_dim] or [1+grid_size*grid_size, embed_dim] (w/ or w/o cls_token)
    """
    grid_h = np.arange(grid_size, dtype=np.float32)
    grid_w = np.arange(grid_size, dtype=np.float32)
    grid = np.meshgrid(grid_w, grid_h)  # here w goes first
    grid = np.stack(grid, axis=0)

    grid = grid.reshape([2, 1, grid_size, grid_size])
    pos_embed = get_2d_sincos_pos_embed_from_grid(embed_dim, grid)
    if cls_token:
        pos_embed = np.concatenate([np.zeros([1, embed_dim]), pos_embed], axis=0)
    return pos_embed


def get_2d_sincos_pos_embed_from_grid(embed_dim, grid):
    assert embed_dim % 2 == 0

    # use half of dimensions to encode grid_h
    emb_h = get_1d_sincos_pos_embed_from_grid(embed_dim // 2, grid[0])  # (H*W, D/2)
    emb_w = get_1d_sincos_pos_embed_from_grid(embed_dim // 2, grid[1])  # (H*W, D/2)

    emb = np.concatenate([emb_h, emb_w], axis=1) # (H*W, D)
    return emb


def get_1d_sincos_pos_embed_from_grid(embed_dim, pos):
    """
    embed_dim: output dimension for each position
    pos: a list of positions to be encoded: size (M,)
    out: (M, D)
    """
    assert embed_dim % 2 == 0
    omega = np.arange(embed_dim // 2, dtype=np.float64)
    omega /= embed_dim / 2.
    omega = 1. / 10000**omega  # (D/2,)

    pos = pos.reshape(-1)  # (M,)
    out = np.einsum('m,d->md', pos, omega)  # (M, D/2), outer product

    emb_sin = np.sin(out) # (M, D/2)
    emb_cos = np.cos(out) # (M, D/2)

    emb = np.concatenate([emb_sin, emb_cos], axis=1)  # (M, D)
    return emb


# --------------------------------------------------------
# MODEL ###
# --------------------------------------------------------

class FFN(nn.Module):
    def __init__(self,
                 dim,
                 mult=4,
                 dropout=0.,
                 ):
        """
        FFN (FeedForward Network)
        :param dim: model dimension (number of features)
        :param mult: multiply the model dimension by mult to get the FFN's inner dimension
        :param dropout: dropout between 0 and 1
        """
        super().__init__()
        inner_dim = int(dim * mult)

        self.net = nn.Sequential(
            nn.Linear(dim, inner_dim),  # (BSZ, num_patches, inner_dim)
            nn.GELU(),  # (BSZ, num_patches, inner_dim)
            nn.Dropout(dropout),  # (BSZ, num_patches, inner_dim)
            nn.Linear(inner_dim, dim)  # (BSZ, num_patches, dim)
        )
        self.input_norm = nn.LayerNorm(dim)

    def forward(self, x):
        x = self.input_norm(x)  # (BSZ, num_patches, dim)
        return self.net(x)  # (BSZ, num_patches, dim)


class Attention(nn.Module):
    def __init__(self,
                 dim,
                 num_heads=8,
                 dropout=0.,
                 ):
        """
        Self-Attention module
        :param dim: model dimension (number of features)
        :param num_heads: number of attention heads
        :param dropout: dropout between 0 and 1
        """
        super().__init__()
        self.num_heads = num_heads
        assert dim % num_heads == 0, 'dim must be evenly divisible by num_heads'
        dim_head = int(dim / num_heads)
        self.scale = dim_head ** -0.5

        self.to_qkv = nn.Linear(dim, dim * 3, bias=False)
        self.to_out = nn.Linear(dim, dim)
        self.input_norm = nn.LayerNorm(dim)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x):
        x = self.input_norm(x)  # (BSZ, num_patches, dim)
        q, k, v = self.to_qkv(x).chunk(3, dim=-1)  # (BSZ, num_patches, dim)
        q, k, v = map(lambda t: rearrange(t, 'b n (h d) -> b h n d', h=self.num_heads), (q, k, v))  # (BSZ, num_heads, num_patches, dim_head)

        attention_scores = einsum('b h i d, b h j d -> b h i j', q, k) * self.scale  # (BSZ, num_heads, num_patches, num_patches)

        attn = attention_scores.softmax(dim=-1)  # (BSZ, num_heads, num_patches, num_patches)
        attn = self.dropout(attn)  # (BSZ, num_heads, num_patches, num_patches)

        out = einsum('b h i j, b h j d -> b h i d', attn, v)  # (BSZ, num_heads, num_patches, dim_head)
        out = rearrange(out, 'b h n d -> b n (h d)')  # (BSZ, num_patches, dim)
        return self.to_out(out)  # (BSZ, num_patches, dim)


class BaseTransformer(nn.Module):
    def __init__(self,
                 dim,
                 depth,
                 num_heads=8,
                 attn_dropout=0.,
                 ff_dropout=0.,
                 ff_mult=4,
                 ):
        super().__init__()
        self.layers = nn.ModuleList([])
        for _ in range(depth):
            self.layers.append(nn.ModuleList([
                Attention(dim=dim, num_heads=num_heads, dropout=attn_dropout),
                FFN(dim=dim, mult=ff_mult, dropout=ff_dropout),
            ]))

        self.norm_out = nn.LayerNorm(dim)

    def forward(self, x):
        for self_attn, ffn in self.layers:
            x = self_attn(x) + x  # (BSZ, num_patches, dim)
            x = ffn(x) + x  # (BSZ, num_patches, dim)

        return self.norm_out(x)  # (BSZ, num_patches, dim)


# --------------------------------------------------------
# SatViT Model
# --------------------------------------------------------

class SatViT(nn.Module):
    def __init__(self,
                 io_dim=3840,
                 num_patches=256,
                 encoder_dim=768,
                 encoder_depth=12,
                 encoder_num_heads=16,
                 decoder_dim=384,
                 decoder_depth=2,
                 decoder_num_heads=6,
                 ):
        super().__init__()

        # Input data config
        self.encoder_dim = encoder_dim
        self.num_patches = num_patches
        self.encoder_dim = encoder_dim

        # The encoder is our main model. During inference the decoder won't likely even be used.
        self.encoder = BaseTransformer(dim=encoder_dim,
                                       depth=encoder_depth,
                                       num_heads=encoder_num_heads,
                                       )

        # Mask embeddings are used in the decoder (these are the locations the decoder will predict the input)
        # These are the grey blocks in Figure 1 (https://arxiv.org/pdf/2111.06377.pdf)
        self.mask_token = nn.Parameter(torch.zeros(1, 1, decoder_dim))

        # If the encoder and decoder have different model widths (dim) we need to apply a linear projection from the
        # encoder to the decoder. If the models have equal width, no projection is needed.
        self.enc_to_dec = nn.Linear(encoder_dim, decoder_dim)

        self.decoder = BaseTransformer(dim=decoder_dim,
                                       depth=decoder_depth,
                                       num_heads=decoder_num_heads,
                                       )

        # Setup position embeddings
        self.pos_embed = nn.Parameter(torch.zeros(1, num_patches, encoder_dim), requires_grad=False)  # fixed sin-cos embedding
        self.decoder_pos_embed = nn.Parameter(torch.zeros(1, num_patches, decoder_dim), requires_grad=False)  # fixed sin-cos embedding

        pos_embed = get_2d_sincos_pos_embed(self.pos_embed.shape[-1], int(num_patches**.5), cls_token=False)
        self.pos_embed.data.copy_(torch.from_numpy(pos_embed).float().unsqueeze(0))

        decoder_pos_embed = get_2d_sincos_pos_embed(self.decoder_pos_embed.shape[-1], int(num_patches**.5), cls_token=False)
        self.decoder_pos_embed.data.copy_(torch.from_numpy(decoder_pos_embed).float().unsqueeze(0))

        # Input and output maps
        self.linear_input = nn.Linear(io_dim, encoder_dim)
        self.linear_output = nn.Linear(decoder_dim, io_dim)
        self.norm_pix_loss = True

    def random_masking(self, x, mask_ratio):
        """
        Perform per-sample random masking by per-sample shuffling.
        Per-sample shuffling is done by argsort random noise.
        x: [N, L, D], sequence
        """
        N, L, D = x.shape  # batch, length, dim
        len_keep = int(L * (1 - mask_ratio))

        noise = torch.rand(N, L, device=x.device)  # noise in [0, 1]

        # sort noise for each sample
        ids_shuffle = torch.argsort(noise, dim=1)  # ascend: small is keep, large is remove
        ids_restore = torch.argsort(ids_shuffle, dim=1)

        # keep the first subset
        ids_keep = ids_shuffle[:, :len_keep]
        x_masked = torch.gather(x, dim=1, index=ids_keep.unsqueeze(-1).repeat(1, 1, D))

        # generate the binary mask: 0 is keep, 1 is remove
        mask = torch.ones([N, L], device=x.device)
        mask[:, :len_keep] = 0
        # unshuffle to get the binary mask
        mask = torch.gather(mask, dim=1, index=ids_restore)

        return x_masked, mask, ids_restore

    def forward_encoder(self, x, mask_ratio):
        # x should already come ready for the encoder, i.e. be of shape (bsz, seq, io_dim)
        # add pos embed
        x = self.linear_input(x) + self.pos_embed  # (bsz, seq, encoder_dim)

        # masking: length -> length * mask_ratio
        x, mask, ids_restore = self.random_masking(x, mask_ratio)

        # apply Transformer blocks
        x = self.encoder(x)

        return x, mask, ids_restore

    def forward_decoder(self, x, ids_restore):
        # embed tokens
        x = self.enc_to_dec(x)

        # append mask tokens to sequence
        mask_tokens = self.mask_token.repeat(x.shape[0], ids_restore.shape[1] + 1 - x.shape[1], 1)
        x = torch.cat([x, mask_tokens], dim=1)
        x = torch.gather(x, dim=1, index=ids_restore.unsqueeze(-1).repeat(1, 1, x.shape[2]))  # unshuffle

        # add pos embed
        x = x + self.decoder_pos_embed

        # apply Transformer blocks
        x = self.decoder(x)

        # predictor projection
        return self.linear_output(x)

    def forward_loss(self, imgs, pred, mask):
        if self.norm_pix_loss:
            mean = imgs.mean(dim=-1, keepdim=True)
            var = imgs.var(dim=-1, keepdim=True)
            imgs = (imgs - mean) / (var + 1.e-6)**.5

        loss = (pred - imgs) ** 2
        loss = loss.mean(dim=-1)  # [N, L], mean loss per patch

        loss = (loss * mask).sum() / mask.sum()  # mean loss on removed patches
        return loss

    def encode(self, images_patches):
        """
        We encode full images (i.e., no masking) by linearly projecting image patches, adding position embeddings,
        then encoding these inputs with our MAE encoder. This function will be used during fine-tuning and inference.
        """
        patch_encodings = self.linear_input(images_patches) + self.pos_embed  # (BSZ, num_patches, encoder_dim)
        return self.encoder(patch_encodings)

    def forward(self, patch_encodings, mask_ratio=0.75):
        latent, mask, ids_restore = self.forward_encoder(patch_encodings, mask_ratio)
        pred = self.forward_decoder(latent, ids_restore)  # [N, L, p*p*3]
        loss = self.forward_loss(patch_encodings, pred, mask)
        return loss, pred, mask
