import os
from contextlib import asynccontextmanager
from typing import List, Literal, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI
from datasets import load_dataset
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# -----------------------------
# Global State
# -----------------------------
state = {
    "prompts": [],
    "responses": [],
    "prompt_embeddings": None,
    "embedder": None,
    "client": None
}

# -----------------------------
# Lifespan (Startup/Shutdown)
# -----------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Load Config
    load_dotenv()
    HF_TOKEN = os.getenv("HF_TOKEN")
    if not HF_TOKEN:
        print("❌ WARNING: HF_TOKEN not found in .env")
    
    state["client"] = OpenAI(
        base_url="https://router.huggingface.co/v1",
        api_key=HF_TOKEN,
    )

    # 3. Load Dataset & Embeddings (with Caching)
    CACHE_FILE = "dataset_cache.pkl"
    import pickle

    if os.path.exists(CACHE_FILE):
        print(f"📦 Found cache '{CACHE_FILE}'. Loading from disk...")
        try:
            with open(CACHE_FILE, "rb") as f:
                cached_data = pickle.load(f)
                state["prompts"] = cached_data["prompts"]
                state["responses"] = cached_data["responses"]
                state["prompt_embeddings"] = cached_data["prompt_embeddings"]
            
            # We still need the embedder for the query
            print("🧠 Loading embeddings model (model only)...")
            state["embedder"] = SentenceTransformer("all-MiniLM-L6-v2")
            print("✅ Cache loaded successfully!")
        except Exception as e:
            print(f"❌ Error loading cache: {e}. Falling back to full load.")
            # Fallback will happen if loading fails
            if os.path.exists(CACHE_FILE):
                os.remove(CACHE_FILE) 

    # If data is not loaded yet (no cache or cache failed)
    if not state["prompts"]:
        print("📦 Loading dataset from HuggingFace...")
        try:
            dataset = load_dataset("alexjk1m/diet-planning-evaluation-20250531-140436")
            train_data = dataset["train"]
            state["prompts"] = [row["Full Prompt"] for row in train_data]
            state["responses"] = [row["Model Response"] for row in train_data]
            print(f"✅ Loaded {len(state['prompts'])} records.")
        except Exception as e:
            print(f"❌ Error loading dataset: {e}")

        print("🧠 Loading embeddings model & computing embeddings...")
        try:
            state["embedder"] = SentenceTransformer("all-MiniLM-L6-v2")
            state["prompt_embeddings"] = state["embedder"].encode(state["prompts"], convert_to_tensor=True)
            print("✅ Embeddings ready.")
            
            # Save to cache
            print(f"💾 Saving cache to '{CACHE_FILE}'...")
            with open(CACHE_FILE, "wb") as f:
                pickle.dump({
                    "prompts": state["prompts"],
                    "responses": state["responses"],
                    "prompt_embeddings": state["prompt_embeddings"]
                }, f)
            print("✅ Cache saved.")
        except Exception as e:
            print(f"❌ Error loading embeddings: {e}")

    yield
    # Shutdown logic if needed
    print("👋 Shutting down AI API")

app = FastAPI(lifespan=lifespan)

# -----------------------------
# Models
# -----------------------------
class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatTurn]] = None

class ChatResponse(BaseModel):
    response: str
    similarity: float
    source: str  # "dataset" or "ai"

# -----------------------------
# Logic
# -----------------------------
def search_similar_prompt(query, top_k=1):
    if not state["embedder"] or state["prompt_embeddings"] is None:
        return []
    
    query_embedding = state["embedder"].encode([query], convert_to_tensor=True)
    similarities = cosine_similarity(query_embedding, state["prompt_embeddings"])[0]
    top_indices = np.argsort(similarities)[::-1][:top_k]
    
    results = []
    for i in top_indices:
        results.append({
            "prompt": state["prompts"][i],
            "response": state["responses"][i],
            "similarity": float(similarities[i])
        })
    return results

# -----------------------------
# Endpoints
# -----------------------------
@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    user_input = request.message.strip()
    if not user_input:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    history_messages = []
    if request.history:
        history_messages = [
            {"role": turn.role, "content": turn.content}
            for turn in request.history
            if turn.content.strip()
        ]

    # 1. Search in Dataset
    results = search_similar_prompt(user_input, top_k=1)
    
    best_match = results[0] if results else None
    similarity = best_match["similarity"] if best_match else 0.0

    # 2. Threshold Check
    if best_match and similarity > 0.45:
        print(f"📚 Match found (sim: {similarity:.2f})")
        
        # AI Interpretation
        try:
            completion = state["client"].chat.completions.create(
                model="moonshotai/Kimi-K2-Instruct-0905",
                messages=[
                    {"role": "system", "content": "Jesteś ekspertem ds. diety. Pomóż użytkownikowi zrozumieć wynik."},
                    *history_messages,
                    {"role": "user", "content": f"Użytkownik zapytał: {user_input}\nOdpowiedź z datasetu: {best_match['response']}\n\nWyjaśnij to prostym językiem i daj wskazówki praktyczne, nawiązując do wcześniejszych wiadomości."}
                ],
            )
            ai_reply = completion.choices[0].message.content
            return ChatResponse(response=ai_reply, similarity=similarity, source="dataset+ai")
        except Exception as e:
            print(f"⚠️ AI Error: {e}")
            # Fallback to raw dataset response if AI fails
            return ChatResponse(response=best_match["response"], similarity=similarity, source="dataset")

    else:
        # 3. No Match - Ask AI directly
        print("🤔 No match, asking AI...")
        try:
            completion = state["client"].chat.completions.create(
                model="moonshotai/Kimi-K2-Instruct-0905",
                messages=[
                    {"role": "system", "content": "Jesteś ekspertem ds. diety. Odpowiadasz konkretnie i po polsku."},
                    *history_messages,
                    {"role": "user", "content": user_input}
                ],
            )
            ai_reply = completion.choices[0].message.content
            return ChatResponse(response=ai_reply, similarity=0.0, source="ai")
        except Exception as e:
            print(f"⚠️ AI Error: {e}")
            raise HTTPException(status_code=500, detail="AI service unavailable")

@app.get("/health")
def health():
    return {"status": "ok"}
