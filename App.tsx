import React, { useState, useCallback } from 'react';
import { StudyAidType, Flashcard, QuizQuestion, ChatMessage } from './types';
import { generateStudyAid, askQnAQuestion } from './services/geminiService';
import FileUpload from './components/FileUpload';
import StudyAidSelector from './components/StudyAidSelector';
import GeneratedContent from './components/GeneratedContent';
import Loader from './components/Loader';
import { LogoIcon, SparklesIcon } from './components/icons';

const App: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [studyAidType, setStudyAidType] = useState<StudyAidType>(StudyAidType.SUMMARY);
  const [generatedContent, setGeneratedContent] = useState<string | Flashcard[] | QuizQuestion[] | ChatMessage[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isReplying, setIsReplying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!imageFile) {
      setError('Please upload an image first.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedContent(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(imageFile);
      reader.onloadend = async () => {
        const base64data = (reader.result as string).split(',')[1];
        try {
          const content = await generateStudyAid(base64data, imageFile.type, studyAidType);
          if (studyAidType === StudyAidType.Q_AND_A && typeof content === 'string') {
            setGeneratedContent([{ role: 'model', text: content }]);
          } else {
            setGeneratedContent(content);
          }
        } catch (e) {
          console.error(e);
          setError('Failed to generate study materials. Please check the console for details.');
        } finally {
          setIsLoading(false);
        }
      };
      reader.onerror = () => {
        setError('Failed to read the image file.');
        setIsLoading(false);
      };
    } catch (e) {
      console.error(e);
      setError('An unexpected error occurred.');
      setIsLoading(false);
    }
  }, [imageFile, studyAidType]);

  const handleFileChange = (file: File | null) => {
    setImageFile(file);
    setGeneratedContent(null);
    setError(null);
  };
  
  const handleSendMessage = async (question: string) => {
    if (!imageFile || !generatedContent || !Array.isArray(generatedContent) || studyAidType !== StudyAidType.Q_AND_A) return;

    const currentHistory = generatedContent as ChatMessage[];
    const updatedHistory: ChatMessage[] = [...currentHistory, { role: 'user', text: question }];
    setGeneratedContent(updatedHistory);
    setIsReplying(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(imageFile);
      reader.onloadend = async () => {
        const base64data = (reader.result as string).split(',')[1];
        try {
          const responseText = await askQnAQuestion(base64data, imageFile.type, currentHistory, question);
          setGeneratedContent([...updatedHistory, { role: 'model', text: responseText }]);
        } catch(e) {
          console.error(e);
          setGeneratedContent([...updatedHistory, { role: 'model', text: "Sorry, I encountered an error. Please try again." }]);
        } finally {
          setIsReplying(false);
        }
      };
      reader.onerror = () => {
         setGeneratedContent([...updatedHistory, { role: 'model', text: "Sorry, I couldn't read the image file again." }]);
         setIsReplying(false);
      }
    } catch (e) {
        console.error(e);
        setGeneratedContent([...updatedHistory, { role: 'model', text: "An unexpected error occurred." }]);
        setIsReplying(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      <div className="container mx-auto px-4 py-8">
        <header className="flex items-center justify-center sm:justify-start mb-8">
          <LogoIcon />
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white ml-3">
            Smart Study Companion
          </h1>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">1. Upload Your Notes</h2>
            <FileUpload onFileChange={handleFileChange} />
            
            {imageFile && (
              <>
                <h2 className="text-xl font-semibold mt-6 mb-4 text-slate-900 dark:text-white">2. Choose Your Study Aid</h2>
                <StudyAidSelector selectedType={studyAidType} onTypeChange={setStudyAidType} />
                <button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="mt-6 w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isLoading ? 'Generating...' : 'Generate'}
                  {!isLoading && <SparklesIcon />}
                </button>
              </>
            )}
          </div>

          <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl shadow-lg flex flex-col min-h-[400px]">
            <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Your Personalized Study Materials</h2>
            <div className="flex-grow relative">
                {isLoading && <Loader />}
                {error && <div className="text-red-500 bg-red-100 dark:bg-red-900/30 p-4 rounded-lg">{error}</div>}
                {generatedContent && (
                    <GeneratedContent 
                        type={studyAidType} 
                        content={generatedContent}
                        onSendMessage={studyAidType === StudyAidType.Q_AND_A ? handleSendMessage : undefined}
                        isReplying={isReplying}
                    />
                )}
                {!isLoading && !error && !generatedContent && (
                  <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 dark:text-slate-400">
                    <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-full mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                    </div>
                    <p>Your generated materials will appear here.</p>
                    <p className="text-sm mt-1">Upload an image and choose a study aid to get started.</p>
                  </div>
                )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
