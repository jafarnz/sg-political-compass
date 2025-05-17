import React from 'react';
import { Question, Answer } from '../data/questions';

interface QuizQuestionProps {
  question: Question;
  onAnswer: (questionId: number, answer: Answer) => void;
  currentAnswer: Answer | undefined;
}

const QuizQuestion: React.FC<QuizQuestionProps> = ({ question, onAnswer, currentAnswer }) => {
  const options = [
    { value: 2, label: 'Strongly Agree' },
    { value: 1, label: 'Agree' },
    { value: 0, label: 'Neutral' },
    { value: -1, label: 'Disagree' },
    { value: -2, label: 'Strongly Disagree' },
  ];

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h3 className="text-xl font-bold mb-4">{question.text}</h3>
      
      <div className="flex flex-col space-y-3 mt-6">
        {options.map((option) => (
          <button
            key={option.value}
            className={`py-3 px-4 rounded-md transition-colors ${
              currentAnswer === option.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            onClick={() => onAnswer(question.id, option.value as Answer)}
          >
            {option.label}
          </button>
        ))}
      </div>
      
      <div className="mt-6 text-sm text-gray-500">
        Question {question.id} of 50 • {question.category === 'economic' ? 'Economic' : 'Social'} Issue
      </div>
    </div>
  );
};

export default QuizQuestion; 