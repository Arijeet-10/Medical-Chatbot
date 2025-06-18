# download_nltk.py
import nltk

print("Starting NLTK data download...")
# CORRECT: Use 'punkt', NOT 'punkt_tab'
nltk.download('punkt')
nltk.download('stopwords')
print("NLTK data download complete.")