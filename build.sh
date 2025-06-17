#!/usr/bin/env bash
# exit on error
set -o errexit

# Install Python dependencies
pip install -r requirements.txt

# Download NLTK data to a specific directory
python -m nltk.downloader -d /opt/render/nltk_data punkt stopwords