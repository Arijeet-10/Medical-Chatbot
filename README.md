# Medical Chatbot

A comprehensive medical chatbot application built with Python backend and Next.js frontend, designed to provide medical information and assistance through an interactive chat interface.

## Chatbot Link: https://medical-chatbot-mu.vercel.app/

## 🏗️ Project Structure

```
medical-chatbot/
├── main.py                 # Python backend server
├── chatbot-frontend/       # Next.js frontend application
│   ├── src/
│   │   └── page.tsx       # Main frontend component
│   ├── package.json
│   └── ...
├── README.md
└── requirements.txt       # Python dependencies (if applicable)
```

## 🚀 Features

- **AI-Powered Medical Assistant**: Intelligent chatbot for medical queries
- **Real-time Communication**: Fast API responses for seamless user experience
- **Modern UI**: Clean and responsive interface built with Next.js
- **RESTful API**: Well-structured backend with FastAPI
- **Cross-platform**: Accessible on both local and network environments

## 🛠️ Technology Stack

### Backend
- **Python** - Core backend language
- **FastAPI** - Web framework for building APIs
- **Machine Learning Model** - For medical query processing

### Frontend
- **Next.js 15.3.3** - React framework for the user interface
- **TypeScript** - Type-safe JavaScript
- **Modern CSS** - Responsive and clean design

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Python 3.8+**
- **Node.js 18+**
- **npm** or **yarn**

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Arijeet-10/Medical-Chatbot.git
cd medical-chatbot
```

### 2. Backend Setup

#### Install Python Dependencies
```bash
pip install -r requirements.txt
```

#### Run the Backend Server
```bash
python main.py
```

The backend server will start on:
- **Server URL**: `http://0.0.0.0:8000`
- **API Endpoint**: `POST /ask`

### 3. Frontend Setup

#### Navigate to Frontend Directory
```bash
cd chatbot-frontend
```

#### Install Dependencies
```bash
npm install
```

#### Run the Development Server
```bash
npm run dev
```

The frontend will be available on:
- **Local**: `http://localhost:3000`
- **Network**: `http://192.168.1.8:3000`

## 🔌 API Documentation

### Endpoint: `/ask`
- **Method**: POST
- **URL**: `http://0.0.0.0:8000/ask`
- **Description**: Processes medical queries and returns AI-generated responses

#### Request Format
```json
{
  "question": "Can HPV transmit through kissing?"
}
```

#### Response Format
```json
{
    "answer": "Deep kissing or mouth to mouth kissing can spread the virus ",
    "score": 1,
    "language": "en"
}
```

## 💻 Usage

1. **Start the Backend**: Run `python main.py` in the root directory
2. **Start the Frontend**: Run `npm run dev` in the `chatbot-frontend` directory
3. **Access the Application**: Open your browser and go to `http://localhost:3000`
4. **Start Chatting**: Type your medical questions and receive AI-powered responses

## 🤝 Development

### Backend Development
- The main backend logic is in `main.py`
- API endpoints are built using FastAPI
- Medical AI model integration handles query processing

### Frontend Development
- Main component located in `src/page.tsx`
- Built with Next.js for optimal performance
- Responsive design for various screen sizes

## 📁 Key Files

- **`main.py`**: Backend server with FastAPI and medical AI integration
- **`chatbot-frontend/src/page.tsx`**: Main frontend React component
- **`chatbot-frontend/package.json`**: Frontend dependencies and scripts

## 🔍 Troubleshooting

### Common Issues

1. **Backend not starting**: Ensure all Python dependencies are installed
2. **Frontend build errors**: Check Node.js version and run `npm install`
3. **API connection issues**: Verify backend is running on port 8000
4. **Network access problems**: Check firewall settings for port 3000

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## ⚠️ Disclaimer

This medical chatbot is for informational purposes only and should not be used as a substitute for professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare professionals for medical concerns.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Thanks to the open-source community for the amazing tools and libraries
- Special recognition to healthcare professionals who inspire AI-driven medical solutions

---

For more information or support, please contact [your-email@example.com]
