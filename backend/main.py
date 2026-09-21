from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agent import run_agent

app = FastAPI(title="TechStore AI Sales Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    user_id: str = "guest"

@app.get("/")
def root():
    return {"status": "TechStore AI Sales Agent running"}

@app.post("/chat")
def chat(req: ChatRequest):
    result = run_agent(req.message, req.user_id)
    return result