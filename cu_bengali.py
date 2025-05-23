# -*- coding: utf-8 -*-
"""CU_Bengali.ipynb

Automatically generated by Colab.

Original file is located at
    https://colab.research.google.com/drive/15C66lMvUcItZckjrf31I8w6EuvkpIV5c

#Questions
"""

import pandas as pd
df = pd.read_excel("/content/Women Cancer Awareness Question.xlsx")
df.head()

!pip install nltk
import nltk
nltk.download('punkt')
nltk.download('stopwords')
nltk.download('punkt_tab') # Download the punkt_tab data
nltk.download('wordnet')

import pandas as pd
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
import string

def extract_keywords(text):
    # Handle potential missing or non-string values
    if isinstance(text, float):  # Check if the value is a float (indicating a missing or invalid value)
        return []  # Return an empty list for missing values
    elif not isinstance(text, str):
        text = str(text)  # Convert other non-string types to strings

    # Tokenize the text (split into words)
    tokens = word_tokenize(text.lower())

    # Remove punctuation and stopwords, keep only meaningful words
    keywords = [word for word in tokens if word not in string.punctuation]

    return keywords


# Step 4: Apply the function to the Queries column
df['Keywords'] = df["Queries"].apply(extract_keywords)

df = df[["Queries","Keywords"]]
df

!pip install deep-translator

from deep_translator import GoogleTranslator

# Step 6: Define a function to translate keywords to Bengali
def translate_to_bengali(keywords):
    # Initialize the translator
    translator = GoogleTranslator(source='en', target='bn')

    # Translate each keyword individually and preserve the list structure
    translated_keywords = [translator.translate(word) for word in keywords]

    return translated_keywords

# Step 7: Apply the translation function to the Keywords column
df['Keywords_Bengali'] = df['Keywords'].apply(translate_to_bengali)

df.head()

# Step 8: Export the DataFrame to an Excel file
df.to_excel('queries_keywords_bengali.xlsx', index=False)

# Step 9: Download the Excel file in Colab
from google.colab import files
files.download('queries_keywords_bengali.xlsx')

af=df[["Queries"]]
af = af.astype(str)  # Ensure all values are strings

def translate_to_bengali_query(text):
    # Initialize the translator
    translator = GoogleTranslator(source='en', target='bn')

    # Handle NaN or empty strings
    if pd.isnull(text) or text.strip() == "":
        return ""  # Or any other placeholder you prefer

    # Translate each query string
    translated_query = translator.translate(text)

    return translated_query

af['Queries_Bengali'] = df["Queries"].apply(translate_to_bengali_query) #applying translation to each query
af.head()

# Step 8: Export the DataFrame to an Excel file
af.to_excel('queries_bengali.xlsx', index=False)

# Step 9: Download the Excel file in Colab
from google.colab import files
files.download('queries_bengali.xlsx')

"""#Answers"""

df["Ans_Keywords"] = df["Answers"].apply(extract_keywords)

df = df[["Answers","Ans_Keywords"]]
df.head()

df["Ans_Keywords_Bengali"] = df["Ans_Keywords"].apply(translate_to_bengali)
df.head()

# Step 8: Export the DataFrame to an Excel file
df.to_excel('ans_keywords_bengali.xlsx', index=False)

# Step 9: Download the Excel file in Colab
from google.colab import files
files.download('ans_keywords_bengali.xlsx')

af=df[["Answers"]]
af=af.astype(str) # Convert the entire DataFrame to string type
af["Ans_Bengali"] = df["Answers"].astype(str).apply(translate_to_bengali_query) #applying translation to each query
af.head()

# Step 8: Export the DataFrame to an Excel file
af.to_excel('ans_bengali.xlsx', index=False)

# Step 9: Download the Excel file in Colab
from google.colab import files
files.download('ans_bengali.xlsx')

