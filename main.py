from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
import string
import nltk
from deep_translator import GoogleTranslator
from fastapi.middleware.cors import CORSMiddleware

nltk.download("punkt")
nltk.download("stopwords")

# Load Excel
df = pd.read_excel("Women_Cancer_QA.xlsx")  # Update with your actual filename
df.dropna(inplace=True)  # Clean NaN values

stop_words = set(stopwords.words("english"))



def extract_keywords(text):
    tokens = word_tokenize(text.lower())
    return [word for word in tokens if word not in stop_words and word not in string.punctuation]

def extract_keywords_bengali(text):
    tokens = word_tokenize(text)  # Bengali stopword support is limited; skip stopword removal for now
    return [word for word in tokens if word not in string.punctuation]

def jaccard_similarity(a, b):
    a_set, b_set = set(a), set(b)
    intersection = len(a_set & b_set)
    union = len(a_set | b_set)
    return intersection / union if union else 0

def detect_language(text):
    try:
        lang = GoogleTranslator(source='auto', target='en').translate(text)
        return 'bn' if text != lang else 'en'
    except:
        return 'en'

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Only allow frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Question(BaseModel):
    question: str
    
@app.get("/")
def root():
    return {"message": "API is running"}

@app.post("/ask")
def answer_question(q: Question):
    question = q.question
    lang = detect_language(question)

    if lang == "en":
        input_keywords = extract_keywords(question)
        df["score"] = df["Queries"].apply(lambda x: jaccard_similarity(input_keywords, extract_keywords(x)))
        best_row = df.loc[df["score"].idxmax()]
        return {"answer": best_row["Answers"]}
    else:
        input_keywords = extract_keywords_bengali(question)
        df["score"] = df["Queries_Bengali"].apply(lambda x: jaccard_similarity(input_keywords, extract_keywords_bengali(x)))
        best_row = df.loc[df["score"].idxmax()]
        return {"answer": best_row["Ans_Bengali"]}

if __name__ == "__main__":
    import uvicorn
    import os

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
