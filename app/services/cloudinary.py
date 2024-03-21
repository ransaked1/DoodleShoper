import cloudinary
import cloudinary.uploader
import logging

from conf.config import Config

def init_cloudinary():
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