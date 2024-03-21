from serpapi import GoogleSearch
from services.google_search import build_payload_img

def reverse_image_search(img_url, num):
    search = GoogleSearch(build_payload_img(img_url, num))
    google_lens_results = search.get_json()

    # Extract links for specified number of products
    product_links = [item['link'] for item in google_lens_results['visual_matches'][:num]]

    # Join the links into a string
    links_string = ', '.join(product_links)

    return links_string