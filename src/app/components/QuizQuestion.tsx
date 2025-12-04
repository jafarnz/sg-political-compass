'use client';

import React, { useEffect, useCallback } from 'react';
import { Question, Answer, categoryLabels } from '../data/questions';

interface QuizQuestionProps {
  question: Question;
  onAnswer: (questionId: number, answer: Answer) => void;
  currentAnswer: Answer | undefined;
  questionNumber: number;
  totalQuestions: number;
}

const QuizQuestion: React.FC<QuizQuestionProps> = ({ 
  question, 
  onAnswer, 
  currentAnswer,
  questionNumber,
  totalQuestions
}) => {
  const options: { value: Answer; label: string; color: string; bgColor: string }[] = [
    { value: 2, label: 'Strongly Agree', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20 border-emerald-500/40 hover:bg-emerald-500/30' },
    { value: 1, label: 'Agree', color: 'text-emerald-300', bgColor: 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20' },
    { value: 0, label: 'Neutral', color: 'text-slate-400', bgColor: 'bg-slate-500/10 border-slate-500/20 hover:bg-slate-500/20' },
    { value: -1, label: 'Disagree', color: 'text-rose-300', bgColor: 'bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20' },
    { value: -2, label: 'Strongly Disagree', color: 'text-rose-400', bgColor: 'bg-rose-500/20 border-rose-500/40 hover:bg-rose-500/30' },
  ];

  // Keyboard navigation
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    const keyMap: Record<string, Answer> = {
      '1': 2,
      '2': 1,
      '3': 0,
      '4': -1,
      '5': -2
    };
    
    if (keyMap[e.key] !== undefined) {
      onAnswer(question.id, keyMap[e.key]);
    }
  }, [question.id, onAnswer]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const getSelectedStyle = (value: Answer) => {
    if (currentAnswer !== value) return '';
    
    switch (value) {
      case 2: return 'ring-2 ring-emerald-500 bg-emerald-500/30';
      case 1: return 'ring-2 ring-emerald-400 bg-emerald-500/20';
      case 0: return 'ring-2 ring-slate-400 bg-slate-500/20';
      case -1: return 'ring-2 ring-rose-400 bg-rose-500/20';
      case -2: return 'ring-2 ring-rose-500 bg-rose-500/30';
      default: return '';
    }
  };

  return (
    <div className="question-card p-8 rounded-2xl">
      {/* Weight indicator */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full ${
            question.axis === 'economic' 
              ? 'bg-blue-500/20 text-blue-400' 
              : 'bg-purple-500/20 text-purple-400'
          }`}>
            {question.axis === 'economic' ? '📊 Economic' : '⚖️ Social'}
          </span>
          {question.weight > 1 && (
            <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-400">
              {'★'.repeat(question.weight)} Important
            </span>
          )}
        </div>
      </div>
      
      {/* Question text */}
      <h3 className="text-xl md:text-2xl font-semibold text-white mb-8 leading-relaxed">
        {question.text}
      </h3>
      
      {/* Answer options */}
      <div className="space-y-3">
        {options.map((option, index) => (
          <button
            key={option.value}
            className={`
              w-full py-4 px-6 rounded-xl border transition-all duration-200
              flex items-center justify-between group
              ${option.bgColor}
              ${getSelectedStyle(option.value)}
            `}
            onClick={() => onAnswer(question.id, option.value)}
          >
            <span className={`font-medium ${currentAnswer === option.value ? option.color : 'text-slate-300'}`}>
              {option.label}
            </span>
            <span className="text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
              Press {index + 1}
            </span>
          </button>
        ))}
      </div>
      
      {/* Navigation hint */}
      <div className="mt-6 pt-4 border-t border-slate-700/50">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Question {questionNumber} of {totalQuestions}</span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">1</kbd>
            <span>-</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">5</kbd>
            <span className="ml-1">to answer</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default QuizQuestion;
