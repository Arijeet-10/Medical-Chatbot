# -*- coding: utf-8 -*-
import streamlit as st
import pandas as pd
from deep_translator import GoogleTranslator
import re
from fuzzywuzzy import fuzz

# Function to detect if the input is in Bengali
def is_bengali(text):
    # Check for Bengali Unicode range (U+0980 to U+09FF)
    bengali_pattern = re.compile(r'[\u0980-\u09FF]')
    return bool(bengali_pattern.search(text))

# Load data
@st.cache_data
def load_data():
    queries_df = pd.read_excel('queries_bengali.xlsx')
    answers_df = pd.read_excel('ans_bengali.xlsx')
    # Merge to have queries and answers in one DataFrame
    df = pd.concat([queries_df, answers_df], axis=1)
    # Convert columns to string and handle NaN
    df['Queries'] = df['Queries'].astype(str).fillna('')
    df['Queries_Bengali'] = df['Queries_Bengali'].astype(str).fillna('')
    df['Answers'] = df['Answers'].astype(str).fillna('')
    df['Ans_Bengali'] = df['Ans_Bengali'].astype(str).fillna('')
    return df

# Function to find the best matching answer using fuzzy matching
def find_answer(query, df, is_bengali_input):
    query = query.strip().lower()
    best_match = None
    best_score = 0
    threshold = 80  # Similarity threshold
    if is_bengali_input:
        # Search in Bengali queries
        for idx, row in df.iterrows():
            score = fuzz.partial_ratio(query, row['Queries_Bengali'].lower())
            if score > best_score and score >= threshold:
                best_score = score
                best_match = row['Ans_Bengali']
        # Return the best match or fallback message
        return best_match or "দুঃখিত, আমি এই প্রশ্নের উত্তর খুঁজে পাইনি। আরেকটি প্রশ্ন করুন।"
    else:
        # Search in English queries
        for idx, row in df.iterrows():
            score = fuzz.partial_ratio(query, row['Queries'].lower())
            if score > best_score and score >= threshold:
                best_score = score
                best_match = row['Answers']
        # Return the best match or fallback message
        return best_match or "Sorry, I couldn't find an answer to this question. Please try another."

    # Fallback: Translate query to English if Bengali and no match found
    if is_bengali_input:
        try:
            translator = GoogleTranslator(source='bn', target='en')
            query_en = translator.translate(query)
            for idx, row in df.iterrows():
                score = fuzz.partial_ratio(query_en.lower(), row['Queries'].lower())
                if score > best_score and score >= threshold:
                    best_score = score
                    # Translate answer back to Bengali
                    translator = GoogleTranslator(source='en', target='bn')
                    best_match = translator.translate(row['Answers'])
            return best_match or "দুঃখিত, আমি এই প্রশ্নের উত্তর খুঁজে পাইনি। আরেকটি প্রশ্ন করুন।"
        except Exception as e:
            return f"Translation error: {str(e)}"

# Streamlit app
def main():
    st.title("Women Cancer Awareness Chatbot")
    st.write("Ask questions about women's cancer awareness in Bengali or English.")

    # Load data
    df = load_data()

    # Input box for user query
    user_input = st.text_input("Enter your question:", "")

    if user_input:
        # Detect language
        is_bengali_input = is_bengali(user_input)
        
        # Get response
        response = find_answer(user_input, df, is_bengali_input)
        
        # Display response
        st.write("**Answer:**")
        st.write(response)

if __name__ == "__main__":
    main()