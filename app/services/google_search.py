import requests
import logging
import uuid

from conf.config import Config
from common.error import InternalError

from services.cloudinary import init_cloudinary, upload_image_web, destroy_image_web
from services.serpapi import reverse_image_search

# Build the text payload for the Google Search API request
def build_payload_text(query, start=1, num=5, websites=None, **params):
    payload = {
        'searchType': 'image',
        'key': Config.app_settings.get('google_api_key'),
        'cx': Config.app_settings.get('google_engine_id'),
        'q': query,
        'start': start,
        'num': num
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

def fetch_search_results_img(img_base64, num=5, websites=None):
    logging.info(f'Making google image search')

    img_uuid = uuid.uuid4().hex

    init_cloudinary()

    img_url = upload_image_web(img_base64, img_uuid)

    search_results_string = reverse_image_search(img_url, num)

    # destroy_image_web(img_uuid)

    logging.info(f'Results: {search_results_string}')
    return search_results_string