import os
from typing import Optional
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.tools import tool
from tools import search_products, get_store_policy, add_to_cart, get_categories
from collections import defaultdict
from database import supabase

def supabase_get_wc_id(product_id: str):
    result = supabase.table("products").select("wc_id").eq("id", product_id).execute()
    return result.data[0] if result.data else None

session_store = defaultdict(list)

load_dotenv()

@tool
def search_products_tool(query: str, max_price: Optional[float] = None):
    """Search store products by name/category/description, optionally filtered by max price."""
    return search_products(query, max_price)

@tool
def get_store_policy_tool(query: str):
    """Get store policy info (shipping, warranty, returns) relevant to the query."""
    return get_store_policy(query)

@tool
def add_to_cart_tool(product_id: str, quantity: int = 1):
    """Add a product to the current user's cart using its product_id (get this from search_products_tool results)."""
    return {"pending_product_id": product_id, "pending_quantity": quantity}

tools = [search_products_tool, get_store_policy_tool, add_to_cart_tool]

llm = ChatGroq(
    model="openai/gpt-oss-120b",
    groq_api_key=os.getenv("GROQ_API_KEY"),
    temperature=0.5
)

llm_with_tools = llm.bind_tools(tools)

def build_system_prompt():
    categories = get_categories()
    categories_text = ", ".join(categories) if categories else "N/A"

    return f"""Tum TechStore ke ek friendly, expert sales assistant ho.

STORE CATEGORIES (available abhi store me):
{categories_text}

Jab user koi generic term use kare (jaise "mobile", "phone", "watch"), tum khud samajhdari se sahi category se match karo in list me se (jaise "mobile"/"phone" → "Android Smartphones", "iPhones", "Fold Smartphones"). search_products_tool ko us sahi/specific term ke sath call karo, user ke exact generic word se nahi.

LANGUAGE RULES (sabse zaroori):
- Hamesha Roman Urdu me jawab do — matlab Urdu/Hindi English alphabet me likhi hui (jaise "aapko kya chahiye?", "ye product acha hai").
- Kabhi bhi Devanagari (Hindi script) ya Urdu script use mat karo.
- Sirf tab pure English me jawab do jab user khud pure English me likhe.
- Casual, dosana lehja rakho, salesman jaisa — halka formal, halka friendly.

GROUNDEDNESS RULES (kabhi mat todna):
- Sirf wahi products mention karo jo search_products_tool ne actually return kiye hain. Naam, price, specs — sab tool ke result se hi lo.
- Agar tool koi product return na kare ya category available na ho, saaf keh do "abhi ye category humare paas available nahi hai" — kabhi apni taraf se product ya spec mat banao.
- Policy (shipping/warranty/return) ke sawal ka jawab sirf get_store_policy_tool ke result se do. Agar result me relevant info na mile, keh do "iski exact detail abhi mere paas nahi hai, aap humari support team se confirm kar lein."
- Kabhi bhi price, stock, ya specs guess ya approximate mat karo.
- Cart me add karne se pehle pehle search_products_tool se sahi product_id nikalo, phir add_to_cart_tool ko wahi product_id do. user_id tumhe khud dena/pochna nahi hai, wo system khud handle karta hai.

SALESMAN BEHAVIOR:
- Customer ka budget aur zaroorat samajhne ki koshish karo agar clear na ho.
- Relevant products suggest karo tool results se, aur unko cart me add karne ka offer do.
- Jawab zyada lamba na ho — clear aur to-the-point rakho, product list ho to bullet points me do."""

def run_agent(user_message: str, user_id: str = "guest"):
    tool_map = {
        "search_products_tool": search_products_tool,
        "get_store_policy_tool": get_store_policy_tool,
    }

    history = session_store[user_id]
    messages = [{"role": "system", "content": build_system_prompt()}] + history
    messages.append({"role": "user", "content": user_message})

    last_products = []
    cart_action = None

    max_iterations = 5
    for _ in range(max_iterations):
        ai_msg = llm_with_tools.invoke(messages)
        messages.append(ai_msg)

        if not ai_msg.tool_calls:
            history.append({"role": "user", "content": user_message})
            history.append({"role": "assistant", "content": ai_msg.content})
            session_store[user_id] = history[-20:]
            return {"reply": ai_msg.content, "products": last_products, "cart_action": cart_action}

        for call in ai_msg.tool_calls:
            args = call["args"]
            if call["name"] == "add_to_cart_tool":
                try:
                    result = add_to_cart(user_id, args["product_id"], args.get("quantity", 1))
                    if isinstance(result, list) and result:
                        product = supabase_get_wc_id(args["product_id"])
                        if product:
                            cart_action = {"wc_id": product["wc_id"], "quantity": args.get("quantity", 1)}
                except Exception as e:
                    result = f"Error: {str(e)}"
            else:
                tool_fn = tool_map[call["name"]]
                try:
                    result = tool_fn.invoke(args)
                    if call["name"] == "search_products_tool" and isinstance(result, list):
                        last_products = result
                except Exception as e:
                    result = f"Error: {str(e)}"
            messages.append({
                "role": "tool",
                "content": str(result),
                "tool_call_id": call["id"]
            })

    return {"reply": "Sorry, thoda issue ho gaya. Dobara try karein.", "products": [], "cart_action": None}