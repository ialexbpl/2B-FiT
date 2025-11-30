import os
from dotenv import load_dotenv
from openai import OpenAI
from datasets import load_dataset
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# -----------------------------
# 1️⃣ Wczytanie konfiguracji
# -----------------------------
load_dotenv()
HF_TOKEN = os.getenv("HF_TOKEN")

if not HF_TOKEN:
    raise ValueError("❌ Brak tokenu HF_TOKEN w pliku .env! Dodaj: HF_TOKEN=twój_token")

client = OpenAI(
    base_url="https://router.huggingface.co/v1",
    api_key=HF_TOKEN,
)

# -----------------------------
# 2️⃣ Ładowanie datasetu
# -----------------------------
print("📦 Ładowanie datasetu...")
dataset = load_dataset("alexjk1m/diet-planning-evaluation-20250531-140436")

train_data = dataset["train"]

prompts = [row["Full Prompt"] for row in train_data]
responses = [row["Model Response"] for row in train_data]

print(f"✅ Wczytano {len(prompts)} rekordów z datasetu.")

# -----------------------------
# 3️⃣ Tworzenie embeddingów
# -----------------------------
print("🧠 Generowanie embeddingów (może chwilę potrwać)...")
embedder = SentenceTransformer("all-MiniLM-L6-v2")
prompt_embeddings = embedder.encode(prompts, convert_to_tensor=True)
print("✅ Embeddingi gotowe.\n")

# -----------------------------
# 4️⃣ Funkcja: wyszukiwanie podobnych wpisów
# -----------------------------
def search_similar_prompt(query, top_k=1):
    query_embedding = embedder.encode([query], convert_to_tensor=True)
    similarities = cosine_similarity(query_embedding, prompt_embeddings)[0]
    top_indices = np.argsort(similarities)[::-1][:top_k]
    results = []
    for i in top_indices:
        results.append({
            "prompt": prompts[i],
            "response": responses[i],
            "similarity": float(similarities[i])
        })
    return results

# -----------------------------
# 5️⃣ Chat z AI + dataset
# -----------------------------
def chat():
    print("🤖 Witaj w Smart AI ChatBox!")
    print("Napisz 'exit' aby zakończyć.\n")

    while True:
        user_input = input("Ty: ").strip()
        if user_input.lower() in ("exit", "quit"):
            print("👋 Do zobaczenia!")
            break

        # 🔍 Szukamy podobnego wpisu w dataset
        results = search_similar_prompt(user_input, top_k=1)
        best_match = results[0]
        similarity = best_match["similarity"]

        if similarity > 0.45:  # jeśli jest wystarczająco podobne
            print("\n📚 Znaleziono podobny wpis w dataset:")
            print(f"(Podobieństwo: {similarity:.2f})\n")
            print("🧠 Fragment z datasetu (Model Response):\n")
            print(best_match["response"])
            print("\n---\n")

            # ✨ AI interpretacja na podstawie znalezionych danych
            print("🤖 AI (rozszerzona interpretacja):\n")
            try:
                completion = client.chat.completions.create(
                    model="moonshotai/Kimi-K2-Instruct-0905",
                    messages=[
                        {"role": "system", "content": "Jesteś ekspertem ds. diety. Pomóż użytkownikowi zrozumieć wynik."},
                        {"role": "user", "content": f"Użytkownik zapytał: {user_input}\nOdpowiedź z datasetu: {best_match['response']}\n\nWyjaśnij to prostym językiem i daj wskazówki praktyczne."}
                    ],
                )
                ai_reply = completion.choices[0].message.content
                print(ai_reply)
            except Exception as e:
                print("⚠️ Błąd przy wywołaniu modelu AI:", e)

        else:
            # Brak dopasowania w dataset — pytamy model
            print("\n🤔 Brak podobnych wpisów w dataset — pytam AI...\n")
            try:
                completion = client.chat.completions.create(
                    model="moonshotai/Kimi-K2-Instruct-0905",
                    messages=[
                        {"role": "user", "content": user_input}
                    ],
                )
                print("AI:", completion.choices[0].message.content)
            except Exception as e:
                print("⚠️ Błąd przy wywołaniu AI:", e)

        print("\n============================\n")


# -----------------------------
# 6️⃣ Uruchomienie chatu
# -----------------------------
if __name__ == "__main__":
    chat()
