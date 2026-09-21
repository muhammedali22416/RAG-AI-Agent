import os
from dotenv import load_dotenv
from huggingface_hub import InferenceClient

load_dotenv()

client = InferenceClient(provider="hf-inference", api_key=os.getenv("HF_TOKEN"))

def get_embedding(text: str):
    result = client.feature_extraction(
        text, model="sentence-transformers/all-MiniLM-L6-v2"
    )
    vector = result.tolist()
    if vector and isinstance(vector[0], list):
        vector = vector[0]
    return vector