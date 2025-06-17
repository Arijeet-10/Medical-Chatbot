"use client";
import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, Heart, Shield, Users, Stethoscope, Mic, MicOff, Sun, Moon, Volume2 } from "lucide-react";

// FIX: Define a type for a single chat message
interface ChatMessage {
  type: 'user' | 'bot';
  message: string;
}

// FIX: Define types for the Web Speech API to make TypeScript happy
// This extends the global Window interface
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// Interface for the speech recognition event
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

// Interface for the speech recognition error event
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

// Interface for the SpeechRecognition instance itself
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}


export default function Home() {
  const [question, setQuestion] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  // FIX: Provide a specific type for the chat history state
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  // FIX: Provide a specific type for the recognition state
  const [recognition, setRecognition] = useState<ISpeechRecognition | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en-US");
  const [speechSupported, setSpeechSupported] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        // FIX: Cast the instance to our defined interface
        const recognitionInstance: ISpeechRecognition = new SpeechRecognition();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;
        recognitionInstance.maxAlternatives = 1;
        
        // FIX: Type the event parameter
        recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          setQuestion(prev => prev + (prev ? ' ' : '') + transcript);
          setIsListening(false);
        };

        // FIX: Type the event parameter
        recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognitionInstance.onend = () => {
          setIsListening(false);
        };

        setRecognition(recognitionInstance);
        setSpeechSupported(true);
      }
    }
  }, []);

  // Update recognition language when selectedLanguage changes
  useEffect(() => {
    if (recognition) {
      recognition.lang = selectedLanguage;
    }
  }, [selectedLanguage, recognition]);

  // useEffect to auto-scroll the chat container
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // useEffect to auto-resize the textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [question]);


  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const startListening = () => {
    if (recognition && !isListening) {
      setIsListening(true);
      recognition.start();
    }
  };

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  };

  // FIX: Type the text parameter
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = selectedLanguage;
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  };

  const askQuestion = async () => {
    if (!question.trim()) return;
    
    const userMessage = question;
    setChatHistory(prev => [...prev, { type: 'user', message: userMessage }]);
    setQuestion("");
    setLoading(true);
    
    try {
      const res = await fetch("http://127.0.0.1:8000/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: userMessage,
        }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.statusText}`);
      }

      const data = await res.json();
      const botResponse = data.answer;
      setChatHistory(prev => [...prev, { type: 'bot', message: botResponse }]);
    } catch (err) {
      console.error("Failed to fetch from API:", err);
      const errorMsg = "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.";
      setChatHistory(prev => [...prev, { type: 'bot', message: errorMsg }]);
    } finally {
      setLoading(false);
    }
  };

  // FIX: Type the event parameter
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      askQuestion();
    }
  };

  const themeClasses = isDarkMode 
    ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900 text-white'
    : 'bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 text-gray-800';
    
  const cardClasses = isDarkMode 
    ? 'bg-gray-800 border-gray-700'
    : 'bg-white border-gray-100';
    
  const inputClasses = isDarkMode
    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-pink-400'
    : 'bg-white border-gray-200 text-gray-800 placeholder-gray-500 focus:border-pink-400';

  // The rest of your JSX remains the same, as the errors were in the logic part.
  // The types on `chatHistory` will automatically fix the errors within the .map() function.
  return (
    <div className={`min-h-screen transition-colors duration-300 ${themeClasses}`}>
      <header className={`${cardClasses} shadow-sm border-b transition-colors duration-300 sticky top-0 z-10`}>
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-2 rounded-xl">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  Women's Health Assistant
                </h1>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Cancer Awareness & Support
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className={`px-3 py-1 rounded-lg text-sm border transition-colors ${inputClasses}`}
              >
                <option value="en-US">English (US)</option>
                <option value="en-IN">English (India)</option>
                <option value="bn-BD">বাংলা (Bangladesh)</option>
                <option value="bn-IN">বাংলা (India)</option>
              </select>
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                title="Toggle theme"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {chatHistory.length === 0 && (
          <div className="text-center mb-8">
            <div className={`${cardClasses} rounded-2xl shadow-lg p-8 mb-6 transition-colors duration-300`}>
              <div className={`bg-gradient-to-r from-pink-100 to-purple-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 ${isDarkMode ? 'opacity-90' : ''}`}>
                <MessageCircle className="w-10 h-10 text-pink-600" />
              </div>
              <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Welcome to Your Health Assistant
              </h2>
              <p className={`mb-6 max-w-2xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                I'm here to provide information about women's cancer awareness, prevention, and support. 
                Ask me questions using voice or text in English or Bengali, and I'll help with reliable, compassionate guidance.
              </p>
              {speechSupported && (
                <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full mb-6 ${
                  isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'
                }`}>
                  <Mic className="w-4 h-4" />
                  <span className="text-sm">Voice recognition enabled</span>
                </div>
              )}
              <div className="grid md:grid-cols-3 gap-4 mt-6">
                <div className={`p-4 rounded-xl border transition-colors ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-pink-900 to-pink-800 border-pink-700' 
                    : 'bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200'
                }`}>
                  <Heart className="w-6 h-6 text-pink-600 mb-2" />
                  <h3 className={`font-semibold text-sm ${isDarkMode ? 'text-pink-200' : 'text-gray-800'}`}>Prevention Tips</h3>
                  <p className={`text-xs ${isDarkMode ? 'text-pink-300' : 'text-gray-600'}`}>Learn about early detection</p>
                </div>
                <div className={`p-4 rounded-xl border transition-colors ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-purple-900 to-purple-800 border-purple-700' 
                    : 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'
                }`}>
                  <Users className="w-6 h-6 text-purple-600 mb-2" />
                  <h3 className={`font-semibold text-sm ${isDarkMode ? 'text-purple-200' : 'text-gray-800'}`}>Support Resources</h3>
                  <p className={`text-xs ${isDarkMode ? 'text-purple-300' : 'text-gray-600'}`}>Find help and community</p>
                </div>
                <div className={`p-4 rounded-xl border transition-colors ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-rose-900 to-rose-800 border-rose-700' 
                    : 'bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200'
                }`}>
                  <Shield className="w-6 h-6 text-rose-600 mb-2" />
                  <h3 className={`font-semibold text-sm ${isDarkMode ? 'text-rose-200' : 'text-gray-800'}`}>Risk Assessment</h3>
                  <p className={`text-xs ${isDarkMode ? 'text-rose-300' : 'text-gray-600'}`}>Understand your health</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={`${cardClasses} rounded-2xl shadow-lg overflow-hidden transition-colors duration-300`}>
          {chatHistory.length > 0 && (
            <div ref={chatContainerRef} className={`max-h-[60vh] overflow-y-auto p-6 space-y-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              {chatHistory.map((chat, index) => (
                <div key={index} className={`flex ${chat.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl relative group ${
                    chat.type === 'user' 
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white' 
                      : isDarkMode 
                        ? 'bg-gray-700 text-gray-200' 
                        : 'bg-gray-100 text-gray-800'
                  }`}>
                    <p className="text-sm whitespace-pre-line">{chat.message}</p>
                    {chat.type === 'bot' && (
                      <button
                        onClick={() => speakText(chat.message)}
                        className={`absolute -top-1 -right-1 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
                          isDarkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                        title="Read aloud"
                      >
                        <Volume2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className={`px-4 py-3 rounded-2xl max-w-xs ${
                    isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="p-6">
            <div className="flex items-end space-x-4">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  className={`w-full border-2 rounded-xl p-4 pr-12 resize-none focus:outline-none transition-colors overflow-y-auto max-h-40 ${inputClasses}`}
                  placeholder="Ask your question in English or Bengali... (Enter to send)"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                
                {speechSupported && (
                  <button
                    onClick={isListening ? stopListening : startListening}
                    className={`absolute right-3 top-3 p-2 rounded-lg transition-all duration-200 ${
                      isListening 
                        ? 'bg-red-500 text-white animate-pulse' 
                        : isDarkMode
                          ? 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                    }`}
                    title={isListening ? 'Stop listening' : 'Start voice input'}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                )}
              </div>
              
              <button
                onClick={askQuestion}
                className="self-stretch bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center min-w-[100px]"
                disabled={loading || !question.trim()}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>

            {isListening && (
              <div className="mt-3 flex items-center justify-center space-x-2 text-red-500">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm">Listening... Speak now</span>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              </div>
            )}
            
            <div className={`mt-4 p-3 rounded-lg border transition-colors ${
              isDarkMode 
                ? 'bg-amber-900/50 border-amber-700 text-amber-200' 
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              <p className="text-xs">
                <strong>Medical Disclaimer:</strong> This chatbot provides general information only and is not a substitute for professional medical advice. 
                Always consult with healthcare professionals for medical concerns.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className={`${cardClasses} rounded-xl shadow-sm p-6 transition-colors duration-300`}>
            <div className={`flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Available 24/7</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Voice & Text Support</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>Evidence-Based Information</span>
              </div>
            </div>
            <p className={`text-xs mt-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Empowering women with knowledge and support for better health outcomes
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}