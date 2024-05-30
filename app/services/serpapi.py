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

def reverse_image_search(sketch_url, img_url, num):
    search = GoogleSearch(build_payload_img(img_url, num))
    google_lens_results = search.get_json()

    # Filter out items without the "price" field and extract links with titles and thumbnails
    products_with_price = [(item['title'][:20] + '...' if len(item['title'].split()) > 20 else item['title'], 
                            item['link'], item['thumbnail']) 
                           for item in google_lens_results['visual_matches'][:num] if 'price' in item]

    # Format the title and link pair as "title: link" and join them into a string
    links_string = ', '.join([f"{title}: {link}" for title, link, _ in products_with_price])

    thumbnails_string = ', '.join([thumbnail for _, _, thumbnail in products_with_price])

    return "sketch: {}, image: {}, links: {}, thumbnails: {}".format(sketch_url, img_url, links_string, thumbnails_string)