import { AXIS_RANGE, SCORE_MULTIPLIER } from './axes';

export type QuestionCategory = 
  | 'taxation'
  | 'housing'
  | 'healthcare'
  | 'employment'
  | 'welfare'
  | 'governance'
  | 'civil_liberties'
  | 'immigration';

export interface Question {
  id: number;
  text: string;
  category: QuestionCategory;
  axis: 'economic' | 'social';
  weight: number; // 1-3, importance of question
  // Party alignment scores: positive = party agrees, negative = party disagrees
  partyScores: {
    pap: number;
    wp: number;
    psp: number;
    sdp: number;
  };
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/**
 * Infer the ideological direction of a question from how PAP vs the
 * opposition answer it:
 *
 * - If PAP supports the statement more than the opposition (on average),
 *   then "Agree" points in the + direction on that axis.
 * - If the opposition supports it more, then "Agree" points in the - direction.
 *
 * For economic axis:
 *   +1 ≈ more economically right (free market, low taxes)
 *   -1 ≈ more economically left (redistribution, welfare)
 *
 * For social axis:
 *   +1 ≈ more authoritarian (state control, traditional values)
 *   -1 ≈ more libertarian (civil liberties, personal freedom)
 *
 * This ensures both users AND parties are placed using the same transformation.
 */
export const getAxisDirection = (question: Question): -1 | 0 | 1 => {
  const governmentSupport = question.partyScores.pap;
  const oppositionSupport = (question.partyScores.wp + question.partyScores.psp + question.partyScores.sdp) / 3;
  const difference = governmentSupport - oppositionSupport;
  if (Math.abs(difference) < 0.1) return 0; // no clear lean
  return difference > 0 ? 1 : -1;
};

export const categoryLabels: Record<QuestionCategory, string> = {
  taxation: '💰 Taxation & Fiscal Policy',
  housing: '🏠 Housing',
  healthcare: '🏥 Healthcare',
  employment: '👷 Employment & Wages',
  welfare: '🤝 Social Welfare',
  governance: '🏛️ Governance & Transparency',
  civil_liberties: '⚖️ Civil Liberties',
  immigration: '🌏 Immigration & Population'
};

// 40 questions based on actual 2025 manifesto positions
export const questions: Question[] = [
  // ===== TAXATION & FISCAL POLICY (5 questions) =====
  {
    id: 1,
    text: "The GST should be reduced from 9% back to 7%, with essential items like food and medicine exempted.",
    category: 'taxation',
    axis: 'economic',
    weight: 3,
    partyScores: { pap: -2, wp: 2, psp: 2, sdp: 2 }
  },
  {
    id: 2,
    text: "Singapore should maintain large national reserves for future generations rather than spending more now.",
    category: 'taxation',
    axis: 'economic',
    weight: 3,
    partyScores: { pap: 2, wp: -1, psp: -1, sdp: -2 }
  },
  {
    id: 3,
    text: "The wealthy and top earners should pay significantly higher taxes to fund social programs.",
    category: 'taxation',
    axis: 'economic',
    weight: 2,
    partyScores: { pap: -1, wp: 1, psp: 2, sdp: 2 }
  },
  {
    id: 4,
    text: "The government should use more of the Net Investment Returns Contribution (NIRC) from reserves to fund current spending.",
    category: 'taxation',
    axis: 'economic',
    weight: 2,
    partyScores: { pap: -1, wp: 2, psp: 1, sdp: 2 }
  },
  {
    id: 5,
    text: "Corporate taxes should remain competitive to attract multinational companies, even if it means less tax revenue.",
    category: 'taxation',
    axis: 'economic',
    weight: 2,
    partyScores: { pap: 2, wp: -1, psp: -1, sdp: -2 }
  },

  // ===== HOUSING (5 questions) =====
  {
    id: 6,
    text: "HDB flat prices should exclude land cost, making public housing truly affordable for all Singaporeans.",
    category: 'housing',
    axis: 'economic',
    weight: 3,
    partyScores: { pap: -2, wp: 1, psp: 2, sdp: 2 }
  },
  {
    id: 7,
    text: "Building more HDB flats quickly is the best solution to housing affordability, rather than changing pricing models.",
    category: 'housing',
    axis: 'economic',
    weight: 2,
    partyScores: { pap: 2, wp: 0, psp: -1, sdp: -1 }
  },
  {
    id: 8,
    text: "The government should introduce non-open market housing options with shorter leases (e.g., 50-60 years) at lower prices.",
    category: 'housing',
    axis: 'economic',
    weight: 2,
    partyScores: { pap: -1, wp: 2, psp: 1, sdp: 2 }
  },
  {
    id: 9,
    text: "It is acceptable that HDB flats lose value over time (lease decay) as part of the 99-year lease system.",
    category: 'housing',
    axis: 'economic',
    weight: 2,
    partyScores: { pap: 1, wp: -2, psp: -2, sdp: -2 }
  },
  {
    id: 10,
    text: "The government should cap resale HDB prices to keep housing affordable for future generations.",
    category: 'housing',
    axis: 'economic',
    weight: 2,
    partyScores: { pap: -2, wp: 1, psp: 2, sdp: 2 }
  },

  // ===== HEALTHCARE (5 questions) =====
  {
    id: 11,
    text: "Singapore should implement a universal national healthcare system funded by taxes, reducing out-of-pocket costs.",
    category: 'healthcare',
    axis: 'economic',
    weight: 3,
    partyScores: { pap: -2, wp: 1, psp: 1, sdp: 2 }
  },
  {
    id: 12,
    text: "The current Medisave/Medishield system of personal healthcare savings is better than a tax-funded universal system.",
    category: 'healthcare',
    axis: 'economic',
    weight: 2,
    partyScores: { pap: 2, wp: -1, psp: -1, sdp: -2 }
  },
  {
    id: 13,
    text: "The government should centralize drug procurement to negotiate lower prices for all public hospitals.",
    category: 'healthcare',
    axis: 'economic',
    weight: 2,
    partyScores: { pap: 0, wp: 1, psp: 2, sdp: 2 }
  },
  {
    id: 14,
    text: "Healthcare costs should primarily be borne by individuals through their CPF Medisave, not general taxation.",
    category: 'healthcare',
    axis: 'economic',
    weight: 2,
    partyScores: { pap: 2, wp: -1, psp: -1, sdp: -2 }
  },
  {
    id: 15,
    text: "The government should expand healthcare subsidies significantly, especially for the elderly and lower-income groups.",
    category: 'healthcare',
    axis: 'economic',
    weight: 2,
    partyScores: { pap: 1, wp: 2, psp: 2, sdp: 2 }
  },

  // ===== EMPLOYMENT & WAGES (5 questions) =====
  {
    id: 16,
    text: "Singapore should implement a national minimum wage law for all workers.",
    category: 'employment',
    axis: 'economic',
    weight: 3,
    partyScores: { pap: -2, wp: 1, psp: 2, sdp: 2 }
  },
  {
    id: 17,
    text: "The Progressive Wage Model (sector-specific wage floors with skills progression) is better than a blanket minimum wage.",
    category: 'employment',
    axis: 'economic',
    weight: 2,
    partyScores: { pap: 2, wp: 0, psp: -1, sdp: -1 }
  },
  {
    id: 18,
    text: "The government should implement redundancy insurance to help workers who are retrenched.",
    category: 'employment',
    axis: 'economic',
    weight: 2,
    partyScores: { pap: 0, wp: 2, psp: 1, sdp: 2 }
  },
  {
    id: 19,
    text: "Employers should be required to demonstrate that no qualified Singaporean is available before hiring foreign professionals.",
    category: 'employment',
    axis: 'economic',
    weight: 2,
    partyScores: { pap: -1, wp: 2, psp: 2, sdp: 1 }
  },
  {
    id: 20,
    text: "Singapore should prioritize attracting global talent and foreign professionals for economic competitiveness.",
    category: 'employment',
    axis: 'economic',
    weight: 2,
    partyScores: { pap: 2, wp: -1, psp: -2, sdp: -1 }
  },

  // ===== SOCIAL WELFARE (5 questions) =====
  {
    id: 21,
    text: "Welfare benefits should be conditional on active job-seeking or participation in training programs.",
    category: 'welfare',
    axis: 'economic',
    weight: 2,
    partyScores: { pap: 2, wp: 0, psp: 0, sdp: -1 }
  },
  {
    id: 22,
    text: "The government should provide universal cash transfers to all citizens rather than targeted subsidies.",
    category: 'welfare',
    axis: 'economic',
    weight: 2,
    partyScores: { pap: -2, wp: 1, psp: 1, sdp: 2 }
  },
  {
    id: 23,
    text: "CPF should primarily remain a personal savings scheme rather than being used for broader social security.",
    category: 'welfare',
    axis: 'economic',
    weight: 2,
    partyScores: { pap: 2, wp: -1, psp: -1, sdp: -2 }
  },
  {
    id: 24,
    text: "Government vouchers and targeted rebates are more effective than broad-based welfare programs.",
    category: 'welfare',
    axis: 'economic',
    weight: 2,
    partyScores: { pap: 2, wp: -1, psp: -1, sdp: -2 }
  },
  {
    id: 25,
    text: "The elderly should receive a basic income from the government regardless of their means.",
    category: 'welfare',
    axis: 'economic',
    weight: 2,
    partyScores: { pap: -1, wp: 1, psp: 1, sdp: 2 }
  },

  // ===== GOVERNANCE & TRANSPARENCY (5 questions) =====
  {
    id: 26,
    text: "All ministers and MPs should be required to publicly declare their personal assets and business interests.",
    category: 'governance',
    axis: 'social',
    weight: 2,
    partyScores: { pap: -1, wp: 2, psp: 2, sdp: 2 }
  },
  {
    id: 27,
    text: "Parliament should have more power to scrutinize government budgets and spending decisions.",
    category: 'governance',
    axis: 'social',
    weight: 2,
    partyScores: { pap: -1, wp: 2, psp: 2, sdp: 2 }
  },
  {
    id: 28,
    text: "The current system where experienced ministers hold power for long periods ensures stability and good governance.",
    category: 'governance',
    axis: 'social',
    weight: 2,
    partyScores: { pap: 2, wp: -1, psp: -1, sdp: -2 }
  },
  {
    id: 29,
    text: "The Elected President should have more independent power over budgets and national reserves.",
    category: 'governance',
    axis: 'social',
    weight: 2,
    partyScores: { pap: -1, wp: 1, psp: 2, sdp: 2 }
  },
  {
    id: 30,
    text: "GRCs (Group Representation Constituencies) should be abolished in favor of single-member constituencies.",
    category: 'governance',
    axis: 'social',
    weight: 2,
    partyScores: { pap: -2, wp: 1, psp: 2, sdp: 2 }
  },

  // ===== CIVIL LIBERTIES (5 questions) =====
  {
    id: 31,
    text: "The media and press should have more freedom to criticize the government without fear of legal action.",
    category: 'civil_liberties',
    axis: 'social',
    weight: 3,
    partyScores: { pap: -2, wp: 1, psp: 2, sdp: 2 }
  },
  {
    id: 32,
    text: "Online content should be regulated by the government to prevent misinformation and maintain social harmony.",
    category: 'civil_liberties',
    axis: 'social',
    weight: 2,
    partyScores: { pap: 2, wp: 0, psp: -1, sdp: -2 }
  },
  {
    id: 33,
    text: "Singaporeans should be allowed to hold peaceful public protests and assemblies without requiring police permits.",
    category: 'civil_liberties',
    axis: 'social',
    weight: 2,
    partyScores: { pap: -2, wp: 1, psp: 1, sdp: 2 }
  },
  {
    id: 34,
    text: "The government should protect traditional family values even if it means limiting certain personal freedoms.",
    category: 'civil_liberties',
    axis: 'social',
    weight: 2,
    partyScores: { pap: 2, wp: 0, psp: 0, sdp: -2 }
  },
  {
    id: 35,
    text: "Laws that restrict speech and assembly are necessary to maintain Singapore's social stability and racial harmony.",
    category: 'civil_liberties',
    axis: 'social',
    weight: 2,
    partyScores: { pap: 2, wp: 0, psp: -1, sdp: -2 }
  },

  // ===== IMMIGRATION & POPULATION (5 questions) =====
  {
    id: 36,
    text: "Immigration levels should be significantly reduced to protect jobs and opportunities for Singaporeans.",
    category: 'immigration',
    axis: 'social',
    weight: 2,
    partyScores: { pap: -2, wp: 1, psp: 2, sdp: 1 }
  },
  {
    id: 37,
    text: "New citizens should be required to reside in Singapore for a longer period (e.g., 10+ years) before gaining full citizenship rights.",
    category: 'immigration',
    axis: 'social',
    weight: 2,
    partyScores: { pap: -1, wp: 1, psp: 2, sdp: 1 }
  },
  {
    id: 38,
    text: "Singapore needs continued immigration to sustain economic growth and address the aging population.",
    category: 'immigration',
    axis: 'social',
    weight: 2,
    partyScores: { pap: 2, wp: -1, psp: -2, sdp: -1 }
  },
  {
    id: 39,
    text: "The Ethnic Integration Policy (HDB quotas) is still necessary to prevent racial enclaves and maintain social cohesion.",
    category: 'immigration',
    axis: 'social',
    weight: 2,
    partyScores: { pap: 2, wp: 1, psp: 0, sdp: -1 }
  },
  {
    id: 40,
    text: "Foreign workers should have stronger employment protections and pathways to permanent residency.",
    category: 'immigration',
    axis: 'social',
    weight: 1,
    partyScores: { pap: 0, wp: 1, psp: -1, sdp: 2 }
  }
];

export type Answer = -2 | -1 | 0 | 1 | 2;

export const answerLabels: Record<Answer, string> = {
  2: 'Strongly Agree',
  1: 'Agree',
  0: 'Neutral',
  [-1]: 'Disagree',
  [-2]: 'Strongly Disagree'
};

export interface QuizResults {
  economicScore: number;
  socialScore: number;
  scoresByParty: {
    pap: number;
    wp: number;
    psp: number;
    sdp: number;
  };
  scoresByCategory: Record<QuestionCategory, { economic: number; social: number }>;
  answers: Record<number, Answer>; // User's raw answers for comparison
}

export interface QuizState {
  answers: Record<number, Answer>;
  currentQuestionIndex: number;
  completed: boolean;
  finalResults: QuizResults | null;
}

export const calculateScores = (answers: Record<number, Answer>): QuizResults => {
  let economicRawScore = 0;
  let socialRawScore = 0;
  let economicMaxScore = 0;
  let socialMaxScore = 0;
  
  let papScore = 0;
  let wpScore = 0;
  let pspScore = 0;
  let sdpScore = 0;
  
  const categoryScores: Record<QuestionCategory, { economic: number; social: number; count: number }> = {
    taxation: { economic: 0, social: 0, count: 0 },
    housing: { economic: 0, social: 0, count: 0 },
    healthcare: { economic: 0, social: 0, count: 0 },
    employment: { economic: 0, social: 0, count: 0 },
    welfare: { economic: 0, social: 0, count: 0 },
    governance: { economic: 0, social: 0, count: 0 },
    civil_liberties: { economic: 0, social: 0, count: 0 },
    immigration: { economic: 0, social: 0, count: 0 }
  };

  Object.entries(answers).forEach(([questionIdStr, userAnswer]) => {
    const questionId = parseInt(questionIdStr, 10);
    const question = questions.find(q => q.id === questionId);
    
    if (!question || userAnswer === 0) return;
    
    const axisDirection = getAxisDirection(question);
    const maxPossible = 2 * question.weight;
    
    if (axisDirection !== 0) {
      const weightedAnswer = userAnswer * axisDirection * question.weight;
      if (question.axis === 'economic') {
        economicRawScore += weightedAnswer;
        economicMaxScore += maxPossible;
        categoryScores[question.category].economic += userAnswer * axisDirection;
      } else {
        socialRawScore += weightedAnswer;
        socialMaxScore += maxPossible;
        categoryScores[question.category].social += userAnswer * axisDirection;
      }
    }
    
    categoryScores[question.category].count++;
    
    // Calculate party alignment scores
    papScore += userAnswer * question.partyScores.pap * question.weight;
    wpScore += userAnswer * question.partyScores.wp * question.weight;
    pspScore += userAnswer * question.partyScores.psp * question.weight;
    sdpScore += userAnswer * question.partyScores.sdp * question.weight;
  });
  
  const normalizedEconomic = economicMaxScore > 0 
    ? economicRawScore / economicMaxScore 
    : 0;
  const normalizedSocial = socialMaxScore > 0 
    ? socialRawScore / socialMaxScore 
    : 0;
  
  const economicScore = clamp(normalizedEconomic * AXIS_RANGE * SCORE_MULTIPLIER, -AXIS_RANGE, AXIS_RANGE);
  const socialScore = clamp(normalizedSocial * AXIS_RANGE * SCORE_MULTIPLIER, -AXIS_RANGE, AXIS_RANGE);
  
  // Normalize category scores
  const normalizedCategoryScores = Object.fromEntries(
    Object.entries(categoryScores).map(([cat, scores]) => [
      cat,
      {
        economic: scores.count > 0 ? scores.economic / scores.count : 0,
        social: scores.count > 0 ? scores.social / scores.count : 0
      }
    ])
  ) as Record<QuestionCategory, { economic: number; social: number }>;
  
  return {
    economicScore,
    socialScore,
    scoresByParty: {
      pap: papScore,
      wp: wpScore,
      psp: pspScore,
      sdp: sdpScore
    },
    scoresByCategory: normalizedCategoryScores,
    answers
  };
};

export const getQuestionsByCategory = (category: QuestionCategory): Question[] => {
  return questions.filter(q => q.category === category);
};

export const getQuestionsGroupedByCategory = (): Record<QuestionCategory, Question[]> => {
  return questions.reduce((acc, q) => {
    if (!acc[q.category]) acc[q.category] = [];
    acc[q.category].push(q);
    return acc;
  }, {} as Record<QuestionCategory, Question[]>);
};
