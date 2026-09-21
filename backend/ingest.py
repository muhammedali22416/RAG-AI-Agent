import os
from database import supabase
from embeddings import get_embedding

DATA_DIR = "data"

def chunk_text(text, chunk_size=300):
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size):
        chunks.append(" ".join(words[i:i+chunk_size]))
    return chunks

def ingest_documents():
    for filename in os.listdir(DATA_DIR):
        if filename.endswith(".txt"):
            path = os.path.join(DATA_DIR, filename)
            with open(path, "r", encoding="utf-8") as f:
                text = f.read()

            chunks = chunk_text(text)
            for chunk in chunks:
                embedding = get_embedding(chunk)
                supabase.table("document_chunks").insert({
                    "document_name": filename,
                    "content": chunk,
                    "embedding": embedding
                }).execute()
            print(f"Ingested {filename} ({len(chunks)} chunks)")

if __name__ == "__main__":
    ingest_documents()