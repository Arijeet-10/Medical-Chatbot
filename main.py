from fastapi import FastAPI, Depends
from pydantic import BaseModel
import pandas as pd
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
import string
import nltk
from deep_translator import GoogleTranslator
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

nltk.download("punkt")
nltk.download("stopwords")



nltk_path = os.path.join(os.path.dirname(__file__), "nltk_data")
nltk.data.path.append(nltk_path)

# --- Step 1: Centralized App State ---
app_state = {}

# --- MODIFICATION 1: SAFE INITIALIZATION ---
# Initialize `stop_words` as an empty set. This is safe to run at import time
# because it doesn't try to load any files. We will fill it during startup.
stop_words = set()

# --- Step 2: Helper Functions ---
# This function will now use the global `stop_words` variable, which will be
# populated correctly by our startup function before this is ever called.
def extract_keywords(text: str) -> set:
    """Extracts keywords from English text and returns a set for fast comparison."""
    if not isinstance(text, str):
        return set()
    tokens = word_tokenize(text.lower())
    return {word for word in tokens if word not in stop_words and word not in string.punctuation}

def extract_keywords_bengali(text: str) -> set:
    """Extracts keywords from Bengali text and returns a set."""
    if not isinstance(text, str):
        return set()
    tokens = word_tokenize(text)
    return {word for word in tokens if word not in string.punctuation}

def jaccard_similarity(a_set: set, b_set: set) -> float:
    intersection = len(a_set.intersection(b_set))
    union = len(a_set.union(b_set))
    return intersection / union if union else 0

def detect_language(text: str) -> str:
    """Detects if text is likely Bengali ('bn') or English ('en')."""
    try:
        translated_text = GoogleTranslator(source='auto', target='en').translate(text[:200])
        return 'bn' if text[:10] != translated_text[:10] else 'en'
    except Exception:
        return 'en'

# --- Step 3: FastAPI Startup Event ---
# This function will run ONLY ONCE when the application starts.
def setup_application():
    # --- MODIFICATION 2: LOAD STOPWORDS HERE ---
    # Use the `global` keyword to modify the `stop_words` set we defined outside.
    # This is the correct place to load file-based data.
    global stop_words
    print("NLTK data path:", nltk.data.path)
    print("Loading NLTK stopwords...")
    stop_words = set(stopwords.words("english"))

    print("Stopwords loaded successfully.")

    print("Loading and pre-processing QA data...")
    df = pd.read_excel("Women_Cancer_QA.xlsx")
    df.dropna(subset=["Queries", "Answers", "Queries_Bengali", "Ans_Bengali"], inplace=True)

    # Now that stopwords are loaded, this `apply` call will work correctly.
    df["en_keywords"] = df["Queries"].apply(extract_keywords)
    df["bn_keywords"] = df["Queries_Bengali"].apply(extract_keywords_bengali)

    app_state["processed_df"] = df
    print("Data loaded and pre-processed successfully.")

# Create the FastAPI app and register the startup event
app = FastAPI(on_startup=[setup_application])

# --- Step 4: Updated CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Question(BaseModel):
    question: str

@app.get("/")
def root():
    return {"message": "API is running. Data is pre-loaded."}

# --- Step 5: Optimized Endpoint ---
@app.post("/ask")
def answer_question(q: Question):
    question_text = q.question
    lang = detect_language(question_text)

    df = app_state.get("processed_df")
    if df is None:
        return {"error": "Data not loaded yet. Please try again in a moment."}

    if lang == "en":
        input_keywords = extract_keywords(question_text)
        df["score"] = df["en_keywords"].apply(lambda x: jaccard_similarity(input_keywords, x))
        best_row = df.loc[df["score"].idxmax()]
        return {"answer": best_row["Answers"]}
    else: # 'bn'
        input_keywords = extract_keywords_bengali(question_text)
        df["score"] = df["bn_keywords"].apply(lambda x: jaccard_similarity(input_keywords, x))
        best_row = df.loc[df["score"].idxmax()]
        return {"answer": best_row["Ans_Bengali"]}


# This block is for local development (running `python main.py`)
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    # Note: uvicorn.run will call the setup_application function for you.
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)