import React from 'react';
import PoliticalCompass from './PoliticalCompass';
import { parties, getClosestParty } from '../data/parties';

interface ResultsProps {
  economicScore: number;
  socialScore: number;
  scoresByParty: {
    pap: number;
    wp: number;
    sdp: number;
    psp: number;
  };
  onReset: () => void;
}

const Results: React.FC<ResultsProps> = ({ economicScore, socialScore, scoresByParty, onReset }) => {
  const closestParty = getClosestParty(economicScore, socialScore);
  
  // Sort parties by score
  const sortedParties = [...parties].sort((a, b) => {
    const scoreA = scoresByParty[a.id as keyof typeof scoresByParty];
    const scoreB = scoresByParty[b.id as keyof typeof scoresByParty];
    return scoreB - scoreA;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Your Singapore Political Compass Results</h1>
        <p className="text-lg mb-4">
          See where you stand on Singapore's political spectrum
        </p>
      </div>

      <PoliticalCompass 
        economicScore={economicScore} 
        socialScore={socialScore} 
        userPartyScores={scoresByParty} 
      />

      <div className="mt-12 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Party Alignment</h2>
        <p className="mb-6">
          Here's how your views align with Singapore's political parties:
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {sortedParties.map(party => {
            const score = scoresByParty[party.id as keyof typeof scoresByParty];
            const normalizedScore = ((score + 100) / 200) * 100; // Convert to 0-100% scale
            
            return (
              <div key={party.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center bg-white overflow-hidden border"
                    style={{ borderColor: party.color }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={party.logoPath}
                      alt={`${party.name} logo`}
                      className="w-10 h-10 object-contain"
                      onError={(e) => {
                        // Fallback to colored circle with initials if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.style.backgroundColor = party.color;
                        target.parentElement!.innerHTML = `<span class="text-white font-bold text-xl">${party.shortName[0]}</span>`;
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold">{party.name}</h3>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                      <div 
                        className="h-2.5 rounded-full" 
                        style={{ 
                          width: `${normalizedScore}%`,
                          backgroundColor: party.color
                        }}
                      ></div>
                    </div>
                    <p className="text-sm mt-1">{normalizedScore.toFixed(1)}% alignment</p>
                  </div>
                </div>
                <p className="text-sm mt-4 text-gray-600 dark:text-gray-300">
                  {party.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-8 mb-12 bg-blue-50 dark:bg-blue-900/30 p-6 rounded-lg">
          <h3 className="text-xl font-bold mb-2">Your Political Profile Summary</h3>
          
          <div className="flex items-center mb-4">
            <div
              className="w-10 h-10 mr-3 rounded-full flex items-center justify-center overflow-hidden bg-white"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={closestParty.logoPath}
                alt={`${closestParty.name} logo`}
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.style.backgroundColor = closestParty.color;
                  target.parentElement!.innerHTML = `<span class="text-white font-bold">${closestParty.shortName[0]}</span>`;
                }}
              />
            </div>
            <div>
              <strong>Closest Party:</strong> {closestParty.name} ({closestParty.shortName})
            </div>
          </div>
          
          <p className="mb-4">
            <strong>Economic Position:</strong> {economicScore.toFixed(1)} 
            ({economicScore < 0 ? 'Left-leaning' : economicScore > 0 ? 'Right-leaning' : 'Centrist'})
          </p>
          <p>
            <strong>Social Position:</strong> {socialScore.toFixed(1)} 
            ({socialScore < 0 ? 'Libertarian' : socialScore > 0 ? 'Authoritarian' : 'Centrist'})
          </p>
        </div>

        <div className="text-center mt-8">
          <button
            onClick={onReset}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            Take the Quiz Again
          </button>
          
          <div className="mt-4">
            <button 
              className="text-blue-600 hover:underline"
              onClick={() => {
                // Create a shareable image or link
                // For now just copy results to clipboard
                const text = `My Singapore Political Compass Results:\n\nEconomic: ${economicScore.toFixed(1)} (${economicScore < 0 ? 'Left-leaning' : 'Right-leaning'})\nSocial: ${socialScore.toFixed(1)} (${socialScore < 0 ? 'Libertarian' : 'Authoritarian'})\n\nClosest party: ${closestParty.name}`;
                navigator.clipboard.writeText(text);
                alert('Results copied to clipboard!');
              }}
            >
              Share Results
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results; 