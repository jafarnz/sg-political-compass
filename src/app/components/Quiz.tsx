import React, { useState } from 'react';
import QuizQuestion from './QuizQuestion';
import { questions, QuizState, Answer, calculateScores } from '../data/questions';

interface QuizProps {
  onComplete: (results: {
    economicScore: number;
    socialScore: number;
    scoresByParty: {
      pap: number;  
      wp: number;
      sdp: number;
      psp: number;
    };
  }) => void;
}

const Quiz: React.FC<QuizProps> = ({ onComplete }) => {
  const [state, setState] = useState<QuizState>({
    answers: {},
    currentQuestionIndex: 0,
    economicScore: 0,
    socialScore: 0,
    scoresByParty: {
      pap: 0,
      wp: 0,
      sdp: 0,
      psp: 0,
    },
    completed: false,
  });

  const handleAnswer = (questionId: number, answer: Answer) => {
    setState(prev => {
      const updatedAnswers = { ...prev.answers, [questionId]: answer };
      
      // If this is the last question, calculate final scores
      if (prev.currentQuestionIndex === questions.length - 1) {
        const scores = calculateScores(updatedAnswers);
        
        // Notify parent component about completion
        onComplete(scores);
        
        return {
          ...prev,
          answers: updatedAnswers,
          economicScore: scores.economicScore,
          socialScore: scores.socialScore,
          scoresByParty: scores.scoresByParty,
          completed: true,
        };
      }
      
      // Otherwise move to next question
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

  const currentQuestion = questions[state.currentQuestionIndex];
  const currentAnswer = state.answers[currentQuestion.id];
  const progress = ((state.currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="container mx-auto px-4 py-8">
      {!state.completed ? (
        <>
          <div className="mb-8">
            <div className="h-2 bg-gray-200 rounded-full">
              <div 
                className="h-2 bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Question {state.currentQuestionIndex + 1} of {questions.length}
            </div>
          </div>
          
          <QuizQuestion
            question={currentQuestion}
            onAnswer={handleAnswer}
            currentAnswer={currentAnswer}
          />
          
          {state.currentQuestionIndex > 0 && (
            <div className="mt-8 text-center">
              <button
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                onClick={handlePrevious}
              >
                ← Previous Question
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Quiz Completed!</h2>
          <p>Your results are being calculated...</p>
        </div>
      )}
    </div>
  );
};

export default Quiz; 