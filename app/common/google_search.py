import requests
import logging
import json
import uuid

import cloudinary
import cloudinary.uploader

from conf.config import Config
from common.error import InternalError

# Build the text payload for the Google Search API request
def build_payload_text(query, start=1, num=5, websites=None, **params):

    payload = {
        'key': Config.app_settings.get('google_api_key'),
        'cx': Config.app_settings.get('google_engine_id'),
        'q': query,
        'start': start,
        'num': num
    }

    payload.update(params)
    return payload

# Build the image payload for the Google Search API request
def build_payload_img(img_base64, start=1, num=5, websites=None, **params):

    payload = {
        'key': Config.app_settings.get('google_api_key'),
        'cx': Config.app_settings.get('google_engine_id'),
        'q': 'image',
        "imgUrl": "data:image/png;base64," + img_base64,
        'start': start,
        'num': num,
        'searchType': 'image',
        'imgType': 'photo',
        'imgColorType': 'color',
        'imgSize': 'large'
    }

    payload.update(params)
    return payload

def fetch_search_results_text(query, start=1, num=5, websites=None):
    logging.info(f'Making google search for: {query}...')

    # Perform the search
    response = requests.get('https://www.googleapis.com/customsearch/v1', params=build_payload_text(query, start, num, websites))

    if response.status_code != 200:
        raise InternalError([{"message": f"Google Search API failed: {response.text}"}])

    # Extract the URLs
    search_result_urls = [item['link'] for item in response.json().get('items', [])]

    # Convert the list of URLs to a string
    search_results_string = ', '.join(search_result_urls)

    logging.info(f'Results: {search_results_string}')
    return search_results_string

def ini_cloudinary():
    cloudinary.config( 
        cloud_name = Config.app_settings.get('cloudinary_name'), 
        api_key = Config.app_settings.get('cloudinary_key'), 
        api_secret = Config.app_settings.get('cloudinary_secret')
    )

def upload_image_web(img_base64, img_uuid):
    cloudinary.uploader.upload(f"data:image/png;base64,{img_base64}", public_id=img_uuid)
    img_url = f"https://res.cloudinary.com/{Config.app_settings.get('cloudinary_name')}/image/upload/v1710862572/{img_uuid}.png"
    logging.info("Uploaded image to cloudinary with uuid: {} and url: {}".format(img_uuid, img_url))
    return img_url

def destroy_image_web(img_uuid):
    cloudinary.uploader.destroy(img_uuid)
    logging.info("Destroyed image from cloudinary with uuid: {}".format(img_uuid),)

def reverse_image_search(img_url):
    return None

def fetch_search_results_img(img_base64, start=1, num=5, websites=None):
    logging.info(f'Making google image search')

    img_uuid = uuid.uuid4().hex

    ini_cloudinary()

    img_url = upload_image_web(img_base64, img_uuid)

    search_results = reverse_image_search(img_url)

    destroy_image_web(img_uuid)

    # logging.info(f'Results: {search_results_string}')
    return search_results