'use client';

import React from 'react';
import { parties } from '../data/parties';
import { questions, categoryLabels } from '../data/questions';

interface IntroductionProps {
  onStartQuiz: () => void;
}

const Introduction: React.FC<IntroductionProps> = ({ onStartQuiz }) => {
  const categories = Object.entries(categoryLabels);
  const questionsPerCategory = categories.map(([key]) => 
    questions.filter(q => q.category === key).length
  );

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="hero-gradient py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm mb-6">
            <span>🇸🇬</span>
            <span>GE2025 Edition</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Singapore Political Compass
          </h1>
          
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Discover where you stand on Singapore's political spectrum based on 
            <span className="text-amber-400 font-semibold"> real 2025 party manifestos</span>
          </p>
          
          {/* Party logos */}
          <div className="flex justify-center flex-wrap gap-6 mb-10">
            {parties.map(party => (
              <div 
                key={party.id} 
                className="party-logo-card flex flex-col items-center p-4 rounded-xl transition-all hover:scale-105"
              >
                <div 
                  className="w-16 h-16 rounded-full border-2 p-1 flex items-center justify-center bg-white overflow-hidden mb-2" 
                  style={{ borderColor: party.color }}
                >
                  <img 
                    src={party.logoPath} 
                    alt={`${party.name} logo`} 
                    className="w-12 h-12 object-contain"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      if (target.parentElement) {
                        target.parentElement.style.backgroundColor = party.color;
                        target.parentElement.innerHTML = `<span class="text-white font-bold text-2xl">${party.shortName[0]}</span>`;
                      }
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-white">{party.shortName}</span>
              </div>
            ))}
          </div>
          
          <button
            onClick={onStartQuiz}
            className="start-button px-10 py-4 text-lg font-bold rounded-xl transition-all"
          >
            Start the Quiz
            <span className="ml-2">→</span>
          </button>
        </div>
      </div>
      
      {/* Info Section */}
      <div className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* How it works */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="info-card p-6 rounded-2xl">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                <span className="text-2xl">📊</span>
                Economic Axis
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-medium">LEFT</span>
                  <p className="text-sm text-slate-300">
                    Favors redistribution, social safety nets, public services, and higher taxes on wealth
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs font-medium">RIGHT</span>
                  <p className="text-sm text-slate-300">
                    Supports free markets, low taxes, fiscal prudence, and individual responsibility
                  </p>
                </div>
              </div>
            </div>
            
            <div className="info-card p-6 rounded-2xl">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                <span className="text-2xl">⚖️</span>
                Social Axis
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs font-medium">LIBERTARIAN</span>
                  <p className="text-sm text-slate-300">
                    Prioritizes civil liberties, personal freedom, and minimal state intervention in private life
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="px-2 py-1 rounded bg-rose-500/20 text-rose-400 text-xs font-medium">AUTHORITARIAN</span>
                  <p className="text-sm text-slate-300">
                    Emphasizes social order, traditional values, and state authority for public good
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Categories */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-center mb-8 text-white">
              Quiz Categories
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map(([key, label], index) => (
                <div key={key} className="category-card p-4 rounded-xl text-center">
                  <div className="text-2xl mb-2">{label.split(' ')[0]}</div>
                  <div className="text-sm font-medium text-white mb-1">{label.slice(2)}</div>
                  <div className="text-xs text-slate-400">{questionsPerCategory[index]} questions</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Party positions preview */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-center mb-8 text-white">
              Singapore's Political Parties
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {parties.map(party => (
                <div key={party.id} className="party-card p-6 rounded-2xl">
                  <div className="flex items-center gap-4 mb-4">
                    <div 
                      className="w-14 h-14 rounded-full border-2 flex items-center justify-center bg-white overflow-hidden" 
                      style={{ borderColor: party.color }}
                    >
                    <img 
                      src={party.logoPath} 
                      alt={`${party.name} logo`} 
                      className="w-10 h-10 object-contain"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        if (target.parentElement) {
                          target.parentElement.style.backgroundColor = party.color;
                          target.parentElement.innerHTML = `<span class="text-white font-bold text-xl">${party.shortName[0]}</span>`;
                        }
                      }}
                    />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{party.name}</h3>
                      <p className="text-sm text-slate-400">
                        Led by {party.leader} • Est. {party.founded}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-300 mb-4">{party.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {party.keyPolicies.slice(0, 3).map((policy, idx) => (
                      <span 
                        key={idx}
                        className="text-xs px-2 py-1 rounded-full bg-slate-700/50 text-slate-300"
                      >
                        {policy.length > 35 ? policy.slice(0, 35) + '...' : policy}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* About */}
          <div className="info-card p-8 rounded-2xl text-center">
            <h2 className="text-xl font-bold mb-4 text-white">About This Quiz</h2>
            <div className="grid md:grid-cols-3 gap-6 text-sm text-slate-300">
              <div>
                <div className="text-3xl font-bold text-amber-400 mb-1">{questions.length}</div>
                <div>Questions based on real policies</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-amber-400 mb-1">~10</div>
                <div>Minutes to complete</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-amber-400 mb-1">100%</div>
                <div>Private - no data stored</div>
              </div>
            </div>
            <p className="mt-6 text-sm text-slate-400 max-w-xl mx-auto">
              Questions are derived from official party manifestos and public policy statements 
              from the 2025 General Election. This quiz is for educational purposes only and 
              is not affiliated with any political party.
            </p>
          </div>
          
          {/* Start CTA */}
          <div className="text-center mt-12">
            <button
              onClick={onStartQuiz}
              className="start-button px-10 py-4 text-lg font-bold rounded-xl transition-all"
            >
              Take the Quiz
              <span className="ml-2">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Introduction;
