"""This module defines project-level constants."""

TEXT_CONVERSATION = "text"
MIXED_CONVERSATION = "mixed"
SKETCH_CONVERSATION = "sketch"

CREDENTIALS_ERROR_MESSAGE = "Could not validate credentials"
INVALID_USER_PASS_MESSAGE = "Invalid username or password"

STABLE_DIFFUSION_PATH = "/sdapi/v1/txt2img"
STABLE_DIFFUSION_MODEL="control_v11p_sd15_scribble [d4ba51ff]"
STABLE_DIFFUSION_MODULE="invert (from white bg & black line)"
STABLE_DIFFUSION_SAMPLER="Euler a"
STABLE_DIFFUSION_CONTROL_WEIGHT=1.3
STABLE_DIFFUSION_RESIZE_MODE="Just Resize"
STABLE_DIFFUSION_CONTROL_MODE="My prompt is more important"