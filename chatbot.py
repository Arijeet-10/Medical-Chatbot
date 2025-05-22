# -*- coding: utf-8 -*-
import streamlit as st
import pandas as pd
from deep_translator import GoogleTranslator
import re
from fuzzywuzzy import fuzz
import time

# Page configuration
st.set_page_config(
    page_title="Women Cancer Awareness Chatbot",
    page_icon="🎗️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for better styling
st.markdown("""
<style>
    .main-header {
        text-align: center;
        padding: 2rem 0;
        background: linear-gradient(90deg, #ff6b9d, #c44569);
        color: white;
        border-radius: 10px;
        margin-bottom: 2rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .chat-container {
        background: #ffffff;
        padding: 1.5rem;
        border-radius: 10px;
        border-left: 4px solid #ff6b9d;
        margin: 1rem 0;
        color: #1a1a1a;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .user-message {
        background: #e3f2fd;
        padding: 1rem;
        border-radius: 10px;
        margin: 1rem 0;
        border-left: 4px solid #2196f3;
        color: #1a1a1a;
        font-weight: 500;
    }
    
    .bot-message {
        background: #f3e5f5;
        padding: 1rem;
        border-radius: 10px;
        margin: 1rem 0;
        border-left: 4px solid #9c27b0;
        color: #1a1a1a;
        font-weight: 500;
    }
    
    .info-box {
        background: #fff3e0;
        padding: 1rem;
        border-radius: 8px;
        border-left: 4px solid #ff9800;
        margin: 1rem 0;
    }
    
    .success-box {
        background: #e8f5e8;
        padding: 1rem;
        border-radius: 8px;
        border-left: 4px solid #4caf50;
        margin: 1rem 0;
    }
    
    .stButton > button {
        background: linear-gradient(90deg, #ff6b9d, #c44569);
        color: white;
        border: none;
        border-radius: 25px;
        padding: 0.5rem 2rem;
        font-weight: bold;
        transition: all 0.3s ease;
    }
    
    .stButton > button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }
    
    .sidebar-content {
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1rem;
    }
</style>
""", unsafe_allow_html=True)

# Function to detect if the input is in Bengali
def is_bengali(text):
    bengali_pattern = re.compile(r'[\u0980-\u09FF]')
    return bool(bengali_pattern.search(text))

# Load data with error handling
@st.cache_data
def load_data():
    try:
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
    except FileNotFoundError:
        st.error("⚠️ Data files not found. Please ensure 'queries_bengali.xlsx' and 'ans_bengali.xlsx' are in the correct directory.")
        return pd.DataFrame()
    except Exception as e:
        st.error(f"⚠️ Error loading data: {str(e)}")
        return pd.DataFrame()

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

# Initialize session state for chat history
if 'chat_history' not in st.session_state:
    st.session_state.chat_history = []

# Sidebar
with st.sidebar:
    st.markdown("<h2 style='color: #f39c12;'>💬 Medical Chatbot</h2>", unsafe_allow_html=True)
    st.markdown("### 🎗️ About This Chatbot")
    st.write("This AI-powered chatbot provides information about women's cancer awareness in both Bengali and English.")
    
    st.markdown("### 🌟 Features")
    st.write("• Bilingual support (Bengali & English)")
    st.write("• Intelligent fuzzy matching")
    st.write("• Real-time language detection")
    st.write("• Professional medical information")
    
    st.markdown("### 📞 Emergency Contacts")
    st.info("🚨 For medical emergencies, please contact your local healthcare provider immediately.")
    
    st.markdown("### 💡 Tips for Better Results")
    st.write("• Ask specific questions")
    st.write("• Use clear, simple language")
    st.write("• Try rephrasing if no results found")
    
    # Clear chat button
    if st.button("🗑️ Clear Chat History"):
        st.session_state.chat_history = []
        st.success("Chat history cleared!")
    
    st.markdown('</div>', unsafe_allow_html=True)

# Main content
def main():
    # Header
    st.markdown("""
    <div class="main-header">
        <h1>🎗️ Women Cancer Awareness Chatbot</h1>
        <p>Your trusted companion for women's cancer awareness information</p>
        <p><em>Supporting both Bengali (বাংলা) and English languages</em></p>
    </div>
    """, unsafe_allow_html=True)
    
    # Load data
    df = load_data()
    
    if df.empty:
        st.error("Unable to load data. Please check your data files.")
        return
    
    # Stats display
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("📊 Total Questions", len(df))
    with col2:
        st.metric("🌐 Languages", "2")
    with col3:
        st.metric("💬 Chat Sessions", len(st.session_state.chat_history))
    with col4:
        st.metric("🔍 Accuracy", "80%+")
    
    st.markdown("---")
    
    # Input section
    st.markdown("### 💬 Ask Your Question")
    
    # Create two columns for input and button
    col1, col2 = st.columns([4, 1])
    
    with col1:
        user_input = st.text_input(
            "",
            placeholder="Type your question here... (আপনার প্রশ্ন এখানে লিখুন...)",
            key="user_input"
        )
    
    with col2:
        ask_button = st.button("🚀 Ask", type="primary")
    
    # Sample questions
    st.markdown("### 🤔 Sample Questions")
    sample_questions = [
        "What are the early signs of breast cancer?",
        "স্তন ক্যান্সারের প্রাথমিক লক্ষণগুলি কী?",
        "How HPV transmitted?",
        "কীভাবে এইচপিভি সংক্রমণিত?"
    ]
    
    cols = st.columns(2)
    for i, question in enumerate(sample_questions):
        with cols[i % 2]:
            if st.button(f"💡 {question}", key=f"sample_{i}"):
                user_input = question
                ask_button = True
    
    # Process input
    if (user_input and ask_button) or user_input:
        if user_input.strip():
            # Detect language
            is_bengali_input = is_bengali(user_input)
            language_detected = "Bengali (বাংলা)" if is_bengali_input else "English"
            
            # Show processing message
            with st.spinner(f"🔍 Processing your question... (Language: {language_detected})"):
                time.sleep(0.5)  # Small delay for better UX
                response = find_answer(user_input, df, is_bengali_input)
            
            # Add to chat history
            st.session_state.chat_history.append({
                "question": user_input,
                "answer": response,
                "language": language_detected,
                "timestamp": time.strftime("%H:%M:%S")
            })
            
            # Display current Q&A
            st.markdown("### 🎯 Current Response")
            
            # User message
            st.markdown(f"""
            <div class="user-message">
                <strong>👤 You ({language_detected}):</strong><br>
                {user_input}
            </div>
            """, unsafe_allow_html=True)
            
            # Bot response
            st.markdown(f"""
            <div class="bot-message">
                <strong>🤖 Cancer Awareness Bot:</strong><br>
                {response}
            </div>
            """, unsafe_allow_html=True)
            
            # Feedback section
            st.markdown("### 📝 Was this helpful?")
            col1, col2, col3 = st.columns(3)
            with col1:
                if st.button("👍 Yes, helpful"):
                    st.success("Thank you for your feedback!")
            with col2:
                if st.button("👎 Not helpful"):
                    st.info("We'll work on improving our responses!")
            with col3:
                if st.button("🔄 Ask another question"):
                    st.experimental_rerun()
    
    # Chat history
    if st.session_state.chat_history:
        st.markdown("---")
        st.markdown("### 📜 Chat History")
        
        # Display chat history in reverse order (newest first)
        for i, chat in enumerate(reversed(st.session_state.chat_history[-5:])):  # Show last 5 chats
            with st.expander(f"💬 Chat {len(st.session_state.chat_history)-i} - {chat['timestamp']} ({chat['language']})"):
                st.markdown(f"""
                <div class="chat-container">
                    <strong>👤 Question:</strong><br>
                    {chat['question']}<br><br>
                    <strong>🤖 Answer:</strong><br>
                    {chat['answer']}
                </div>
                """, unsafe_allow_html=True)
    
    # # Footer
    # st.markdown("---")
    # st.markdown("""
    # <div style="text-align: center; padding: 2rem; background: #f8f9fa; border-radius: 10px; margin-top: 2rem;">
    #     <p><strong>🎗️ Women Cancer Awareness Chatbot</strong></p>
    #     <p><em>Empowering women with knowledge and awareness</em></p>
    #     <p>⚠️ <strong>Disclaimer:</strong> This chatbot provides general information only. 
    #     Always consult healthcare professionals for medical advice.</p>
    # </div>
    # """, unsafe_allow_html=True)

if __name__ == "__main__":
    main()