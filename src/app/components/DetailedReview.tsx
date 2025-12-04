'use client';

import React, { useState } from 'react';
import { parties, getPartyById, Party } from '../data/parties';
import { questions, categoryLabels, QuestionCategory, Answer } from '../data/questions';

interface DetailedReviewProps {
  answers: Record<number, number>;
  closestPartyId: string; // The user's overall closest party
  secondClosestPartyId?: string; // For close match-ups
  onBack: () => void;
  onReset: () => void;
}

// Explanation from LLM with sources
interface Source {
  title: string;
  url?: string;
  quote?: string;
  snippet?: string;
  type: 'manifesto' | 'parliament' | 'news' | 'official' | 'search' | 'video';
}

interface PartyExplanation {
  partyId: string;
  questionId: number;
  explanation: string;
  sources: Source[];
  confidence?: 'high' | 'medium' | 'low';
  loading: boolean;
  error?: string;
}

const formatStance = (score: number): string => {
  if (score >= 2) return 'Strongly Agree';
  if (score === 1) return 'Agree';
  if (score === 0) return 'Neutral';
  if (score === -1) return 'Disagree';
  return 'Strongly Disagree';
};

const getStanceEmoji = (score: number): string => {
  if (score >= 2) return '✅';
  if (score === 1) return '👍';
  if (score === 0) return '😐';
  if (score === -1) return '👎';
  return '❌';
};

const getStanceColor = (score: number): string => {
  if (score >= 2) return 'text-green-400 bg-green-500/20';
  if (score === 1) return 'text-green-300 bg-green-500/10';
  if (score === 0) return 'text-slate-400 bg-slate-500/10';
  if (score === -1) return 'text-red-300 bg-red-500/10';
  return 'text-red-400 bg-red-500/20';
};

// Find which party the user's answer is closest to
const getClosestPartyForAnswer = (userAnswer: number, partyScores: Record<string, number>): { partyId: string; distance: number }[] => {
  return Object.entries(partyScores)
    .map(([partyId, score]) => ({
      partyId,
      distance: Math.abs(userAnswer - score)
    }))
    .sort((a, b) => a.distance - b.distance);
};

// Format explanation text with basic markdown rendering
const formatExplanation = (text: string): React.ReactNode => {
  if (!text) return null;
  
  // Split by double newlines for paragraphs
  const paragraphs = text.split(/\n\n+/);
  
  return paragraphs.map((para, idx) => {
    // Check for headers (bold text at start)
    if (para.startsWith('**') && para.includes('**:')) {
      const headerMatch = para.match(/^\*\*(.+?)\*\*:?\s*([\s\S]*)/);
      if (headerMatch) {
        return (
          <div key={idx} className="mb-3">
            <h5 className="font-semibold text-amber-400 text-sm mb-1">{headerMatch[1]}</h5>
            {headerMatch[2] && <p className="text-slate-300">{formatInlineText(headerMatch[2])}</p>}
          </div>
        );
      }
    }
    
    // Check for numbered lists
    if (/^\d+\.\s/.test(para)) {
      const items = para.split(/\n(?=\d+\.)/);
      return (
        <ol key={idx} className="list-decimal list-inside mb-3 space-y-1">
          {items.map((item, i) => (
            <li key={i} className="text-slate-300">{formatInlineText(item.replace(/^\d+\.\s*/, ''))}</li>
          ))}
        </ol>
      );
    }
    
    // Check for bullet points
    if (/^[-•*]\s/.test(para)) {
      const items = para.split(/\n(?=[-•*]\s)/);
      return (
        <ul key={idx} className="list-disc list-inside mb-3 space-y-1">
          {items.map((item, i) => (
            <li key={i} className="text-slate-300">{formatInlineText(item.replace(/^[-•*]\s*/, ''))}</li>
          ))}
        </ul>
      );
    }
    
    // Check for blockquotes (lines starting with quotes)
    if (para.startsWith('"') || para.startsWith('"')) {
      return (
        <blockquote key={idx} className="border-l-2 border-amber-500/50 pl-3 py-1 mb-3 italic text-slate-400 bg-slate-800/30 rounded-r">
          {formatInlineText(para)}
        </blockquote>
      );
    }
    
    // Regular paragraph
    return <p key={idx} className="mb-3 text-slate-300">{formatInlineText(para)}</p>;
  });
};

// Format inline text (bold, quotes, etc.)
const formatInlineText = (text: string): React.ReactNode => {
  // Handle inline quotes
  const parts = text.split(/(".*?"(?:\s*-\s*[^"]+)?)/g);
  
  return parts.map((part, idx) => {
    // Check if this is a quote with attribution
    if (part.startsWith('"') && part.includes('"')) {
      const quoteMatch = part.match(/"(.+?)"(\s*-\s*(.+))?/);
      if (quoteMatch) {
        return (
          <span key={idx} className="inline">
            <span className="italic text-amber-300/80">&ldquo;{quoteMatch[1]}&rdquo;</span>
            {quoteMatch[3] && <span className="text-slate-500 text-xs"> — {quoteMatch[3]}</span>}
          </span>
        );
      }
    }
    
    // Handle bold text
    if (part.includes('**')) {
      const boldParts = part.split(/\*\*(.+?)\*\*/g);
      return boldParts.map((bp, i) => 
        i % 2 === 1 ? <strong key={`${idx}-${i}`} className="text-white">{bp}</strong> : bp
      );
    }
    
    return part;
  });
};

const DetailedReview: React.FC<DetailedReviewProps> = ({ answers, closestPartyId, secondClosestPartyId, onBack, onReset }) => {
  const [explanations, setExplanations] = useState<Record<string, PartyExplanation>>({});
  const [filterCategory, setFilterCategory] = useState<QuestionCategory | 'all'>('all');
  const [filterAlignment, setFilterAlignment] = useState<'all' | 'aligned' | 'differed' | 'pivotal'>('all');

  const closestParty = getPartyById(closestPartyId);
  const secondClosestParty = secondClosestPartyId ? getPartyById(secondClosestPartyId) : null;

  // Get filtered questions based on actual alignment with closest party
  const filteredQuestions = questions.filter(q => {
    if (filterCategory !== 'all' && q.category !== filterCategory) return false;
    
    const userAnswer = answers[q.id];
    if (userAnswer === undefined) return filterAlignment === 'all'; // Skip unanswered in filters
    
    if (filterAlignment !== 'all') {
      const closestPartyScore = q.partyScores[closestPartyId as keyof typeof q.partyScores];
      const alignments = getClosestPartyForAnswer(userAnswer, q.partyScores);
      const userClosestForThisQ = alignments[0]?.partyId;
      
      // "Aligned" = user's answer for THIS question was closest to their overall closest party
      const isAlignedWithClosest = userClosestForThisQ === closestPartyId;
      
      if (filterAlignment === 'aligned' && !isAlignedWithClosest) return false;
      if (filterAlignment === 'differed' && isAlignedWithClosest) return false;
      
      // "Pivotal" = for close match-ups, show questions where user sided with one over the other
      if (filterAlignment === 'pivotal' && secondClosestPartyId) {
        const closestScore = q.partyScores[closestPartyId as keyof typeof q.partyScores];
        const secondScore = q.partyScores[secondClosestPartyId as keyof typeof q.partyScores];
        
        // Only show if the two parties differ on this question
        if (Math.abs(closestScore - secondScore) < 1) return false;
        
        // And user's answer was closer to one than the other
        const distToClosest = Math.abs(userAnswer - closestScore);
        const distToSecond = Math.abs(userAnswer - secondScore);
        if (Math.abs(distToClosest - distToSecond) < 0.5) return false;
      }
    }
    
    return true;
  });

  // Count questions for each filter
  const alignedCount = questions.filter(q => {
    const userAnswer = answers[q.id];
    if (userAnswer === undefined) return false;
    const alignments = getClosestPartyForAnswer(userAnswer, q.partyScores);
    return alignments[0]?.partyId === closestPartyId;
  }).length;

  const differedCount = questions.filter(q => {
    const userAnswer = answers[q.id];
    if (userAnswer === undefined) return false;
    const alignments = getClosestPartyForAnswer(userAnswer, q.partyScores);
    return alignments[0]?.partyId !== closestPartyId;
  }).length;

  const pivotalCount = secondClosestPartyId ? questions.filter(q => {
    const userAnswer = answers[q.id];
    if (userAnswer === undefined) return false;
    const closestScore = q.partyScores[closestPartyId as keyof typeof q.partyScores];
    const secondScore = q.partyScores[secondClosestPartyId as keyof typeof q.partyScores];
    if (Math.abs(closestScore - secondScore) < 1) return false;
    const distToClosest = Math.abs(userAnswer - closestScore);
    const distToSecond = Math.abs(userAnswer - secondScore);
    return Math.abs(distToClosest - distToSecond) >= 0.5;
  }).length : 0;

  // Fetch explanation from LLM with streaming
  const fetchExplanation = async (questionId: number, partyId: string) => {
    const key = `${questionId}-${partyId}`;
    
    // Already loading or loaded
    if (explanations[key]?.loading || (explanations[key] && !explanations[key].error)) {
      return;
    }

    const question = questions.find(q => q.id === questionId);
    const party = getPartyById(partyId);
    if (!question || !party) return;

    const partyScore = question.partyScores[partyId as keyof typeof question.partyScores];
    const stance = formatStance(partyScore);

    setExplanations(prev => ({
      ...prev,
      [key]: {
        partyId,
        questionId,
        explanation: '',
        sources: [],
        loading: true
      }
    }));

    try {
      // Use streaming endpoint for better UX
      const response = await fetch('/api/explain-stance-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partyName: party.name,
          partyId: party.id,
          questionText: question.text,
          stance,
          stanceScore: partyScore,
          category: question.category
        })
      });

      // Check if response is an error (JSON) or streaming (text/event-stream)
      const contentType = response.headers.get('content-type') || '';
      
      if (!response.ok || contentType.includes('application/json')) {
        // Error response - parse as JSON
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch explanation');
        } catch (jsonError) {
          if (jsonError instanceof Error && jsonError.message !== 'Failed to fetch explanation') {
            const text = await response.text();
            throw new Error(text || 'Failed to fetch explanation');
          }
          throw jsonError;
        }
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let fullExplanation = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.error) {
                throw new Error(data.error);
              }
              
              if (data.type === 'text' && data.text) {
                fullExplanation += data.text;
                // Update explanation progressively
                setExplanations(prev => ({
                  ...prev,
                  [key]: {
                    ...prev[key],
                    explanation: fullExplanation,
                    loading: true
                  }
                }));
              }
              
              if (data.type === 'done') {
                // Final update with sources
                setExplanations(prev => ({
                  ...prev,
                  [key]: {
                    partyId,
                    questionId,
                    explanation: fullExplanation || prev[key]?.explanation || '',
                    sources: data.sources || [],
                    confidence: data.confidence,
                    loading: false
                  }
                }));
              }
            } catch (e) {
              // Skip unparseable lines
              if (e instanceof Error && e.message !== 'Unexpected end of JSON input') {
                console.error('Parse error:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      setExplanations(prev => ({
        ...prev,
        [key]: {
          partyId,
          questionId,
          explanation: '',
          sources: [],
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load explanation'
        }
      }));
    }
  };

  // Stats
  const totalAnswered = Object.keys(answers).length;
  const totalQuestions = questions.length;
  
  // Calculate party alignment per question
  const getQuestionAlignments = (questionId: number) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return [];
    
    const userAnswer = answers[questionId];
    if (userAnswer === undefined) return [];
    
    return getClosestPartyForAnswer(userAnswer, {
      pap: question.partyScores.pap,
      wp: question.partyScores.wp,
      psp: question.partyScores.psp,
      sdp: question.partyScores.sdp
    });
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={onBack}
            className="text-slate-400 hover:text-white mb-4 flex items-center gap-2 transition-colors"
          >
            ← Back to Results
          </button>
          <h1 className="text-4xl font-bold mb-2 text-white">Detailed Review</h1>
          <p className="text-slate-400">
            Review all {totalQuestions} questions, see party positions, and understand why parties hold their stances.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-amber-400">{totalAnswered}</div>
            <div className="text-sm text-slate-400">Questions Answered</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-slate-300">{totalQuestions - totalAnswered}</div>
            <div className="text-sm text-slate-400">Skipped</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-green-400">
              {Object.values(answers).filter(a => a > 0).length}
            </div>
            <div className="text-sm text-slate-400">Agreed</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-red-400">
              {Object.values(answers).filter(a => a < 0).length}
            </div>
            <div className="text-sm text-slate-400">Disagreed</div>
          </div>
        </div>

        {/* Your Match Info */}
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-800/40 rounded-xl p-4 mb-6 border border-slate-700/50">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-slate-400">Your closest match:</span>
            {closestParty && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: `${closestParty.color}20`, border: `1px solid ${closestParty.color}` }}>
                <div 
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: closestParty.color }}
                >
                  {closestParty.shortName[0]}
                </div>
                <span className="font-semibold text-white">{closestParty.name}</span>
              </div>
            )}
            {secondClosestParty && (
              <>
                <span className="text-slate-500">also close to</span>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: `${secondClosestParty.color}10`, border: `1px solid ${secondClosestParty.color}50` }}>
                  <div 
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: secondClosestParty.color }}
                  >
                    {secondClosestParty.shortName[0]}
                  </div>
                  <span className="text-slate-300">{secondClosestParty.name}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Filter by Category</label>
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as QuestionCategory | 'all')}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Categories</option>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Filter by Alignment {closestParty && <span className="text-xs text-slate-500">(vs {closestParty.shortName})</span>}
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterAlignment('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterAlignment === 'all' 
                    ? 'bg-amber-500 text-white' 
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                All ({questions.length})
              </button>
              <button
                onClick={() => setFilterAlignment('aligned')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterAlignment === 'aligned' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                ✓ Aligned ({alignedCount})
              </button>
              <button
                onClick={() => setFilterAlignment('differed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterAlignment === 'differed' 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                ✗ Differed ({differedCount})
              </button>
              {secondClosestParty && pivotalCount > 0 && (
                <button
                  onClick={() => setFilterAlignment('pivotal')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterAlignment === 'pivotal' 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  ⚡ Pivotal ({pivotalCount})
                </button>
              )}
            </div>
            {filterAlignment === 'aligned' && (
              <p className="text-xs text-green-400 mt-2">Questions where your answer was closest to {closestParty?.shortName}</p>
            )}
            {filterAlignment === 'differed' && (
              <p className="text-xs text-orange-400 mt-2">Questions where you sided with a different party than {closestParty?.shortName}</p>
            )}
            {filterAlignment === 'pivotal' && secondClosestParty && (
              <p className="text-xs text-purple-400 mt-2">Questions that made the difference between {closestParty?.shortName} and {secondClosestParty.shortName}</p>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="bg-slate-800/30 rounded-xl p-4 mb-8 border border-slate-700/50">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Legend</h3>
          <div className="flex flex-wrap gap-4">
            {parties.map(party => (
              <div key={party.id} className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: party.color }}
                >
                  {party.shortName[0]}
                </div>
                <span className="text-sm text-slate-300">{party.shortName}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-slate-700/50">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-400">✅</span>
              <span className="text-slate-400">Strongly Agree</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-300">👍</span>
              <span className="text-slate-400">Agree</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-400">😐</span>
              <span className="text-slate-400">Neutral</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-red-300">👎</span>
              <span className="text-slate-400">Disagree</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-red-400">❌</span>
              <span className="text-slate-400">Strongly Disagree</span>
            </div>
          </div>
        </div>

        {/* Questions List - All expanded by default */}
        <div className="space-y-6">
          {filteredQuestions.map((question) => {
            const userAnswer = answers[question.id];
            const alignments = getQuestionAlignments(question.id);
            const closestParty = alignments[0]?.partyId ? getPartyById(alignments[0].partyId) : null;
            
            return (
              <div 
                key={question.id}
                className="bg-slate-800/30 rounded-2xl border border-slate-700/50"
              >
                {/* Question Header */}
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <span className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-300">
                        {question.id}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-slate-700 text-slate-300">
                          {categoryLabels[question.category]}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-slate-700/50 text-slate-400">
                          {question.axis === 'economic' ? '💰 Economic' : '🏛️ Social'}
                        </span>
                      </div>
                      
                      <p className="text-white text-lg mb-4">{question.text}</p>
                      
                      {/* Your Answer - Prominent */}
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <div className={`px-4 py-2 rounded-lg ${userAnswer !== undefined ? getStanceColor(userAnswer) : 'bg-slate-700 text-slate-500'}`}>
                          <span className="text-sm font-medium">Your answer: </span>
                          <span className="font-bold">
                            {userAnswer !== undefined ? (
                              <>
                                {getStanceEmoji(userAnswer)} {formatStance(userAnswer)}
                              </>
                            ) : 'Skipped'}
                          </span>
                        </div>
                        
                        {closestParty && userAnswer !== undefined && (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 text-sm">→ Most aligned with</span>
                            <div 
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium"
                              style={{ backgroundColor: closestParty.color + '30', color: closestParty.color }}
                            >
                              <div 
                                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                style={{ backgroundColor: closestParty.color }}
                              >
                                {closestParty.shortName[0]}
                              </div>
                              {closestParty.shortName}
                              {alignments[0]?.distance === 0 && <span className="text-green-400 text-xs ml-1">✓ exact</span>}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* All Party Stances - Always visible */}
                <div className="px-5 pb-5 border-t border-slate-700/50 pt-4">
                  <h4 className="text-sm font-semibold text-slate-300 mb-3">All Party Positions</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {parties.map(party => {
                      const partyScore = question.partyScores[party.id as keyof typeof question.partyScores];
                      const isClosest = alignments[0]?.partyId === party.id && userAnswer !== undefined;
                      const explanationKey = `${question.id}-${party.id}`;
                      
                      return (
                        <div 
                          key={party.id}
                          className={`p-3 rounded-xl border ${
                            isClosest 
                              ? 'border-amber-500/50 bg-amber-500/10' 
                              : 'border-slate-700/50 bg-slate-800/30'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                              style={{ backgroundColor: party.color }}
                            >
                              {party.shortName[0]}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-white">{party.shortName}</div>
                              {isClosest && (
                                <div className="text-xs text-amber-400">★ Your match</div>
                              )}
                            </div>
                          </div>
                          <div className={`text-center py-2 rounded-lg ${getStanceColor(partyScore)}`}>
                            <div className="text-lg">{getStanceEmoji(partyScore)}</div>
                            <div className="text-xs font-medium">{formatStance(partyScore)}</div>
                          </div>
                          
                          {/* Explain button */}
                          <button
                            onClick={() => fetchExplanation(question.id, party.id)}
                            disabled={explanations[explanationKey]?.loading}
                            className="w-full mt-2 px-3 py-1.5 text-xs rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors disabled:opacity-50"
                          >
                            {explanations[explanationKey]?.loading ? (
                              <span className="flex items-center justify-center gap-2">
                                <div className="w-3 h-3 border-2 border-slate-500 border-t-amber-500 rounded-full animate-spin"></div>
                                Loading...
                              </span>
                            ) : explanations[explanationKey]?.explanation ? (
                              '✓ Explained'
                            ) : (
                              '🔍 Why this stance?'
                            )}
                          </button>
                          
                          {/* Explanation with Sources */}
                          {explanations[explanationKey] && (
                            <div className="mt-3 p-3 rounded-lg bg-slate-900/50 text-xs">
                              {explanations[explanationKey].error ? (
                                <div className="text-red-400">
                                  {explanations[explanationKey].error}
                                </div>
                              ) : explanations[explanationKey].loading && !explanations[explanationKey].explanation ? (
                                <div className="flex items-center gap-2 text-slate-400">
                                  <div className="w-3 h-3 border-2 border-slate-500 border-t-amber-500 rounded-full animate-spin"></div>
                                  Researching sources...
                                </div>
                              ) : (
                                <div>
                                  {/* Confidence indicator */}
                                  {explanations[explanationKey].confidence && (
                                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium mb-2 ${
                                      explanations[explanationKey].confidence === 'high' 
                                        ? 'bg-green-500/20 text-green-400' 
                                        : explanations[explanationKey].confidence === 'medium'
                                        ? 'bg-amber-500/20 text-amber-400'
                                        : 'bg-slate-500/20 text-slate-400'
                                    }`}>
                                      {explanations[explanationKey].confidence === 'high' ? '✓ Verified' : 
                                       explanations[explanationKey].confidence === 'medium' ? '◐ Likely' : '○ Inferred'}
                                    </div>
                                  )}
                                  
                                  <div className="text-slate-300 mb-3 leading-relaxed prose prose-sm prose-invert max-w-none">
                                    {formatExplanation(explanations[explanationKey].explanation)}
                                    {explanations[explanationKey].loading && (
                                      <span className="inline-block w-2 h-4 bg-amber-500 animate-pulse ml-1"></span>
                                    )}
                                  </div>
                                  
                                  {/* Sources with type icons */}
                                  {explanations[explanationKey].sources.length > 0 && (
                                    <div className="pt-2 border-t border-slate-700">
                                      <div className="text-slate-400 mb-2 flex items-center gap-1">
                                        <span>📚</span> Sources ({explanations[explanationKey].sources.length}):
                                      </div>
                                      <div className="space-y-2">
                                        {explanations[explanationKey].sources.map((source, idx) => {
                                          const typeIcon = {
                                            manifesto: '📜',
                                            parliament: '🏛️',
                                            news: '📰',
                                            official: '🔗',
                                            search: '🔍',
                                            video: '🎬'
                                          }[source.type] || '📄';
                                          
                                          const typeBadge = {
                                            manifesto: 'bg-purple-500/20 text-purple-300',
                                            parliament: 'bg-blue-500/20 text-blue-300',
                                            news: 'bg-orange-500/20 text-orange-300',
                                            official: 'bg-green-500/20 text-green-300',
                                            search: 'bg-slate-500/20 text-slate-300',
                                            video: 'bg-red-500/20 text-red-300'
                                          }[source.type] || 'bg-slate-500/20 text-slate-300';
                                          
                                          return (
                                            <div key={idx} className="bg-slate-800/50 rounded-lg p-2">
                                              <div className="flex items-start gap-2">
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] flex-shrink-0 ${typeBadge}`}>
                                                  {typeIcon} {source.type}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                  {source.url ? (
                                                    <a 
                                                      href={source.url}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="text-amber-400 hover:underline break-words"
                                                    >
                                                      {source.title}
                                                    </a>
                                                  ) : (
                                                    <span className="text-slate-300">{source.title}</span>
                                                  )}
                                                </div>
                                              </div>
                                              {(source.quote || source.snippet) && (
                                                <blockquote className="mt-2 pl-3 border-l-2 border-amber-500/30 text-slate-400 italic text-[11px]">
                                                  &ldquo;{source.quote || source.snippet}&rdquo;
                                                </blockquote>
                                              )}
                                              {source.url && (
                                                <div className="mt-1 text-[10px] text-slate-500 truncate">
                                                  {source.url}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* No results */}
        {filteredQuestions.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <div className="text-4xl mb-4">🔍</div>
            <p>No questions match your filters.</p>
            <button 
              onClick={() => { setFilterCategory('all'); setFilterAlignment('all'); }}
              className="mt-4 text-amber-400 hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onBack}
            className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-all"
          >
            ← Back to Results
          </button>
          <button
            onClick={onReset}
            className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-900 font-bold rounded-xl transition-all"
          >
            🔄 Take Quiz Again
          </button>
        </div>

        {/* API Note */}
        <div className="mt-8 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 text-center">
          <p className="text-xs text-slate-500">
            💡 Click "Why this stance?" to get AI-powered explanations with verified sources from manifestos, parliament records, and news.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DetailedReview;
