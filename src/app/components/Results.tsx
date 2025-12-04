'use client';

import React, { useRef } from 'react';
import PoliticalCompass from './PoliticalCompass';
import { 
  parties, 
  calculatePartyDistances, 
  getTopAlignedParties,
  getKeyDifferences,
  getCommonGround,
  getPartyPosition,
  getPartyMeanPosition,
  getPartyById,
  Party
} from '../data/parties';
import { categoryLabels, QuestionCategory, questions } from '../data/questions';

interface ResultsProps {
  economicScore: number;
  socialScore: number;
  scoresByParty: {
    pap: number;
    wp: number;
    psp: number;
    sdp: number;
  };
  scoresByCategory: Record<QuestionCategory, { economic: number; social: number }>;
  answers: Record<number, number>;
  onReset: () => void;
  onDetailedReview: () => void;
}

// Helper to format party answer as text
const formatStance = (score: number): string => {
  if (score >= 2) return 'Strongly Agree';
  if (score === 1) return 'Agree';
  if (score === 0) return 'Neutral';
  if (score === -1) return 'Disagree';
  return 'Strongly Disagree';
};

const formatStanceShort = (score: number): string => {
  if (score >= 2) return 'Strong Yes';
  if (score === 1) return 'Yes';
  if (score === 0) return 'Neutral';
  if (score === -1) return 'No';
  return 'Strong No';
};

const getStanceColor = (score: number): string => {
  if (score >= 2) return 'text-green-400';
  if (score === 1) return 'text-green-300';
  if (score === 0) return 'text-slate-400';
  if (score === -1) return 'text-red-300';
  return 'text-red-400';
};

const getStanceBgColor = (score: number): string => {
  if (score >= 2) return 'bg-green-500/20';
  if (score === 1) return 'bg-green-500/10';
  if (score === 0) return 'bg-slate-500/10';
  if (score === -1) return 'bg-red-500/10';
  return 'bg-red-500/20';
};

// Calculate which questions had the most impact on score difference between user and each party
const calculateScoreImpact = (
  userAnswers: Record<number, number>,
  party1Id: string,
  party2Id: string
): { questionId: number; text: string; category: string; party1Impact: number; party2Impact: number; netImpact: number; userAnswer: number }[] => {
  const impacts: { questionId: number; text: string; category: string; party1Impact: number; party2Impact: number; netImpact: number; userAnswer: number }[] = [];
  
  questions.forEach(question => {
    const userAnswer = userAnswers[question.id];
    if (userAnswer === undefined || userAnswer === 0) return;
    
    const p1Score = question.partyScores[party1Id as keyof typeof question.partyScores];
    const p2Score = question.partyScores[party2Id as keyof typeof question.partyScores];
    
    if (p1Score === undefined || p2Score === undefined) return;
    
    // Impact = how much this question contributed to alignment with each party
    const party1Impact = userAnswer * p1Score * question.weight;
    const party2Impact = userAnswer * p2Score * question.weight;
    const netImpact = party1Impact - party2Impact; // Positive = favors party1
    
    impacts.push({
      questionId: question.id,
      text: question.text,
      category: question.category,
      party1Impact,
      party2Impact,
      netImpact,
      userAnswer
    });
  });
  
  // Sort by absolute net impact (most decisive questions first)
  return impacts.sort((a, b) => Math.abs(b.netImpact) - Math.abs(a.netImpact));
};

const CLOSE_MATCH_THRESHOLD = 9; // 9% threshold for showing comparison

const Results: React.FC<ResultsProps> = ({ 
  economicScore, 
  socialScore, 
  scoresByParty, 
  scoresByCategory,
  answers,
  onReset,
  onDetailedReview
}) => {
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // Calculate party alignments using normalized distances
  const partyAlignments = calculatePartyDistances(economicScore, socialScore);
  
  // Get top aligned parties with tie detection (9% threshold)
  const topAligned = getTopAlignedParties(economicScore, socialScore, CLOSE_MATCH_THRESHOLD);
  const closestParty = topAligned.best.party;
  
  // Check if there's a close match (within 9%)
  const hasCloseMatch = topAligned.isTie && topAligned.closeOnes.length > 0;
  const closeParty = hasCloseMatch ? topAligned.closeOnes[0].party : null;
  
  // Get key differences and score impact analysis
  const keyDifferences = closeParty 
    ? getKeyDifferences(closestParty.id, closeParty.id, answers, 8) // Get more differences
    : [];
  const commonGround = closeParty
    ? getCommonGround(closestParty.id, closeParty.id, 4)
    : [];
  const scoreImpacts = closeParty
    ? calculateScoreImpact(answers, closestParty.id, closeParty.id)
    : [];
  
  // Get mean position for transparency
  const meanPosition = getPartyMeanPosition();
  
  // Get top aligned categories
  const getCategoryAnalysis = () => {
    const analysis = Object.entries(scoresByCategory).map(([cat, scores]) => {
      const avgScore = (scores.economic + scores.social) / 2;
      return { category: cat as QuestionCategory, avgScore };
    });
    return analysis.sort((a, b) => Math.abs(b.avgScore) - Math.abs(a.avgScore));
  };
  
  // Get percentage difference
  const alignmentDiff = hasCloseMatch 
    ? Math.abs(topAligned.best.alignment - topAligned.closeOnes[0].alignment)
    : 0;

  const shareResultsAsImage = async () => {
    if (!resultsRef.current) return;
    
    try {
      const shareButton = document.getElementById('share-button');
      if (shareButton) {
        shareButton.textContent = 'Generating...';
        shareButton.setAttribute('disabled', 'true');
      }
      
      const html2canvas = (await import('html2canvas')).default;
      
      const element = resultsRef.current;
      const canvas = await html2canvas(element, {
        backgroundColor: '#0f172a',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          console.error('Failed to generate image blob');
          if (shareButton) {
            shareButton.textContent = '📤 Share Results';
            shareButton.removeAttribute('disabled');
          }
          return;
        }
        
        try {
          const file = new File([blob], 'sg-political-compass.png', { type: 'image/png' });
          if (navigator.share && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: 'My Singapore Political Compass Results',
              text: `I align most with ${closestParty.name}! Take the quiz to find your position.`,
              files: [file],
            });
          } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'sg-political-compass.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
        } catch (error) {
          console.error('Error sharing:', error);
        } finally {
          if (shareButton) {
            shareButton.textContent = '📤 Share Results';
            shareButton.removeAttribute('disabled');
          }
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error generating image:', error);
      const shareButton = document.getElementById('share-button');
      if (shareButton) {
        shareButton.textContent = '📤 Share Results';
        shareButton.removeAttribute('disabled');
      }
    }
  };

  // Render party logo with fallback
  const PartyLogo: React.FC<{ party: Party; size?: 'sm' | 'md' | 'lg' }> = ({ party, size = 'md' }) => {
    const sizeClasses = {
      sm: 'w-8 h-8',
      md: 'w-12 h-12',
      lg: 'w-16 h-16'
    };
    const imgSizes = {
      sm: 'w-6 h-6',
      md: 'w-9 h-9',
      lg: 'w-12 h-12'
    };
    
    return (
      <div 
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center bg-white overflow-hidden border-2`}
        style={{ borderColor: party.color }}
      >
        <img
          src={party.logoPath}
          alt={`${party.name} logo`}
          className={`${imgSizes[size]} object-contain`}
          crossOrigin="anonymous"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            if (target.parentElement) {
              target.parentElement.style.backgroundColor = party.color;
              const fontSize = size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-lg' : 'text-sm';
              target.parentElement.innerHTML = `<span class="text-white font-bold ${fontSize}">${party.shortName[0]}</span>`;
            }
          }}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-white">Your Results</h1>
          <p className="text-slate-400">
            Based on your responses to {questions.length} policy questions
          </p>
        </div>

        {/* Main Results Card */}
        <div ref={resultsRef} className="results-card p-8 rounded-3xl mb-8">
          <PoliticalCompass 
            economicScore={economicScore} 
            socialScore={socialScore} 
            userPartyScores={scoresByParty}
            closestPartyId={closestParty.id}
          />

          {/* Closest Party Highlight with Close Match Detection */}
          <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
            {hasCloseMatch && closeParty ? (
              // Close match view - show both parties
              <div>
                <div className="text-amber-400 text-sm font-medium mb-4 text-center">
                  🎯 You have two close matches! ({alignmentDiff.toFixed(1)}% difference)
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* First party */}
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/30">
                    <PartyLogo party={closestParty} size="lg" />
                    <div className="flex-1">
                      <div className="text-xs text-slate-400 mb-1">Closest Match</div>
                      <h3 className="text-xl font-bold text-white">{closestParty.name}</h3>
                      <div className="text-2xl font-bold" style={{ color: closestParty.color }}>
                        {topAligned.best.alignment.toFixed(0)}%
                      </div>
                    </div>
                  </div>
                  
                  {/* Second party */}
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/30">
                    <PartyLogo party={closeParty} size="lg" />
                    <div className="flex-1">
                      <div className="text-xs text-slate-400 mb-1">Also Very Close</div>
                      <h3 className="text-xl font-bold text-white">{closeParty.name}</h3>
                      <div className="text-2xl font-bold" style={{ color: closeParty.color }}>
                        {topAligned.closeOnes[0].alignment.toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="mt-4 text-sm text-amber-200/80 bg-amber-500/10 rounded-lg p-3 text-center">
                  💡 With only <strong>{alignmentDiff.toFixed(1)}%</strong> difference, both parties align well with your views. 
                  Scroll down to see the key differences and decide which matters more to you.
                </p>
              </div>
            ) : (
              // Single match view
              <div className="flex items-center gap-4">
                <PartyLogo party={closestParty} size="lg" />
                <div className="flex-1">
                  <div className="text-amber-400 text-sm font-medium mb-1">Your closest match</div>
                  <h3 className="text-2xl font-bold text-white">{closestParty.name}</h3>
                  <p className="text-slate-300 text-sm mt-1">{closestParty.description}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ============ CLOSE MATCH COMPARISON SECTION ============ */}
        {hasCloseMatch && closeParty && (
          <>
            {/* Your Pivotal Choices - Where you picked one over the other */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2 text-white flex items-center gap-2">
                <span>⚡</span> Your Pivotal Choices
              </h2>
              <p className="text-slate-400 mb-6 text-sm">
                On these questions, you sided with one party even when they disagreed with the other.
                These choices explain the {alignmentDiff.toFixed(0)}% gap between your matches.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                {/* Questions where you sided with closest party */}
                <div className="rounded-xl border p-4" style={{ borderColor: closestParty.color + '50', backgroundColor: closestParty.color + '08' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                      style={{ backgroundColor: closestParty.color }}
                    >
                      {closestParty.shortName[0]}
                    </div>
                    <span className="font-semibold text-white">You chose {closestParty.shortName}</span>
                  </div>
                  <div className="space-y-3">
                    {scoreImpacts.filter(i => i.netImpact > 0).slice(0, 4).map((impact, idx) => {
                      const q = questions.find(q => q.id === impact.questionId);
                      if (!q) return null;
                      const closestScore = q.partyScores[closestParty.id as keyof typeof q.partyScores];
                      const closeScore = q.partyScores[closeParty.id as keyof typeof q.partyScores];
                      
                      return (
                        <div key={impact.questionId} className="p-3 rounded-lg bg-slate-800/50 text-sm">
                          <p className="text-slate-300 mb-2">{impact.text.slice(0, 80)}...</p>
                          <div className="flex items-center gap-4 text-xs">
                            <div>
                              <span className="text-slate-500">You:</span>{' '}
                              <span className={getStanceColor(impact.userAnswer)}>{formatStanceShort(impact.userAnswer)}</span>
                            </div>
                            <div style={{ color: closestParty.color }}>
                              {closestParty.shortName}: {formatStanceShort(closestScore)} ✓
                            </div>
                            <div className="text-slate-500">
                              {closeParty.shortName}: {formatStanceShort(closeScore)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {scoreImpacts.filter(i => i.netImpact > 0).length === 0 && (
                      <p className="text-slate-500 text-sm italic">No pivotal choices favoring {closestParty.shortName}</p>
                    )}
                  </div>
                </div>
                
                {/* Questions where you sided with second party */}
                <div className="rounded-xl border p-4" style={{ borderColor: closeParty.color + '50', backgroundColor: closeParty.color + '08' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                      style={{ backgroundColor: closeParty.color }}
                    >
                      {closeParty.shortName[0]}
                    </div>
                    <span className="font-semibold text-white">You chose {closeParty.shortName}</span>
                  </div>
                  <div className="space-y-3">
                    {scoreImpacts.filter(i => i.netImpact < 0).slice(0, 4).map((impact, idx) => {
                      const q = questions.find(q => q.id === impact.questionId);
                      if (!q) return null;
                      const closestScore = q.partyScores[closestParty.id as keyof typeof q.partyScores];
                      const closeScore = q.partyScores[closeParty.id as keyof typeof q.partyScores];
                      
                      return (
                        <div key={impact.questionId} className="p-3 rounded-lg bg-slate-800/50 text-sm">
                          <p className="text-slate-300 mb-2">{impact.text.slice(0, 80)}...</p>
                          <div className="flex items-center gap-4 text-xs">
                            <div>
                              <span className="text-slate-500">You:</span>{' '}
                              <span className={getStanceColor(impact.userAnswer)}>{formatStanceShort(impact.userAnswer)}</span>
                            </div>
                            <div className="text-slate-500">
                              {closestParty.shortName}: {formatStanceShort(closestScore)}
                            </div>
                            <div style={{ color: closeParty.color }}>
                              {closeParty.shortName}: {formatStanceShort(closeScore)} ✓
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {scoreImpacts.filter(i => i.netImpact < 0).length === 0 && (
                      <p className="text-slate-500 text-sm italic">No pivotal choices favoring {closeParty.shortName}</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Summary */}
              <div className="mt-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                <p className="text-sm text-slate-400">
                  <span className="font-semibold text-white">Summary:</span>{' '}
                  You sided with {closestParty.shortName} on {scoreImpacts.filter(i => i.netImpact > 0).length} pivotal questions 
                  and with {closeParty.shortName} on {scoreImpacts.filter(i => i.netImpact < 0).length}. 
                  This is why your alignment is {topAligned.best.alignment.toFixed(0)}% vs {topAligned.closeOnes[0].alignment.toFixed(0)}%.
                </p>
              </div>
            </div>

            {/* Key Policy Comparison - Side by Side */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2 text-white flex items-center gap-2">
                <span>📋</span> Key Policies Comparison
              </h2>
              <p className="text-slate-400 mb-6 text-sm">
                Compare the signature policies of both parties to see which aligns better with what matters to you.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* First party policies */}
                <div className="rounded-2xl border-2 p-5" style={{ borderColor: closestParty.color + '50' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <PartyLogo party={closestParty} size="sm" />
                    <div>
                      <h3 className="font-bold text-white">{closestParty.name}</h3>
                      <div className="text-sm" style={{ color: closestParty.color }}>
                        {topAligned.best.alignment.toFixed(0)}% aligned
                      </div>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {closestParty.keyPolicies.map((policy, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span 
                          className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: closestParty.color }}
                        >
                          {idx + 1}
                        </span>
                        <span className="text-slate-300">{policy}</span>
                      </li>
                    ))}
                  </ul>
                  <a 
                    href={closestParty.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block text-sm font-medium hover:underline"
                    style={{ color: closestParty.color }}
                  >
                    Visit {closestParty.shortName} website →
                  </a>
                </div>
                
                {/* Second party policies */}
                <div className="rounded-2xl border-2 p-5" style={{ borderColor: closeParty.color + '50' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <PartyLogo party={closeParty} size="sm" />
                    <div>
                      <h3 className="font-bold text-white">{closeParty.name}</h3>
                      <div className="text-sm" style={{ color: closeParty.color }}>
                        {topAligned.closeOnes[0].alignment.toFixed(0)}% aligned
                      </div>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {closeParty.keyPolicies.map((policy, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span 
                          className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: closeParty.color }}
                        >
                          {idx + 1}
                        </span>
                        <span className="text-slate-300">{policy}</span>
                      </li>
                    ))}
                  </ul>
                  <a 
                    href={closeParty.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block text-sm font-medium hover:underline"
                    style={{ color: closeParty.color }}
                  >
                    Visit {closeParty.shortName} website →
                  </a>
                </div>
              </div>
            </div>

            {/* Key Differences Table */}
            {keyDifferences.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2 text-white flex items-center gap-2">
                  <span>⚖️</span> Where They Disagree Most
                </h2>
                <p className="text-slate-400 mb-6 text-sm">
                  On these issues, {closestParty.shortName} and {closeParty.shortName} have opposing views. 
                  Your stance on these could be the deciding factor.
                </p>
                
                <div className="overflow-x-auto rounded-2xl border border-slate-700/50">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-800/50">
                        <th className="text-left py-4 px-4 text-slate-300 font-medium">Policy Issue</th>
                        <th className="text-center py-4 px-3 font-medium" style={{ color: closestParty.color }}>
                          {closestParty.shortName}
                        </th>
                        <th className="text-center py-4 px-3 font-medium" style={{ color: closeParty.color }}>
                          {closeParty.shortName}
                        </th>
                        <th className="text-center py-4 px-3 text-amber-400 font-medium">Your Answer</th>
                        <th className="text-center py-4 px-3 text-slate-300 font-medium">Closer To</th>
                      </tr>
                    </thead>
                    <tbody>
                      {keyDifferences.map((diff, idx) => (
                        <tr 
                          key={diff.questionId} 
                          className={`border-t border-slate-700/30 ${idx % 2 === 0 ? 'bg-slate-800/20' : ''}`}
                        >
                          <td className="py-4 px-4">
                            <div className="max-w-sm">
                              <span className="text-slate-300">{diff.questionText}</span>
                              <div className="text-xs text-slate-500 mt-1">
                                {categoryLabels[diff.category as QuestionCategory]}
                              </div>
                            </div>
                          </td>
                          <td className="text-center py-4 px-3">
                            <span className={`px-2 py-1 rounded ${getStanceBgColor(diff.party1Answer)} ${getStanceColor(diff.party1Answer)}`}>
                              {formatStanceShort(diff.party1Answer)}
                            </span>
                          </td>
                          <td className="text-center py-4 px-3">
                            <span className={`px-2 py-1 rounded ${getStanceBgColor(diff.party2Answer)} ${getStanceColor(diff.party2Answer)}`}>
                              {formatStanceShort(diff.party2Answer)}
                            </span>
                          </td>
                          <td className="text-center py-4 px-3">
                            <span className={`px-2 py-1 rounded ${diff.userAnswer !== undefined ? getStanceBgColor(diff.userAnswer) : ''} ${diff.userAnswer !== undefined ? getStanceColor(diff.userAnswer) : 'text-slate-500'}`}>
                              {diff.userAnswer !== undefined ? formatStanceShort(diff.userAnswer) : 'Skipped'}
                            </span>
                          </td>
                          <td className="text-center py-4 px-3">
                            {diff.userAlignsWith === 'both' ? (
                              <span className="text-slate-400">Both</span>
                            ) : diff.userAlignsWith === 'neither' ? (
                              <span className="text-slate-500">Neither</span>
                            ) : diff.userAlignsWith === closestParty.id ? (
                              <span className="font-semibold px-2 py-1 rounded" style={{ color: closestParty.color, backgroundColor: closestParty.color + '20' }}>
                                {closestParty.shortName}
                              </span>
                            ) : (
                              <span className="font-semibold px-2 py-1 rounded" style={{ color: closeParty.color, backgroundColor: closeParty.color + '20' }}>
                                {closeParty.shortName}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Common Ground */}
            {commonGround.length > 0 && (
              <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span>🤝</span> Where They Agree
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                  Both {closestParty.shortName} and {closeParty.shortName} share similar views on these issues:
                </p>
                <ul className="space-y-3">
                  {commonGround.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm">
                      <span className="text-green-400 text-lg mt-0.5">✓</span>
                      <div>
                        <span className="text-green-400 font-medium">{item.sharedStance}:</span>{' '}
                        <span className="text-slate-300">{item.questionText}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Decision Helper */}
            <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
              <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <span>🤔</span> How to Decide
              </h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">1.</span>
                  Review the <strong>key differences table</strong> above and note which issues matter most to you
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">2.</span>
                  Check which party you aligned with on those crucial issues
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">3.</span>
                  Visit both party websites to read their full manifestos
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">4.</span>
                  Remember: a {alignmentDiff.toFixed(1)}% difference means both parties genuinely reflect your views!
                </li>
              </ul>
            </div>
          </>
        )}

        {/* Party Alignment */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
            <span>🎯</span> All Party Alignments
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {partyAlignments.map(({ party, alignment, economicDiff, socialDiff }, index) => {
              const isTopMatch = index === 0 || (hasCloseMatch && topAligned.closeOnes.some(c => c.party.id === party.id));
              
              return (
                <div 
                  key={party.id} 
                  className={`party-alignment-card p-5 rounded-xl ${isTopMatch ? 'ring-2 ring-amber-500/50' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <PartyLogo party={party} size="md" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-white">{party.name}</h3>
                        <span className="text-lg font-bold" style={{ color: party.color }}>
                          {alignment.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-1000"
                          style={{ 
                            width: `${alignment}%`,
                            backgroundColor: party.color
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-slate-500">
                        <span className={economicDiff > 0 ? 'text-blue-400' : economicDiff < 0 ? 'text-green-400' : ''}>
                          Econ: {economicDiff > 0 ? '+' : ''}{economicDiff.toFixed(1)}
                        </span>
                        <span className={socialDiff > 0 ? 'text-rose-400' : socialDiff < 0 ? 'text-emerald-400' : ''}>
                          Social: {socialDiff > 0 ? '+' : ''}{socialDiff.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {!hasCloseMatch && index === 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50">
                      <p className="text-sm text-slate-400">{party.description}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Single Match: Key Policies */}
        {!hasCloseMatch && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
              <span>📋</span> Key Policies of {closestParty.shortName}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {closestParty.keyPolicies.map((policy, idx) => (
                <div key={idx} className="policy-card p-4 rounded-xl">
                  <div className="flex items-start gap-3">
                    <span 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: closestParty.color }}
                    >
                      {idx + 1}
                    </span>
                    <p className="text-sm text-slate-300">{policy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Breakdown */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
            <span>📊</span> Your Position by Category
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {getCategoryAnalysis().map(({ category, avgScore }) => (
              <div key={category} className="category-result-card p-4 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-white">
                    {categoryLabels[category]}
                  </span>
                  <span className={`text-sm font-bold ${
                    avgScore < -0.5 ? 'text-green-400' : 
                    avgScore > 0.5 ? 'text-blue-400' : 
                    'text-slate-400'
                  }`}>
                    {avgScore > 0.5 ? 'Conservative' : avgScore < -0.5 ? 'Progressive' : 'Moderate'}
                  </span>
                </div>
                <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-1/2 w-1 bg-slate-500 transform -translate-x-1/2"
                  />
                  <div 
                    className={`absolute top-0 h-full rounded-full ${
                      avgScore < 0 ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{
                      left: avgScore < 0 ? `${50 + avgScore * 25}%` : '50%',
                      width: `${Math.abs(avgScore) * 25}%`
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Progressive</span>
                  <span>Conservative</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Party Positions Breakdown */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
            <span>🔍</span> Party Positions Breakdown
          </h2>
          <p className="text-slate-400 text-sm mb-4">
            Party positions are calculated from their stances on the same {questions.length} questions you answered.
          </p>
          <div className="comparison-grid overflow-x-auto rounded-xl border border-slate-700/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800/50">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Party</th>
                  <th className="text-center py-3 px-4 text-slate-400 font-medium">
                    <div>Economic</div>
                    <div className="text-xs font-normal">← Left | Right →</div>
                  </th>
                  <th className="text-center py-3 px-4 text-slate-400 font-medium">
                    <div>Social</div>
                    <div className="text-xs font-normal">← Lib | Auth →</div>
                  </th>
                  <th className="text-center py-3 px-4 text-slate-400 font-medium">Position</th>
                  <th className="text-center py-3 px-4 text-slate-400 font-medium">Alignment</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-700/50 bg-amber-500/10">
                  <td className="py-3 px-4">
                    <span className="font-bold text-amber-400">📍 You</span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={economicScore < 0 ? 'text-green-400' : 'text-blue-400'}>
                      {economicScore > 0 ? '+' : ''}{economicScore.toFixed(1)}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={socialScore < 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {socialScore > 0 ? '+' : ''}{socialScore.toFixed(1)}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4 text-amber-400 font-medium">
                    Your Position
                  </td>
                  <td className="text-center py-3 px-4 text-amber-400 font-bold">
                    —
                  </td>
                </tr>
                {partyAlignments.map(({ party, position, alignment }, index) => {
                  const isTopMatch = index === 0 || (hasCloseMatch && topAligned.closeOnes.some(c => c.party.id === party.id));
                  return (
                    <tr 
                      key={party.id} 
                      className={`border-b border-slate-700/50 ${isTopMatch ? 'bg-slate-800/50' : ''}`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded-full"
                            style={{ backgroundColor: party.color }}
                          />
                          <span className={`${isTopMatch ? 'text-white font-semibold' : 'text-white'}`}>
                            {party.shortName}
                          </span>
                          {isTopMatch && (
                            <span className="text-amber-400 text-xs">★</span>
                          )}
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className={position.x < 0 ? 'text-green-400' : 'text-blue-400'}>
                          {position.x > 0 ? '+' : ''}{position.x.toFixed(1)}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className={position.y < 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {position.y > 0 ? '+' : ''}{position.y.toFixed(1)}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4 text-slate-400">
                        {position.x >= 0 && position.y >= 0 && 'Auth Right'}
                        {position.x < 0 && position.y >= 0 && 'Auth Left'}
                        {position.x < 0 && position.y < 0 && 'Lib Left'}
                        {position.x >= 0 && position.y < 0 && 'Lib Right'}
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className={`font-bold ${isTopMatch ? 'text-amber-400' : 'text-slate-300'}`}>
                          {alignment.toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Methodology Note */}
          <div className="mt-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
            <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
              <span>ℹ️</span> How This Works
            </h3>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>• Party positions are calculated by summing their stances on all {questions.length} questions, weighted by importance</li>
              <li>• Your position is calculated the same way from your answers</li>
              <li>• Alignment % is based on distance in this shared political space</li>
              <li>• Positions are normalized around the SG party landscape mean ({meanPosition.x.toFixed(2)}, {meanPosition.y.toFixed(2)}) for fairer comparison</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
          <button
            onClick={onDetailedReview}
            className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-all border border-slate-700 hover:border-amber-500/50"
          >
            📋 Detailed Review
          </button>
          
          <button
            onClick={onReset}
            className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-all"
          >
            🔄 Take Quiz Again
          </button>
          
          <button 
            id="share-button"
            className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-900 font-bold rounded-xl transition-all"
            onClick={shareResultsAsImage}
          >
            📤 Share Results
          </button>
        </div>
        
        {/* Detailed Review Callout */}
        <div className="mt-6 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
          <p className="text-sm text-slate-400">
            📋 Want to see all {questions.length} questions, party stances, and understand why each party holds their positions?
          </p>
          <button
            onClick={onDetailedReview}
            className="mt-3 text-amber-400 hover:text-amber-300 font-medium text-sm hover:underline"
          >
            View Detailed Review with AI-powered explanations →
          </button>
        </div>
        
        {/* Disclaimer */}
        <div className="mt-12 text-center">
          <p className="text-xs text-slate-500 max-w-2xl mx-auto">
            <strong>Disclaimer:</strong> This quiz is for educational purposes only. 
            Political positions are complex and nuanced. Party positions are derived from 
            official manifesto stances from the 2025 General Election. This tool is not affiliated 
            with any political party. Always research parties thoroughly before voting.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Results;
