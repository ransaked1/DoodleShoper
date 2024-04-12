import requests
import logging

from conf.config import Config
from common.constants import *

url = Config.app_settings.get('sd_address')

def build_payload(prompt, base64_img):
    # A1111 payload
    payload = {
        "prompt": prompt + ", high resolution, photorealistic, high detail. white background",
        "negative_prompt": "low resolution, cropped",
        "sampler_name": "DPM++ 2M Karras",
        "batch_size": 1,
        "steps": 20,
        "cfg_scale": 7,
        "alwayson_scripts": {
            "controlnet": {
                "args": [
                    {
                        "input_image": base64_img,
                        "model": "control_v11p_sd15_scribble [d4ba51ff]",
                        "module": "invert (from white bg & black line)",
                        "weight": 1.5,
                        "resize_mode": "Just Resize"
                    }
                ]
            }
        }
    }

    return payload

def generate_image_stable_diffusion(prompt, base64_img):

    logging.info(f"Searching for image with prompt: {prompt}")

    payload = build_payload(prompt, base64_img)

    logging.info(f"Sending to {url}/sdapi/v1/txt2img")

    # Trigger Generation
    response = requests.post(url=f'{url}/sdapi/v1/txt2img', json=payload)

    # Read results
    r = response.json()
    result = r['images'][0]
    
    return result.split(",", 1)[0]