import requests
import logging

from conf.config import Config
from common.constants import *

url = Config.app_settings.get('sd_address')

def build_payload(prompt, base64_img):
    # A1111 payload
    payload = {
        "prompt": prompt,
        "negative_prompt": "",
        "batch_size": 1,
        "steps": 20,
        "cfg_scale": 7,
        "alwayson_scripts": {
            "controlnet": {
                "args": [
                    {
                        "input_image": base64_img,
                        "module": STABLE_DIFFUSION_MODULE,
                        "model": STABLE_DIFFUSION_MODEL,
                    }
                ]
            }
        }
    }

def generate_image_stable_diffusion(prompt, base64_img):

    logging.info(f"Searching for image with prompt: {prompt}\n")

    payload = build_payload(prompt, base64_img)

    logging.info(f"Sending to {url}/sdapi/v1/txt2img")

    # Trigger Generation
    response = requests.post(url=f'{url}/sdapi/v1/txt2img', json=payload)

    # Read results
    r = response.json()
    result = r['images'][0]
    
    return result.split(",", 1)[0]