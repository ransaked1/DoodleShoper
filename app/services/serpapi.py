from serpapi import GoogleSearch
from conf.config import Config

# Build the image payload for the Google Lens API request
def build_payload_img(img_url, num):
    payload = {
        'api_key': Config.app_settings.get('serpapi_key'),
        'engine': 'google_lens',
        'url': img_url,
        'hl': 'en',
        'country': 'gb'
    }

    return payload

def reverse_image_search(img_url, num):
    search = GoogleSearch(build_payload_img(img_url, num))
    google_lens_results = search.get_json()

    # Extract links for specified number of products
    product_links = [item['link'] for item in google_lens_results['visual_matches'][:num]]

    # Join the links into a string
    links_string = ', '.join(product_links)

    return links_string