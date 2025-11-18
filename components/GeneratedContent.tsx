import React, { useState, useEffect, useRef } from 'react';
import { StudyAidType, Flashcard, QuizQuestion, ChatMessage } from '../types';
import { FlipIcon as RefreshIcon, SendIcon } from './icons';

// --- Summary View ---
const SummaryView = ({ content }: { content: string }) => {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none">
      {/* Split by newline to respect paragraph breaks from the AI response */}
      {content.split('\n').map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </article>
  );
};

// --- Flashcards View ---
const FlipIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const FlashcardsView = ({ content }: { content: Flashcard[] }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
        setCurrentIndex(0);
        setIsFlipped(false);
    }, [content]);

    const goToCard = (index: number) => {
        if (isFlipped) {
            setIsFlipped(false);
            setTimeout(() => {
                setCurrentIndex(index);
            }, 300);
        } else {
            setCurrentIndex(index);
        }
    };

    const nextCard = () => goToCard((currentIndex + 1) % content.length);
    const prevCard = () => goToCard((currentIndex - 1 + content.length) % content.length);

    if (!content || content.length === 0) {
        return <p className="text-center text-slate-500 dark:text-slate-400">No flashcards were generated. Try a different image or prompt.</p>;
    }

    const currentCard = content[currentIndex];

    return (
        <div className="flex flex-col items-center">
            <div className="w-full max-w-md h-64 mb-4 [perspective:1000px]">
                <div
                    className={`relative w-full h-full cursor-pointer transition-transform duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
                    onClick={() => setIsFlipped(!isFlipped)}
                    aria-live="polite"
                >
                    <div className="absolute w-full h-full flex items-center justify-center p-6 bg-white dark:bg-slate-700 rounded-lg shadow-lg [backface-visibility:hidden] [transform:rotateY(0deg)] transform-gpu">
                        <p className="text-xl font-semibold text-slate-800 dark:text-slate-100">{currentCard.term}</p>
                    </div>
                    <div className="absolute w-full h-full flex items-center justify-center p-6 bg-indigo-600 text-white rounded-lg shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)] transform-gpu">
                         <p className="text-md">{currentCard.definition}</p>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2 mb-4 text-slate-500 dark:text-slate-400 text-sm">
                <span>Click card to flip</span> <FlipIcon className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between w-full max-w-md">
                <button onClick={prevCard} disabled={content.length <= 1} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium">Prev</button>
                <span className="font-mono">{currentIndex + 1} / {content.length}</span>
                <button onClick={nextCard} disabled={content.length <= 1} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium">Next</button>
            </div>
        </div>
    );
};

// --- Quiz View ---
const QuizView = ({ content }: { content: QuizQuestion[] }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({});
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        setCurrentQuestionIndex(0);
        setSelectedAnswers({});
        setShowResults(false);
    }, [content]);

    if (!content || content.length === 0) {
        return <p className="text-center text-slate-500 dark:text-slate-400">No quiz questions were generated.</p>;
    }

    const handleAnswerSelect = (option: string) => {
        setSelectedAnswers({ ...selectedAnswers, [currentQuestionIndex]: option });
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < content.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            setShowResults(true);
        }
    };

    const resetQuiz = () => {
        setCurrentQuestionIndex(0);
        setSelectedAnswers({});
        setShowResults(false);
    }

    if (showResults) {
        const score = content.reduce((acc, q, i) => acc + (selectedAnswers[i] === q.correctAnswer ? 1 : 0), 0);
        return (
            <div className="text-center">
                <h3 className="text-2xl font-bold mb-4">Quiz Results</h3>
                <p className="text-xl mb-4">You scored {score} out of {content.length}!</p>
                <div className="space-y-4 text-left">
                    {content.map((q, i) => (
                        <div key={i} className={`p-4 rounded-lg ${selectedAnswers[i] === q.correctAnswer ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                            <p className="font-semibold">{i + 1}. {q.question}</p>
                            <p>Your answer: <span className="font-medium">{selectedAnswers[i] || "Not answered"}</span></p>
                            {selectedAnswers[i] !== q.correctAnswer && <p>Correct answer: <span className="font-medium">{q.correctAnswer}</span></p>}
                        </div>
                    ))}
                </div>
                <button onClick={resetQuiz} className="mt-6 flex items-center justify-center gap-2 mx-auto bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700">
                    <RefreshIcon className="w-5 h-5" /> Try Again
                </button>
            </div>
        )
    }

    const currentQuestion = content[currentQuestionIndex];
    const selectedOption = selectedAnswers[currentQuestionIndex];

    return (
        <div>
            <div className="mb-2">
                <span className="font-semibold">Question {currentQuestionIndex + 1} of {content.length}</span>
                <p className="text-lg mt-1">{currentQuestion.question}</p>
            </div>
            <div className="space-y-2 my-4">
                {currentQuestion.options.map((option, index) => (
                    <button key={index} onClick={() => handleAnswerSelect(option)} className={`w-full text-left p-3 rounded-lg border transition-colors ${ selectedOption === option ? 'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-500' : 'bg-slate-100 dark:bg-slate-700/50 border-slate-300 dark:border-slate-600 hover:bg-slate-200/70 dark:hover:bg-slate-600/50'}`}>
                        {option}
                    </button>
                ))}
            </div>
            <button onClick={handleNextQuestion} disabled={!selectedOption} className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed">
                {currentQuestionIndex < content.length - 1 ? 'Next Question' : 'Show Results'}
            </button>
        </div>
    );
};

// --- Q&A View ---
const QAndAView = ({ content, onSendMessage, isReplying }: { content: ChatMessage[], onSendMessage: (message: string) => void, isReplying: boolean }) => {
    const [question, setQuestion] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(scrollToBottom, [content]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (question.trim() && !isReplying) {
            onSendMessage(question);
            setQuestion('');
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                {content.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-prose p-3 rounded-lg ${message.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                            {message.text}
                        </div>
                    </div>
                ))}
                {isReplying && (
                    <div className="flex justify-start">
                         <div className="max-w-prose p-3 rounded-lg bg-slate-200 dark:bg-slate-700">
                             <div className="flex items-center justify-center gap-2">
                                 <div className="h-2 w-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                 <div className="h-2 w-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                 <div className="h-2 w-2 bg-slate-500 rounded-full animate-bounce"></div>
                            </div>
                         </div>
                     </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
                <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask a question..."
                    disabled={isReplying}
                    className="flex-grow p-2 rounded-lg bg-slate-100 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button type="submit" disabled={isReplying || !question.trim()} className="bg-indigo-600 text-white p-2 rounded-lg disabled:bg-indigo-400 hover:bg-indigo-700 transition-colors">
                    <SendIcon className="w-5 h-5" />
                </button>
            </form>
        </div>
    )
}

// --- Main GeneratedContent Component ---
interface GeneratedContentProps {
    type: StudyAidType;
    content: string | Flashcard[] | QuizQuestion[] | ChatMessage[];
    onSendMessage?: (message: string) => void;
    isReplying?: boolean;
}

const GeneratedContent: React.FC<GeneratedContentProps> = ({ type, content, onSendMessage, isReplying }) => {
  if (!content) return null;

  switch (type) {
    case StudyAidType.SUMMARY:
      return <SummaryView content={content as string} />;
    case StudyAidType.FLASHCARDS:
      return <FlashcardsView content={content as Flashcard[]} />;
    case StudyAidType.QUIZ:
      return <QuizView content={content as QuizQuestion[]} />;
    case StudyAidType.Q_AND_A:
      return <QAndAView content={content as ChatMessage[]} onSendMessage={onSendMessage!} isReplying={isReplying!} />;
    default:
      return null;
  }
};

export default GeneratedContent;
