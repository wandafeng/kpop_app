import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Music, User, CreditCard, Star, ChevronLeft, RefreshCw, Trophy, Heart } from 'lucide-react';

// --- Configuration & Types ---

const GAME_MODES = {
  SONG: 'song',
  IDOL: 'idol',
  CARD: 'card',
  MENU: 'menu'
} as const;

type GameMode = typeof GAME_MODES[keyof typeof GAME_MODES];

interface Question {
  questionText: string;
  details?: string; // Additional info like lyrics or member name
  options: string[];
  correctAnswer: string;
  explanation: string;
}

// --- Gemini API Logic ---

const getQuestionSchema = (): Schema => {
  return {
    type: Type.OBJECT,
    properties: {
      questionText: { type: Type.STRING, description: "The main question or description" },
      details: { type: Type.STRING, description: "Supplemental info (e.g. lyrics, hints, card details)" },
      options: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "A list of 4 possible answers"
      },
      correctAnswer: { type: Type.STRING, description: "The exact string from the options list that is correct" },
      explanation: { type: Type.STRING, description: "Brief explanation why it is correct" }
    },
    required: ["questionText", "options", "correctAnswer", "explanation"]
  };
};

const fetchGameQuestion = async (mode: GameMode): Promise<Question> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let prompt = "";
  let systemInstruction = "";

  if (mode === GAME_MODES.SONG) {
    systemInstruction = "You are a K-pop expert. Generate a trivia question about a famous K-pop song. The question should either provide translated lyrics (English or Traditional Chinese), a description of a key dance move, or a description of the MV.";
    prompt = "Generate a multiple choice question where the user guesses the K-pop Song Title. Provide 4 realistic song options.";
  } else if (mode === GAME_MODES.IDOL) {
    systemInstruction = "You are a K-pop expert. Describe a popular K-pop idol without naming them directly. Use clues like their group position, a famous nickname, a unique talent, or a specific viral moment.";
    prompt = "Generate a multiple choice question where the user guesses the Idol's Name. Provide 4 options (names).";
  } else if (mode === GAME_MODES.CARD) {
    systemInstruction = "You are a K-pop photocard trading expert. Describe a specific, real K-pop photocard (Group, Member, Album/Event, Version). Estimate its market value range in USD.";
    prompt = "Generate a question asking the user to guess the price range of a specific photocard. The options should be price ranges (e.g., '$5 - $10', '$30 - $50'). Make sure the description is detailed (e.g., 'Wonyoung Love Dive Broadcast Card').";
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: getQuestionSchema(),
      temperature: 1, // High temperature for variety
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  return JSON.parse(text) as Question;
};

// --- Components ---

const Button = ({ onClick, children, className = "", variant = "primary", disabled = false }: any) => {
  const baseStyle = "w-full font-bold py-3 px-6 rounded-2xl transition-all duration-200 transform active:scale-95 flex items-center justify-center gap-2 shadow-lg";
  const variants = {
    primary: "bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:shadow-pink-500/30",
    secondary: "bg-white/10 text-white hover:bg-white/20 border border-white/20",
    success: "bg-green-500 text-white",
    danger: "bg-red-500 text-white",
    glass: "glass-panel text-white hover:bg-white/10"
  };
  
  // @ts-ignore
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
};

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center py-12 space-y-4">
    <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
    <p className="text-pink-200 font-medium animate-pulse">正在為您生成題目...</p>
  </div>
);

const ResultView = ({ isCorrect, explanation, onNext }: { isCorrect: boolean, explanation: string, onNext: () => void }) => (
  <div className="animate-pop flex flex-col items-center space-y-6 text-center p-6 bg-black/40 rounded-3xl border border-white/10 backdrop-blur-md">
    <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-xl ${isCorrect ? 'bg-green-500 text-white shadow-green-500/50' : 'bg-red-500 text-white shadow-red-500/50'}`}>
      {isCorrect ? '✓' : '✗'}
    </div>
    
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">{isCorrect ? "答對了！大發！" : "哎呀，答錯了！"}</h2>
      <p className="text-gray-300 leading-relaxed">{explanation}</p>
    </div>

    <Button onClick={onNext} variant="primary">
      下一題
    </Button>
  </div>
);

// --- Game Logic Component ---

const GameSession = ({ mode, onBack, updateScore }: { mode: GameMode, onBack: () => void, updateScore: (points: number) => void }) => {
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [streak, setStreak] = useState(0);

  const loadQuestion = async () => {
    setLoading(true);
    setQuestion(null);
    setSelectedOption(null);
    setIsCorrect(null);
    
    try {
      const q = await fetchGameQuestion(mode);
      setQuestion(q);
    } catch (error) {
      console.error(error);
      // Simple retry logic or error display could go here
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestion();
  }, [mode]);

  const handleAnswer = (option: string) => {
    if (selectedOption) return; // Prevent double clicking
    
    setSelectedOption(option);
    const correct = option === question?.correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      setStreak(s => s + 1);
      updateScore(10 + (streak * 2)); // Bonus for streaks
    } else {
      setStreak(0);
    }
  };

  const getModeTitle = () => {
    switch(mode) {
      case GAME_MODES.SONG: return "K-POP 猜歌";
      case GAME_MODES.IDOL: return "本命是誰";
      case GAME_MODES.CARD: return "小卡鑑價";
      default: return "";
    }
  };

  const getModeIcon = () => {
    switch(mode) {
      case GAME_MODES.SONG: return <Music className="w-6 h-6" />;
      case GAME_MODES.IDOL: return <User className="w-6 h-6" />;
      case GAME_MODES.CARD: return <CreditCard className="w-6 h-6" />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 text-xl font-bold text-white">
          {getModeIcon()}
          <span>{getModeTitle()}</span>
        </div>
        <div className="w-10"></div> {/* Spacer for center alignment */}
      </div>

      {/* Streak Badge */}
      {streak > 1 && (
        <div className="self-center mb-4 px-4 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/50 text-sm font-bold flex items-center gap-1 animate-pulse">
          <Star className="w-3 h-3 fill-current" /> {streak} 連勝中!
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-6">
        {loading ? (
          <LoadingSpinner />
        ) : question ? (
          <div className="space-y-6">
            
            {/* Question Card */}
            <div className="glass-panel p-6 rounded-3xl text-white shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                 {getModeIcon()}
               </div>
               
               <h3 className="text-lg font-medium text-purple-200 mb-2">題目</h3>
               <p className="text-xl font-bold leading-relaxed mb-4">{question.questionText}</p>
               
               {question.details && (
                 <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                   <p className="text-gray-300 italic">"{question.details}"</p>
                 </div>
               )}
            </div>

            {/* Options or Result */}
            {isCorrect !== null ? (
              <ResultView 
                isCorrect={isCorrect} 
                explanation={question.explanation} 
                onNext={loadQuestion} 
              />
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {question.options.map((option, idx) => (
                  <Button 
                    key={idx} 
                    onClick={() => handleAnswer(option)}
                    variant="secondary"
                    className="justify-start text-left h-auto py-4"
                  >
                    <span className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {option}
                  </Button>
                ))}
              </div>
            )}
            
          </div>
        ) : (
          <div className="text-center text-white">
            <p>載入失敗，請重試。</p>
            <Button onClick={loadQuestion} variant="secondary" className="mt-4">重試</Button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main App Component ---

const App = () => {
  const [currentMode, setCurrentMode] = useState<GameMode>(GAME_MODES.MENU);
  const [score, setScore] = useState(0);

  const handleScoreUpdate = (points: number) => {
    setScore(s => s + points);
  };

  // Main Menu View
  if (currentMode === GAME_MODES.MENU) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col p-6 font-sans">
        
        {/* App Header */}
        <div className="flex justify-between items-center mb-10 mt-4">
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
              K-Stan Master
            </h1>
            <p className="text-purple-300 text-sm">追星大師</p>
          </div>
          <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-2 text-white">
            <Heart className="w-4 h-4 text-pink-500 fill-current" />
            <span className="font-bold">{score}</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative mb-10 p-8 rounded-3xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-2xl shine-effect overflow-hidden transform hover:scale-[1.02] transition-transform duration-300">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-yellow-300" />
              <span className="font-bold text-yellow-300 tracking-wider">每日挑戰</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">準備好證明你的本命愛了嗎？</h2>
            <p className="text-white/80 text-sm">選擇一個模式開始累積你的 Fan Points！</p>
          </div>
          <div className="absolute right-0 bottom-0 opacity-20 transform translate-x-4 translate-y-4">
            <Star size={120} />
          </div>
        </div>

        {/* Game Menu Grid */}
        <div className="grid gap-4">
          <button 
            onClick={() => setCurrentMode(GAME_MODES.SONG)}
            className="group glass-panel p-6 rounded-3xl flex items-center gap-4 transition-all hover:bg-white/20 active:scale-95 text-left border-l-4 border-pink-500"
          >
            <div className="bg-pink-500/20 p-4 rounded-2xl group-hover:bg-pink-500 group-hover:text-white transition-colors text-pink-400">
              <Music size={28} />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">K-POP 猜歌</h3>
              <p className="text-gray-400 text-sm">聽歌詞、猜舞步、神曲大考驗</p>
            </div>
          </button>

          <button 
            onClick={() => setCurrentMode(GAME_MODES.IDOL)}
            className="group glass-panel p-6 rounded-3xl flex items-center gap-4 transition-all hover:bg-white/20 active:scale-95 text-left border-l-4 border-purple-500"
          >
            <div className="bg-purple-500/20 p-4 rounded-2xl group-hover:bg-purple-500 group-hover:text-white transition-colors text-purple-400">
              <User size={28} />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">猜人遊戲</h3>
              <p className="text-gray-400 text-sm">這些線索是在說誰呢？</p>
            </div>
          </button>

          <button 
            onClick={() => setCurrentMode(GAME_MODES.CARD)}
            className="group glass-panel p-6 rounded-3xl flex items-center gap-4 transition-all hover:bg-white/20 active:scale-95 text-left border-l-4 border-blue-500"
          >
            <div className="bg-blue-500/20 p-4 rounded-2xl group-hover:bg-blue-500 group-hover:text-white transition-colors text-blue-400">
              <CreditCard size={28} />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">小卡鑑價</h3>
              <p className="text-gray-400 text-sm">這張卡現在市價多少？</p>
            </div>
          </button>
        </div>

        <div className="mt-auto pt-8 text-center text-white/30 text-xs">
          Powered by Google Gemini
        </div>
      </div>
    );
  }

  // Game View
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 p-6 font-sans">
      <GameSession 
        mode={currentMode} 
        onBack={() => setCurrentMode(GAME_MODES.MENU)} 
        updateScore={handleScoreUpdate}
      />
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
