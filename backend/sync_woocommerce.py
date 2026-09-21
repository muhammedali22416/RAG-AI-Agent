import os
import requests
from dotenv import load_dotenv
from database import supabase

load_dotenv()

WC_URL = os.getenv("WC_URL")
WC_KEY = os.getenv("WC_CONSUMER_KEY")
WC_SECRET = os.getenv("WC_CONSUMER_SECRET")

def fetch_wc_products(page=1, per_page=50):
    url = f"{WC_URL}/wp-json/wc/v3/products"
    params = {
        "consumer_key": WC_KEY,
        "consumer_secret": WC_SECRET,
        "page": page,
        "per_page": per_page,
        "status": "publish"
    }
    res = requests.get(url, params=params)
    res.raise_for_status()
    return res.json()

def sync_products():
    page = 1
    total_synced = 0
    while True:
        products = fetch_wc_products(page=page)
        if not products:
            break

        for p in products:
            supabase.table("products").upsert({
                "wc_id": p["id"],
                "name": p["name"],
                "category": p["categories"][0]["name"] if p["categories"] else "General",
                "price": float(p["price"]) if p["price"] else 0,
                "stock": p["stock_quantity"] if p["stock_quantity"] is not None else 0,
                "description": p["short_description"] or p["description"],
                "specs": {"permalink": p["permalink"]},
                "image_url": p["images"][0]["src"] if p["images"] else None
            }, on_conflict="wc_id").execute()
            total_synced += 1

        page += 1

    print(f"Synced {total_synced} products from WooCommerce")

if __name__ == "__main__":
    sync_products()