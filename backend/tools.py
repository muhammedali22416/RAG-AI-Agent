from typing import Optional
from database import supabase
from embeddings import get_embedding

def search_products(query: str, max_price: Optional[float] = None):
    base_cols = "id, name, category, price, stock, description, image_url"

    def apply_price(q):
        return q.lte("price", max_price) if max_price else q

    result = {"data": []}
    if query:
        q = supabase.table("products").select(base_cols)
        q = apply_price(q)
        q = q.or_(f"name.ilike.%{query}%,category.ilike.%{query}%,description.ilike.%{query}%")
        result = q.limit(10).execute()

    if not result.data:
        fallback_q = supabase.table("products").select(base_cols)
        fallback_q = apply_price(fallback_q)
        result = fallback_q.limit(10).execute()

    products = result.data or []
    for p in products:
        if p.get("description") and len(p["description"]) > 150:
            p["description"] = p["description"][:150] + "..."

    return products

def get_categories():
    result = supabase.table("products").select("category").execute()
    categories = sorted(set(p["category"] for p in result.data if p.get("category")))
    return categories

def get_store_policy(query: str):
    embedding = get_embedding(query)
    result = supabase.rpc("match_document_chunks", {
        "query_embedding": embedding,
        "match_threshold": 0.3,
        "match_count": 3
    }).execute()
    return result.data

def add_to_cart(user_id: str, product_id: str, quantity: int = 1):
    product = supabase.table("products").select("stock, name").eq("id", product_id).execute()
    if not product.data:
        return {"error": "Product not found"}

    stock = product.data[0]["stock"]
    name = product.data[0]["name"]

    if stock <= 0:
        return {"error": f"{name} is currently out of stock"}
    if quantity > stock:
        return {"error": f"Only {stock} units of {name} available"}

    result = supabase.table("cart_items").insert({
        "user_id": user_id,
        "product_id": product_id,
        "quantity": quantity
    }).execute()
    return result.data