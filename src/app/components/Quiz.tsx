'use client';

import React, { useState, useEffect, useRef } from 'react';
import QuizQuestion from './QuizQuestion';
import { questions, QuizState, Answer, calculateScores, categoryLabels, QuestionCategory, QuizResults } from '../data/questions';

interface QuizProps {
  onComplete: (results: QuizResults) => void;
}

const Quiz: React.FC<QuizProps> = ({ onComplete }) => {
  const [state, setState] = useState<QuizState>({
    answers: {},
    currentQuestionIndex: 0,
    completed: false,
    finalResults: null,
  });
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Get unique categories in order they appear
  const categoriesInOrder = questions.reduce<QuestionCategory[]>((acc, q) => {
    if (!acc.includes(q.category)) acc.push(q.category);
    return acc;
  }, []);

  const currentQuestion = questions[state.currentQuestionIndex];
  const currentAnswer = state.answers[currentQuestion?.id];
  const progress = ((state.currentQuestionIndex + 1) / questions.length) * 100;
  
  // Calculate category progress
  const getCategoryProgress = () => {
    const categoryIndex = categoriesInOrder.indexOf(currentQuestion?.category);
    const questionsInCategory = questions.filter(q => q.category === currentQuestion?.category);
    const currentIndexInCategory = questionsInCategory.findIndex(q => q.id === currentQuestion?.id);
    return {
      categoryIndex,
      totalCategories: categoriesInOrder.length,
      questionInCategory: currentIndexInCategory + 1,
      totalInCategory: questionsInCategory.length
    };
  };

  const handleAnswer = (questionId: number, answer: Answer) => {
    setState(prev => {
      const updatedAnswers = { ...prev.answers, [questionId]: answer };
      
      if (prev.currentQuestionIndex === questions.length - 1) {
        const scores = calculateScores(updatedAnswers);
        
        return {
          ...prev,
          answers: updatedAnswers,
          completed: true,
          finalResults: scores,
        };
      }
      
      return {
        ...prev,
        answers: updatedAnswers,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
      };
    });
  };

  const handlePrevious = () => {
    setState(prev => ({
      ...prev,
      currentQuestionIndex: Math.max(0, prev.currentQuestionIndex - 1),
    }));
  };

  const handleSkip = () => {
    setState(prev => {
      if (prev.currentQuestionIndex === questions.length - 1) {
        const scores = calculateScores(prev.answers);
        return { ...prev, completed: true, finalResults: scores };
      }
      return {
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
      };
    });
  };

  const categoryProgress = getCategoryProgress();

  useEffect(() => {
    if (state.completed && state.finalResults) {
      onCompleteRef.current(state.finalResults);
    }
  }, [state.completed, state.finalResults]);

  if (state.completed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold mb-2 text-white">Calculating Your Results</h2>
          <p className="text-slate-400">Analyzing your political alignment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Header */}
        <div className="mb-8">
          {/* Category indicator */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{categoryLabels[currentQuestion.category].split(' ')[0]}</span>
              <div>
                <div className="text-sm font-medium text-white">
                  {categoryLabels[currentQuestion.category].slice(2)}
                </div>
                <div className="text-xs text-slate-400">
                  Category {categoryProgress.categoryIndex + 1} of {categoryProgress.totalCategories}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-white">
                {state.currentQuestionIndex + 1}/{questions.length}
              </div>
              <div className="text-xs text-slate-400">
                Q{categoryProgress.questionInCategory} of {categoryProgress.totalInCategory} in section
              </div>
            </div>
          </div>
          
          {/* Main progress bar */}
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Category progress dots */}
          <div className="flex justify-center gap-2 mt-4">
            {categoriesInOrder.map((cat, idx) => (
              <div
                key={cat}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx < categoryProgress.categoryIndex 
                    ? 'bg-amber-500' 
                    : idx === categoryProgress.categoryIndex 
                      ? 'bg-amber-500 ring-2 ring-amber-500/30 ring-offset-2 ring-offset-slate-900' 
                      : 'bg-slate-700'
                }`}
                title={categoryLabels[cat]}
              />
            ))}
          </div>
        </div>
        
        {/* Question Card */}
        <QuizQuestion
          question={currentQuestion}
          onAnswer={handleAnswer}
          currentAnswer={currentAnswer}
          questionNumber={state.currentQuestionIndex + 1}
          totalQuestions={questions.length}
        />
        
        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <button
            className={`px-4 py-2 text-sm rounded-lg transition-all ${
              state.currentQuestionIndex > 0
                ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                : 'text-slate-600 cursor-not-allowed'
            }`}
            onClick={handlePrevious}
            disabled={state.currentQuestionIndex === 0}
          >
            ← Previous
          </button>
          
          <button
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-300 transition-all"
            onClick={handleSkip}
          >
            Skip Question
          </button>
        </div>
        
        {/* Keyboard hint */}
        <div className="text-center mt-6">
          <p className="text-xs text-slate-500">
            Tip: Use number keys 1-5 to quickly answer questions
          </p>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
