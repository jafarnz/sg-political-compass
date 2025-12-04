"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Introduction from './components/Introduction';
import Quiz from './components/Quiz';
import { QuizResults } from './data/questions';
import { getTopAlignedParties } from './data/parties';

// Dynamic import Results with SSR disabled to avoid html2canvas localStorage issue
const Results = dynamic(() => import('./components/Results'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="loading-spinner mx-auto mb-6"></div>
        <p className="text-slate-400">Loading results...</p>
      </div>
    </div>
  )
});

// Dynamic import DetailedReview
const DetailedReview = dynamic(() => import('./components/DetailedReview'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="loading-spinner mx-auto mb-6"></div>
        <p className="text-slate-400">Loading detailed review...</p>
      </div>
    </div>
  )
});

enum AppState {
  INTRODUCTION,
  QUIZ,
  RESULTS,
  DETAILED_REVIEW
}

export default function Home() {
  const [appState, setAppState] = useState<AppState>(AppState.INTRODUCTION);
  const [results, setResults] = useState<QuizResults | null>(null);

  const handleStartQuiz = () => {
    setAppState(AppState.QUIZ);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleQuizComplete = (quizResults: QuizResults) => {
    setResults(quizResults);
    setAppState(AppState.RESULTS);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleReset = () => {
    setAppState(AppState.INTRODUCTION);
    setResults(null);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDetailedReview = () => {
    setAppState(AppState.DETAILED_REVIEW);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBackToResults = () => {
    setAppState(AppState.RESULTS);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <main className="min-h-screen">
      {appState === AppState.INTRODUCTION && (
        <Introduction onStartQuiz={handleStartQuiz} />
      )}

      {appState === AppState.QUIZ && (
        <Quiz onComplete={handleQuizComplete} />
      )}

      {appState === AppState.RESULTS && results && (
        <Results
          economicScore={results.economicScore}
          socialScore={results.socialScore}
          scoresByParty={results.scoresByParty}
          scoresByCategory={results.scoresByCategory}
          answers={results.answers}
          onReset={handleReset}
          onDetailedReview={handleDetailedReview}
        />
      )}

      {appState === AppState.DETAILED_REVIEW && results && (() => {
        // Calculate closest parties for the detailed review
        const topAligned = getTopAlignedParties(results.economicScore, results.socialScore, 9);
        const closestPartyId = topAligned.best.party.id;
        const secondClosestPartyId = topAligned.isTie && topAligned.closeOnes.length > 0 
          ? topAligned.closeOnes[0].party.id 
          : undefined;
        
        return (
          <DetailedReview
            answers={results.answers}
            closestPartyId={closestPartyId}
            secondClosestPartyId={secondClosestPartyId}
            onBack={handleBackToResults}
            onReset={handleReset}
          />
        );
      })()}
    </main>
  );
}
