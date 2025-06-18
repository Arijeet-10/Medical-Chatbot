# download_nltk.py
import nltk
import os

# Define a directory to store NLTK data that will persist
DATA_DIR = os.path.join(os.getcwd(), ".nltk_data")
os.makedirs(DATA_DIR, exist_ok=True)

# Add the directory to NLTK's data path
nltk.data.path.append(DATA_DIR)

print(f"Starting NLTK data download to {DATA_DIR}...")
nltk.download('punkt', download_dir=DATA_DIR)
nltk.download('stopwords', download_dir=DATA_DIR)
print("NLTK data download complete.")