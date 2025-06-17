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

# --- Step 1: Centralized App State ---
# This dictionary will hold our pre-processed data, so we don't reload it constantly.
app_state = {}

# --- Step 2: Pre-computation and Loading Logic ---
# These functions will be the same, but we'll call them during startup.
stop_words = set(stopwords.words("english"))

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
        # A simple heuristic: if a short text doesn't change after "translation" to English,
        # it's likely English. This is not foolproof but works for many cases.
        translated_text = GoogleTranslator(source='auto', target='en').translate(text[:200])
        return 'bn' if text[:10] != translated_text[:10] else 'en'
    except Exception:
        return 'en' # Default to English on any error

# --- Step 3: FastAPI Startup Event ---
# This function will run ONLY ONCE when the application starts.
def setup_application():
    print("Downloading NLTK data...")
    nltk.download("punkt", quiet=True)
    nltk.download("stopwords", quiet=True)
    print("NLTK data downloaded.")

    print("Loading and pre-processing QA data...")
    # Load the Excel file
    df = pd.read_excel("Women_Cancer_QA.xlsx")
    df.dropna(subset=["Queries", "Answers", "Queries_Bengali", "Ans_Bengali"], inplace=True)

    # Pre-calculate keywords for ALL rows and store them in new columns.
    # We use sets directly for maximum performance.
    df["en_keywords"] = df["Queries"].apply(extract_keywords)
    df["bn_keywords"] = df["Queries_Bengali"].apply(extract_keywords_bengali)

    # Store the processed DataFrame in our app_state
    app_state["processed_df"] = df
    print("Data loaded and pre-processed successfully.")

# Create the FastAPI app and register the startup event
app = FastAPI(on_startup=[setup_application])

# --- Step 4: Updated CORS Middleware ---
# Allow all origins for easier deployment.
# For production, you might want to replace "*" with your frontend's actual URL.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # CHANGED
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

    # Retrieve the pre-processed DataFrame from our app_state
    df = app_state["processed_df"]

    if lang == "en":
        input_keywords = extract_keywords(question_text)
        # Calculate scores against the PRE-PROCESSED keywords. This is much faster.
        df["score"] = df["en_keywords"].apply(lambda x: jaccard_similarity(input_keywords, x))
        best_row = df.loc[df["score"].idxmax()]
        return {"answer": best_row["Answers"]}
    else: # 'bn'
        input_keywords = extract_keywords_bengali(question_text)
        # Calculate scores against the PRE-PROCESSED keywords.
        df["score"] = df["bn_keywords"].apply(lambda x: jaccard_similarity(input_keywords, x))
        best_row = df.loc[df["score"].idxmax()]
        return {"answer": best_row["Ans_Bengali"]}


# This block is for local development (running `python main.py`)
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)