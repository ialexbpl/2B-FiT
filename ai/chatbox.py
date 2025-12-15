import os
from dotenv import load_dotenv
from openai import OpenAI
from datasets import load_dataset
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# -----------------------------
# 1️⃣ Load Configuration
# -----------------------------
load_dotenv()
HF_TOKEN = os.getenv("HF_TOKEN")

if not HF_TOKEN:
    raise ValueError("❌ HF_TOKEN not found in .env file! Add: HF_TOKEN=your_token")

client = OpenAI(
    base_url="https://router.huggingface.co/v1",
    api_key=HF_TOKEN,
)

# -----------------------------
# 2️⃣ Load Dataset
# -----------------------------
print("📦 Loading dataset...")
dataset = load_dataset("alexjk1m/diet-planning-evaluation-20250531-140436")

train_data = dataset["train"]

prompts = [row["Full Prompt"] for row in train_data]
responses = [row["Model Response"] for row in train_data]

print(f"✅ Loaded {len(prompts)} records from dataset.")

# -----------------------------
# 3️⃣ Create Embeddings
# -----------------------------
print("🧠 Generating embeddings (this may take a moment)...")
embedder = SentenceTransformer("all-MiniLM-L6-v2")
prompt_embeddings = embedder.encode(prompts, convert_to_tensor=True)
print("✅ Embeddings ready.\n")

# -----------------------------
# 4️⃣ Function: Search Similar Entries
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
# 5️⃣ Chat with AI + Dataset
# -----------------------------
def chat():
    print("🤖 Welcome to Towbee!")
    print("Type 'exit' to quit.\n")

    while True:
        user_input = input("You: ").strip()
        if user_input.lower() in ("exit", "quit"):
            print("👋 Goodbye!")
            break

        # 🔍 Search for similar entry in dataset
        results = search_similar_prompt(user_input, top_k=1)
        best_match = results[0]
        similarity = best_match["similarity"]

        if similarity > 0.45:  # if similar enough
            print("\n📚 Found similar entry in dataset:")
            print(f"(Similarity: {similarity:.2f})\n")
            print("🧠 Dataset excerpt (Model Response):\n")
            print(best_match["response"])
            print("\n---\n")

            # ✨ Towbee interpretation based on found data
            print("🤖 Towbee:\n")
            try:
                completion = client.chat.completions.create(
                    model="moonshotai/Kimi-K2-Instruct-0905",
                    messages=[
                        {"role": "system", "content": "You are a diet and nutrition expert. Help the user understand the result."},
                        {"role": "user", "content": f"The user asked: {user_input}\nDataset response: {best_match['response']}\n\nExplain this in simple terms and provide practical tips."}
                    ],
                )
                ai_reply = completion.choices[0].message.content
                print(ai_reply)
            except Exception as e:
                print("⚠️ Error calling AI model:", e)

        else:
            # No match in dataset — ask Towbee
            print("\n🤔 No similar entries in dataset — asking Towbee...\n")
            try:
                completion = client.chat.completions.create(
                    model="moonshotai/Kimi-K2-Instruct-0905",
                    messages=[
                        {"role": "user", "content": user_input}
                    ],
                )
                print("Towbee:", completion.choices[0].message.content)
            except Exception as e:
                print("⚠️ Error calling AI:", e)

        print("\n============================\n")


# -----------------------------
# 6️⃣ Run Chat
# -----------------------------
if __name__ == "__main__":
    chat()
