# main.py

from fastapi import FastAPI
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

# --- CONFIGURE NLTK DATA PATH ---
# Point NLTK to the directory where our build script downloaded the data.
# This ensures it finds the data when the application starts.
DATA_DIR = os.path.join(os.getcwd(), ".nltk_data")
nltk.data.path.append(DATA_DIR)
# ---------------------------------------------

# --- Step 1: Centralized App State ---
# A dictionary to hold our application's data, like the processed DataFrame.
app_state = {}

# Initialize `stop_words` as an empty set. This is safe to run at import time
# because it doesn't load any files. We will fill it during startup.
stop_words = set()

# --- Step 2: Helper Functions ---
# These functions will be used by the startup event and the API endpoint.

def extract_keywords(text: str) -> set:
    """Extracts keywords from English text and returns a set for fast comparison."""
    if not isinstance(text, str):
        return set()
    tokens = word_tokenize(text.lower())
    # The `stop_words` global set will be populated by the startup function.
    return {word for word in tokens if word not in stop_words and word not in string.punctuation}

def extract_keywords_bengali(text: str) -> set:
    """Extracts keywords from Bengali text and returns a set."""
    if not isinstance(text, str):
        return set()
    tokens = word_tokenize(text)
    return {word for word in tokens if word not in string.punctuation}

def jaccard_similarity(a_set: set, b_set: set) -> float:
    """Calculates the Jaccard similarity between two sets."""
    intersection = len(a_set.intersection(b_set))
    union = len(a_set.union(b_set))
    return intersection / union if union else 0

def detect_language(text: str) -> str:
    """Detects if text is likely Bengali ('bn') or English ('en')."""
    try:
        # Translate a small snippet to check for language change
        translated_text = GoogleTranslator(source='auto', target='en').translate(text[:200])
        # If the original text is different from the translated one, it's likely not English.
        return 'bn' if text[:10] != translated_text[:10] else 'en'
    except Exception:
        # Default to English on any error
        return 'en'

# --- Step 3: FastAPI Startup Event Function ---
# This function will run ONLY ONCE when the application starts.
def setup_application():
    """Loads and pre-processes all necessary data on application startup."""
    global stop_words
    
    print("NLTK data path:", nltk.data.path)
    
    print("Loading NLTK stopwords...")
    # This line requires the 'stopwords' package to be available in the NLTK data path.
    stop_words = set(stopwords.words("english"))
    print("Stopwords loaded successfully.")

    print("Loading and pre-processing QA data...")
    # This line requires the 'punkt' package for `word_tokenize` used in `extract_keywords`.
    df = pd.read_excel("Women_Cancer_QA.xlsx")
    df.dropna(subset=["Queries", "Answers", "Queries_Bengali", "Ans_Bengali"], inplace=True)

    df["en_keywords"] = df["Queries"].apply(extract_keywords)
    df["bn_keywords"] = df["Queries_Bengali"].apply(extract_keywords_bengali)

    # Store the processed dataframe in the global state
    app_state["processed_df"] = df
    print("Data loaded and pre-processed successfully. Application is ready.")

# Create the FastAPI app and register the startup event
app = FastAPI(on_startup=[setup_application])

# --- Step 4: Add CORS Middleware ---
# Allows web pages from any origin to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Step 5: API Endpoints ---
class Question(BaseModel):
    question: str

@app.get("/")
def root():
    """Root endpoint to check if the API is running."""
    return {"message": "API is running. Data should be pre-loaded."}

@app.post("/ask")
def answer_question(q: Question):
    """
    Receives a question, detects the language, finds the best match,
    and returns the corresponding answer.
    """
    question_text = q.question
    lang = detect_language(question_text)

    df = app_state.get("processed_df")
    if df is None:
        return {"error": "Data not loaded yet. Please try again in a moment."}

    if lang == "en":
        input_keywords = extract_keywords(question_text)
        df["score"] = df["en_keywords"].apply(lambda x: jaccard_similarity(input_keywords, x))
        best_row = df.loc[df["score"].idxmax()]
        return {"answer": best_row["Answers"], "score": best_row["score"], "language": "en"}
    else: # 'bn'
        input_keywords = extract_keywords_bengali(question_text)
        df["score"] = df["bn_keywords"].apply(lambda x: jaccard_similarity(input_keywords, x))
        best_row = df.loc[df["score"].idxmax()]
        return {"answer": best_row["Ans_Bengali"], "score": best_row["score"], "language": "bn"}


# --- Step 6: Local Development Runner ---
# This block is for local development (e.g., running `python main.py`)
if __name__ == "__main__":
   # Render sets the PORT environment variable.
    port = int(os.environ.get("PORT", 8000))
    
    # Use 'workers=4' for production. This is similar to gunicorn's '-w 4'.
    # REMOVE `reload=True` as it is not for production.
    uvicorn.run("main:app", host="0.0.0.0", port=port, workers=4)