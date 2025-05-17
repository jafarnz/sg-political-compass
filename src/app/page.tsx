"use client";

import { useState } from 'react';
import Introduction from './components/Introduction';
import Quiz from './components/Quiz';
import Results from './components/Results';

enum AppState {
  INTRODUCTION,
  QUIZ,
  RESULTS
}

export default function Home() {
  const [appState, setAppState] = useState<AppState>(AppState.INTRODUCTION);
  const [results, setResults] = useState<{
    economicScore: number;
    socialScore: number;
    scoresByParty: {
      pap: number;
      wp: number;
      sdp: number;
      psp: number;
    };
  } | null>(null);

  const handleStartQuiz = () => {
    setAppState(AppState.QUIZ);
  };

  const handleQuizComplete = (quizResults: {
    economicScore: number;
    socialScore: number;
    scoresByParty: {
      pap: number;
      wp: number;
      sdp: number;
      psp: number;
    };
  }) => {
    setResults(quizResults);
    setAppState(AppState.RESULTS);
  };

  const handleReset = () => {
    setAppState(AppState.INTRODUCTION);
    setResults(null);
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
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
          onReset={handleReset}
        />
      )}
    </main>
  );
}
