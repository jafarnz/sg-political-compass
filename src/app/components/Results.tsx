import React, { useRef } from 'react';
import PoliticalCompass from './PoliticalCompass';
import { parties } from '../data/parties';
import html2canvas from 'html2canvas';

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
  const resultsRef = useRef<HTMLDivElement>(null);
  
  const scoreEntries = Object.entries(scoresByParty);
  scoreEntries.sort((a, b) => b[1] - a[1]); 
  
  const closestPartyId = scoreEntries.length > 0 ? scoreEntries[0][0] : parties[0].id;
  const closestParty = parties.find(p => p.id === closestPartyId)!;
  
  const sortedPartiesForDisplay = [...parties].sort((a, b) => {
    const scoreA = scoresByParty[a.id as keyof typeof scoresByParty];
    const scoreB = scoresByParty[b.id as keyof typeof scoresByParty];
    return scoreB - scoreA;
  });

  // Revised Normalization for Party Alignment Percentages (0-100%)
  // Assumes raw party scores can range from approx -200 to +200
  // (50 questions * max user answer magnitude 2 * max party stance magnitude 2 = 200)
  const MAX_POSSIBLE_RAW_PARTY_SCORE = 200; 
  const MIN_POSSIBLE_RAW_PARTY_SCORE = -200;
  const TOTAL_RANGE = MAX_POSSIBLE_RAW_PARTY_SCORE - MIN_POSSIBLE_RAW_PARTY_SCORE; // Should be 400

  const normalizedScores = Object.fromEntries(
    Object.entries(scoresByParty).map(([id, rawPartyScore]) => {
      // Normalize the rawPartyScore from [MIN_POSSIBLE_RAW_PARTY_SCORE, MAX_POSSIBLE_RAW_PARTY_SCORE] to [0, 100]
      // e.g., -200 maps to 0%, 0 maps to 50%, +200 maps to 100%
      let normalized = 50; // Default if total range is somehow 0
      if (TOTAL_RANGE !== 0) {
         normalized = ((rawPartyScore - MIN_POSSIBLE_RAW_PARTY_SCORE) / TOTAL_RANGE) * 100;
      }
      const clippedNormalized = Math.max(0, Math.min(100, normalized));
      return [id, clippedNormalized];
    })
  );
  
  // Function to generate and share the results image
  const shareResultsAsImage = async () => {
    if (!resultsRef.current) return;
    
    try {
      const shareButton = document.getElementById('share-button');
      if (shareButton) {
        shareButton.textContent = 'Generating image...';
        shareButton.setAttribute('disabled', 'true');
      }
      
      const element = resultsRef.current;
      const canvas = await html2canvas(element, {
        backgroundColor: '#1e293b',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.font = 'italic 16px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('sg-political-compass.vercel.app', canvas.width / 2, canvas.height - 20);
        
        const date = new Date().toLocaleDateString();
        ctx.font = '14px Arial';
        ctx.fillStyle = '#cccccc';
        ctx.fillText(`Generated on ${date}`, canvas.width / 2, canvas.height - 40);
      }
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          console.error('Failed to generate image blob');
          if (shareButton) {
            shareButton.textContent = 'Share Results as Image';
            shareButton.removeAttribute('disabled');
          }
          return;
        }
        
        try {
          const file = new File([blob], 'singapore-political-compass.png', { type: 'image/png' });
          if (navigator.share && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: 'My Singapore Political Compass Results',
              text: `My Singapore Political Compass Results - I align most with ${closestParty.name}`,
              files: [file],
            });
          } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'singapore-political-compass.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
        } catch (error) {
          console.error('Error sharing or downloading image:', error);
          alert('Error sharing image. The image has been downloaded instead.');
        } finally {
          if (shareButton) {
            shareButton.textContent = 'Share Results as Image';
            shareButton.removeAttribute('disabled');
          }
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Error generating image. Please try again.');
      const shareButton = document.getElementById('share-button');
      if (shareButton) {
        shareButton.textContent = 'Share Results as Image';
        shareButton.removeAttribute('disabled');
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Your Singapore Political Compass Results</h1>
        <p className="text-lg mb-4">
          See where you stand on Singapore's political spectrum
        </p>
      </div>

      <div ref={resultsRef} className="bg-gray-900 rounded-xl p-6">
        <PoliticalCompass 
          economicScore={economicScore} 
          socialScore={socialScore} 
          userPartyScores={scoresByParty}
          closestPartyId={closestPartyId}
        />

        <div className="mt-8 mb-6 bg-blue-900/30 p-6 rounded-lg text-white">
          <h3 className="text-xl font-bold mb-2">Your Political Profile Summary</h3>
          
          <div className="flex items-center mb-4">
            <div
              className="w-10 h-10 mr-3 rounded-full flex items-center justify-center overflow-hidden bg-white"
            >
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
      </div>

      <div className="mt-12 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Party Alignment</h2>
        <p className="mb-6">
          Here's how your views align with Singapore's political parties:
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {sortedPartiesForDisplay.map(party => {
            const partyId = party.id as keyof typeof scoresByParty;
            const normalizedScoreValue = normalizedScores[partyId];
            
            return (
              <div key={party.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center bg-white overflow-hidden border"
                    style={{ borderColor: party.color }}
                  >
                    <img
                      src={party.logoPath}
                      alt={`${party.name} logo`}
                      className="w-10 h-10 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.style.backgroundColor = party.color;
                        target.parentElement!.innerHTML = `<span class="text-white font-bold text-xl">${party.shortName[0]}</span>`;
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold">{party.name}</h3>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-2">
                      <div 
                        className="h-2.5 rounded-full" 
                        style={{ 
                          width: `${normalizedScoreValue}%`,
                          backgroundColor: party.color
                        }}
                      ></div>
                    </div>
                    <p className="text-sm mt-1 text-gray-600 dark:text-gray-300">{normalizedScoreValue.toFixed(1)}% alignment</p>
                  </div>
                </div>
                <p className="text-sm mt-4 text-gray-600 dark:text-gray-300">
                  {party.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <button
            onClick={onReset}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition mr-4"
          >
            Take the Quiz Again
          </button>
          
          <button 
            id="share-button"
            className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition"
            onClick={shareResultsAsImage}
          >
            Share Results as Image
          </button>
        </div>
      </div>
    </div>
  );
};

export default Results; 