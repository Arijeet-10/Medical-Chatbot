"use client";
import { useState, useEffect, useRef, KeyboardEvent } from "react";
import {
  MessageCircle,
  Send,
  Heart,
  Shield,
  Users,
  Stethoscope,
  Mic,
  MicOff,
  Sun,
  Moon,
  Volume2,
  Languages,
} from "lucide-react";

// --- TYPE DEFINITIONS ---
interface ChatMessage {
  type: "user" | "bot";
  message: string;
  language?: "en" | "bn"; // Track message language
}

type ToastType = "info" | "success" | "error";
interface ToastState {
  show: boolean;
  title: string;
  description: string;
  type: ToastType;
}

interface CustomSpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionEvent extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
        confidence: number;
      };
    };
  };
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
// --- END TYPE DEFINITIONS ---

export default function Home() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<CustomSpeechRecognition | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("en-US");
  const [speechSupported, setSpeechSupported] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    show: false,
    title: "",
    description: "",
    type: "info",
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const showToast = (
    title: string,
    description: string,
    type: ToastType = "info"
  ) => {
    setToast({ show: true, title, description, type });
    setTimeout(
      () => setToast({ show: false, title: "", description: "", type: "info" }),
      4000
    );
  };

  // Language detection function
  const detectLanguage = (text: string): "en" | "bn" => {
    // Simple Bengali detection - checks for Bengali Unicode range
    const bengaliRegex = /[\u0980-\u09FF]/;
    return bengaliRegex.test(text) ? "bn" : "en";
  };

  // Translation function using Google Translate API (free tier)
  const translateText = async (text: string, targetLang: "en" | "bn"): Promise<string> => {
    try {
      setTranslating(true);
      
      // Using a free translation service (MyMemory API)
      const sourceLang = targetLang === "en" ? "bn" : "en";
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`
      );
      
      if (!response.ok) {
        throw new Error('Translation service unavailable');
      }
      
      const data = await response.json();
      
      if (data.responseStatus === 200) {
        return data.responseData.translatedText;
      } else {
        throw new Error('Translation failed');
      }
    } catch (error) {
      console.error('Translation error:', error);
      // Fallback: return original text with a note
      return `[Translation unavailable] ${text}`;
    } finally {
      setTranslating(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognitionInstance: CustomSpeechRecognition =
          new SpeechRecognition();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;
        recognitionInstance.maxAlternatives = 1;

        recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          setQuestion((prev) => prev + (prev ? " " : "") + transcript);
          setIsListening(false);
        };

        recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);

          const errorMessage =
            event.error === "no-speech"
              ? "No speech detected. Please try again."
              : event.error === "audio-capture"
              ? "Microphone not available. Check permissions."
              : event.error === "not-allowed"
              ? "Permission to use microphone was denied."
              : "An error occurred during speech recognition.";

          showToast("Speech Recognition Error", errorMessage, "error");
        };

        recognitionInstance.onend = () => {
          setIsListening(false);
        };

        setRecognition(recognitionInstance);
        setSpeechSupported(true);
      } else {
        console.warn("Speech recognition not supported in this browser.");
      }
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (recognition) {
      recognition.lang = selectedLanguage;
    }
  }, [selectedLanguage, recognition]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const startListening = async () => {
    if (!recognition) {
      showToast(
        "Unsupported Feature",
        "Speech recognition is not supported in your browser.",
        "error"
      );
      return;
    }

    if (!isListening) {
      try {
        if (navigator.permissions) {
          const permissionStatus = await navigator.permissions.query({
            name: "microphone" as PermissionName,
          });
          if (permissionStatus.state === "denied") {
            showToast(
              "Permission Denied",
              "Microphone access was denied. Please enable it in your browser settings.",
              "error"
            );
            return;
          }
        }

        setIsListening(true);
        recognition.start();
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        setIsListening(false);
        let errorMessage = "Could not start recording.";
        if (error instanceof Error) {
            errorMessage = `Could not start recording: ${error.message}`;
        }
        showToast("Recording Error", errorMessage, "error");
      }
    }
  };

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  };

  const speakText = (text: string, language?: "en" | "bn") => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set language based on detected language or fallback
      if (language === "bn") {
        utterance.lang = "bn-BD";
      } else if (language === "en") {
        utterance.lang = "en-US";
      } else {
        // Auto-detect based on text content
        const detectedLang = detectLanguage(text);
        utterance.lang = detectedLang === "bn" ? "bn-BD" : "en-US";
      }
      
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const askQuestion = async () => {
    if (!question.trim()) return;

    const userMessage = question;
    const inputLanguage = detectLanguage(userMessage);
    const targetLanguage = inputLanguage === "en" ? "bn" : "en";
    
    setChatHistory((prev) => [...prev, { 
      type: "user", 
      message: userMessage, 
      language: inputLanguage 
    }]);
    setQuestion("");
    setLoading(true);

    try {
      // Get response from medical chatbot
      const res = await fetch(
        "https://medical-chatbot-backend-15xi.onrender.com/ask",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: userMessage,
          }),
        }
      );
      const data = await res.json();
      let botResponse = data.answer;
      
      // Translate the response to the target language
      try {
        const translatedResponse = await translateText(botResponse, targetLanguage);
        botResponse = translatedResponse;
      } catch (translationError) {
        console.error("Translation failed:", translationError);
        // If translation fails, add a note to the original response
        botResponse = `${botResponse}\n\n[Translation to ${targetLanguage === "bn" ? "Bengali" : "English"} unavailable]`;
      }
      
      setResponse(botResponse);
      setChatHistory((prev) => [
        ...prev,
        { 
          type: "bot", 
          message: botResponse, 
          language: targetLanguage 
        },
      ]);
    } catch (err) {
      const errorMsg =
        "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.";
      setResponse(errorMsg);
      setChatHistory((prev) => [...prev, { 
        type: "bot", 
        message: errorMsg,
        language: "en"
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      askQuestion();
    }
  };

  const themeClasses = isDarkMode
    ? "bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900 text-white"
    : "bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 text-gray-800";

  const cardClasses = isDarkMode
    ? "bg-gray-800 border-gray-700"
    : "bg-white border-gray-100";

  const inputClasses = isDarkMode
    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-pink-400"
    : "bg-white border-gray-200 text-gray-800 placeholder-gray-500 focus:border-pink-400";

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${themeClasses}`}
    >
      {/* Header */}
      <header
        className={`${cardClasses} shadow-sm border-b transition-colors duration-300`}
      >
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-2 rounded-xl">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1
                  className={`text-xl font-bold ${
                    isDarkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  Women's Health Assistant
                </h1>
                <p
                  className={`text-sm ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Cancer Awareness & Support • Auto-Translation
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Translation Status Indicator */}
              {translating && (
                <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                  <Languages className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Translating...</span>
                </div>
              )}

              {/* Language Selector */}
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className={`px-3 py-1 rounded-lg text-sm border transition-colors ${inputClasses}`}
              >
                <option value="en-IN">English (India)</option>
                <option value="bn-IN">বাংলা (India)</option>
              </select>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-yellow-400"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
                title="Toggle theme"
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        {chatHistory.length === 0 && (
          <div className="text-center mb-8">
            <div
              className={`${cardClasses} rounded-2xl shadow-lg p-8 mb-6 transition-colors duration-300`}
            >
              <div
                className={`bg-gradient-to-r from-pink-100 to-purple-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 ${
                  isDarkMode ? "opacity-90" : ""
                }`}
              >
                <MessageCircle className="w-10 h-10 text-pink-600" />
              </div>
              <h2
                className={`text-2xl font-bold mb-3 ${
                  isDarkMode ? "text-white" : "text-gray-800"
                }`}
              >
                Welcome to Your Bilingual Health Assistant
              </h2>
              <p
                className={`mb-6 max-w-2xl mx-auto ${
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Ask me questions in English or Bengali! I'll automatically respond in the opposite language. 
                Get information about women's cancer awareness, prevention, and support with real-time translation.
              </p>

              {/* Auto-Translation Feature Highlight */}
              <div
                className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full mb-4 ${
                  isDarkMode
                    ? "bg-blue-900 text-blue-300 border border-blue-700"
                    : "bg-blue-100 text-blue-700 border border-blue-200"
                }`}
              >
                <Languages className="w-4 h-4" />
                <span className="text-sm">Auto-Translation: English ↔ Bengali</span>
              </div>

              {/* Speech Recognition Status */}
              {speechSupported && (
                <div
                  className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full mb-6 ${
                    isDarkMode
                      ? "bg-green-900 text-green-300"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  <Mic className="w-4 h-4" />
                  <span className="text-sm">Voice recognition enabled</span>
                </div>
              )}

              {/* Quick Action Cards */}
              <div className="grid md:grid-cols-3 gap-4 mt-6">
                <div
                  className={`p-4 rounded-xl border transition-colors ${
                    isDarkMode
                      ? "bg-gradient-to-br from-pink-900 to-pink-800 border-pink-700"
                      : "bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200"
                  }`}
                >
                  <Heart className="w-6 h-6 text-pink-600 mb-2" />
                  <h3
                    className={`font-semibold text-sm ${
                      isDarkMode ? "text-pink-200" : "text-gray-800"
                    }`}
                  >
                    Prevention Tips
                  </h3>
                  <p
                    className={`text-xs ${
                      isDarkMode ? "text-pink-300" : "text-gray-600"
                    }`}
                  >
                    Learn about early detection
                  </p>
                </div>
                <div
                  className={`p-4 rounded-xl border transition-colors ${
                    isDarkMode
                      ? "bg-gradient-to-br from-purple-900 to-purple-800 border-purple-700"
                      : "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200"
                  }`}
                >
                  <Users className="w-6 h-6 text-purple-600 mb-2" />
                  <h3
                    className={`font-semibold text-sm ${
                      isDarkMode ? "text-purple-200" : "text-gray-800"
                    }`}
                  >
                    Support Resources
                  </h3>
                  <p
                    className={`text-xs ${
                      isDarkMode ? "text-purple-300" : "text-gray-600"
                    }`}
                  >
                    Find help and community
                  </p>
                </div>
                <div
                  className={`p-4 rounded-xl border transition-colors ${
                    isDarkMode
                      ? "bg-gradient-to-br from-rose-900 to-rose-800 border-rose-700"
                      : "bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200"
                  }`}
                >
                  <Shield className="w-6 h-6 text-rose-600 mb-2" />
                  <h3
                    className={`font-semibold text-sm ${
                      isDarkMode ? "text-rose-200" : "text-gray-800"
                    }`}
                  >
                    Risk Assessment
                  </h3>
                  <p
                    className={`text-xs ${
                      isDarkMode ? "text-rose-300" : "text-gray-600"
                    }`}
                  >
                    Understand your health
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Interface */}
        <div
          className={`${cardClasses} rounded-2xl shadow-lg overflow-hidden transition-colors duration-300`}
        >
          {/* Chat History */}
          {chatHistory.length > 0 && (
            <div
              className={`max-h-96 overflow-y-auto p-6 space-y-4 border-b ${
                isDarkMode ? "border-gray-700" : "border-gray-100"
              }`}
            >
              {chatHistory.map((chat, index) => (
                <div
                  key={index}
                  className={`flex ${
                    chat.type === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl relative group ${
                      chat.type === "user"
                        ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                        : isDarkMode
                        ? "bg-gray-700 text-gray-200"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">
                      {chat.message}
                    </p>
                    
                    {/* Language indicator */}
                    <div className={`text-xs mt-1 opacity-70 ${
                      chat.type === "user" ? "text-pink-100" : 
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}>
                      {chat.language === "bn" ? "বাংলা" : "English"}
                    </div>
                    
                    {chat.type === "bot" && (
                      <button
                        onClick={() => speakText(chat.message, chat.language)}
                        className={`absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                          isDarkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"
                        }`}
                        title="Read aloud"
                      >
                        <Volume2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {(loading || translating) && (
                <div className="flex justify-start">
                  <div
                    className={`px-4 py-3 rounded-2xl max-w-xs ${
                      isDarkMode
                        ? "bg-gray-700 text-gray-200"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-rose-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                      <span
                        className={`text-sm ${
                          isDarkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {translating ? "Translating..." : "Thinking..."}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Input Section */}
          <div className="p-6">
            <div className="flex space-x-4">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  rows={3}
                  className={`w-full border-2 rounded-xl p-4 pr-12 resize-none focus:outline-none transition-colors ${inputClasses}`}
                  placeholder="Ask in English (get Bengali answer) or in Bengali (get English answer)... (Press Enter to send)"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyPress={handleKeyPress}
                />

                {/* Voice Input Button */}
                {speechSupported && (
                  <button
                    onClick={isListening ? stopListening : startListening}
                    disabled={loading || translating}
                    className={`absolute right-3 top-3 p-2 rounded-lg transition-all duration-200 flex-shrink-0 ${
                      isListening
                        ? "bg-red-500 text-white animate-pulse hover:bg-red-600"
                        : isDarkMode
                        ? "bg-gray-600 hover:bg-gray-500 text-gray-300 disabled:opacity-50"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-600 disabled:opacity-50"
                    }`}
                    title={isListening ? "Stop listening" : "Start voice input"}
                    aria-label={
                      isListening ? "Stop recording" : "Start voice input"
                    }
                  >
                    {isListening ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>

              <button
                onClick={askQuestion}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center min-w-[100px]"
                disabled={loading || translating || !question.trim()}
              >
                {loading || translating ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Voice Status */}
            {isListening && (
              <div className="mt-3 flex items-center justify-center space-x-2 text-red-500">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm">Listening... Speak now</span>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              </div>
            )}

            {/* Translation Feature Info */}
            <div className={`mt-3 p-3 rounded-lg border transition-colors ${
              isDarkMode 
                ? "bg-blue-900 border-blue-700 text-blue-200"
                : "bg-blue-50 border-blue-200 text-blue-800"
            }`}>
              <div className="flex items-center space-x-2">
                <Languages className="w-4 h-4" />
                <p className="text-sm">
                  <strong>Auto-Translation:</strong> Ask in English to get Bengali answers, or ask in Bengali to get English answers!
                </p>
              </div>
            </div>

            {/* Toast Notification */}
            {toast.show && (
              <div
                className={`mt-3 p-3 rounded-lg border transition-all duration-300 ${
                  toast.type === "error"
                    ? isDarkMode
                      ? "bg-red-900 border-red-700 text-red-200"
                      : "bg-red-50 border-red-200 text-red-800"
                    : isDarkMode
                    ? "bg-blue-900 border-blue-700 text-blue-200"
                    : "bg-blue-50 border-blue-200 text-blue-800"
                }`}
              >
                <div className="flex items-start space-x-2">
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{toast.title}</p>
                    <p className="text-xs mt-1">{toast.description}</p>
                  </div>
                  <button
                    onClick={() =>
                      setToast({
                        show: false,
                        title: "",
                        description: "",
                        type: "info",
                      })
                    }
                    className={`text-xs px-2 py-1 rounded hover:opacity-75 ${
                      toast.type === "error" ? "text-red-600" : "text-blue-600"
                    }`}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div
              className={`mt-4 p-3 rounded-lg border transition-colors ${
                isDarkMode
                  ? "bg-amber-900 border-amber-700 text-amber-200"
                  : "bg-amber-50 border-amber-200 text-amber-800"
              }`}
            >
              <p className="text-xs">
                <strong>Medical Disclaimer:</strong> This chatbot provides
                general information only and is not a substitute for
                professional medical advice. Always consult with healthcare
                professionals for medical concerns.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <div
            className={`${cardClasses} rounded-xl shadow-sm p-6 transition-colors duration-300`}
          >
            <div
              className={`flex flex-wrap justify-center items-center space-x-6 text-sm ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
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
                <span>Auto-Translation</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <span>Evidence-Based Information</span>
              </div>
            </div>
            <p
              className={`text-xs mt-3 ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Empowering women with knowledge and support for better health
              outcomes • English ↔ Bengali Translation
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}