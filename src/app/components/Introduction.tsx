import React from 'react';
import { parties } from '../data/parties';

interface IntroductionProps {
  onStartQuiz: () => void;
}

const Introduction: React.FC<IntroductionProps> = ({ onStartQuiz }) => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-center">
      <h1 className="text-4xl font-bold mb-6">Singapore Political Compass</h1>
      <h2 className="text-2xl mb-8">Where do you stand on Singapore's political spectrum?</h2>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
        <p className="mb-4">
          Welcome to the Singapore Political Compass! This quiz will help you understand where your political views
          align with Singapore's major political parties:
        </p>
        
        {/* Party Logos */}
        <div className="flex justify-center flex-wrap gap-4 my-6">
          {parties.map(party => (
            <div key={party.id} className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full border-2 p-1 flex items-center justify-center bg-white overflow-hidden" style={{ borderColor: party.color }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={party.logoPath} 
                  alt={`${party.name} logo`} 
                  className="w-12 h-12 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.style.backgroundColor = party.color;
                    target.parentElement!.innerHTML = `<span class="text-white font-bold text-2xl">${party.shortName}</span>`;
                  }}
                />
              </div>
              <span className="mt-1 text-sm font-medium">{party.shortName}</span>
            </div>
          ))}
        </div>
        
        <p className="mb-4">
          The quiz consists of 50 questions across two dimensions:
        </p>
        
        <div className="grid md:grid-cols-2 gap-6 my-8">
          <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
            <h3 className="text-lg font-bold mb-2">Economic Axis</h3>
            <p>
              <strong>Left:</strong> Favors redistribution, social safety nets, public services
            </p>
            <p>
              <strong>Right:</strong> Supports free markets, low taxes, fiscal prudence
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
            <h3 className="text-lg font-bold mb-2">Social Axis</h3>
            <p>
              <strong>Libertarian:</strong> Prioritizes civil liberties, personal freedom
            </p>
            <p>
              <strong>Authoritarian:</strong> Emphasizes social order, traditional values
            </p>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-bold mb-2">About the Quiz</h3>
          <ul className="text-left list-disc pl-5">
            <li>50 questions (25 economic, 25 social)</li>
            <li>Takes about 10-15 minutes to complete</li>
            <li>Your answers are not stored or shared</li>
            <li>Based on 2025 party manifestos and policy positions</li>
          </ul>
        </div>
        
        <div>
          <h3 className="text-lg font-bold mb-2">Instructions</h3>
          <p className="mb-4">
            For each statement, select how strongly you agree or disagree. Try to answer honestly
            rather than how you think you "should" answer.
          </p>
        </div>
      </div>
      
      <button
        onClick={onStartQuiz}
        className="px-8 py-4 bg-blue-600 text-white text-lg font-bold rounded-lg hover:bg-blue-700 transition"
      >
        Start the Quiz
      </button>
    </div>
  );
};

export default Introduction; 