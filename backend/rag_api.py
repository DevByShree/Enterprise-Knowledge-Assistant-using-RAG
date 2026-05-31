from fastapi import FastAPI
from pydantic import BaseModel
from backend.rag_pipeline import ask_rag
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "RAG API is running"}

class ChatRequest(BaseModel):
    query: str

@app.post("/chat")
async def chat(data: ChatRequest):

    answer = ask_rag(data.query)

    return {"answer": answer}