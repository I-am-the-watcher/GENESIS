import React from 'react';
import { StudyAidType } from '../types';

interface StudyAidSelectorProps {
  selectedType: StudyAidType;
  onTypeChange: (type: StudyAidType) => void;
}

const studyAidOptions = [
  { id: StudyAidType.SUMMARY, name: 'Summary' },
  { id: StudyAidType.FLASHCARDS, name: 'Flashcards' },
  { id: StudyAidType.QUIZ, name: 'Quiz' },
  { id: StudyAidType.Q_AND_A, name: 'Q&A' },
];

const StudyAidSelector: React.FC<StudyAidSelectorProps> = ({ selectedType, onTypeChange }) => {
  return (
    <div className="flex space-x-2 bg-slate-100 dark:bg-slate-700/50 p-1 rounded-lg">
      {studyAidOptions.map((option) => (
        <button
          key={option.id}
          onClick={() => onTypeChange(option.id)}
          className={`w-full px-3 py-2 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none ${
            selectedType === option.id
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-600/60'
          }`}
        >
          {option.name}
        </button>
      ))}
    </div>
  );
};

export default StudyAidSelector;
