export interface Question {
  id: number;
  text: string;
  category: 'economic' | 'social';
  scoringPAP: number;
  scoringWP: number;
  scoringPSP: number;
  scoringSDP: number;
  isInverted?: boolean; // If true, agree = negative, disagree = positive
}

// 25 economic and 25 social questions
export const questions: Question[] = [
  // Economic Questions (1-25)
  {
    id: 1,
    text: "The wealthy should pay higher taxes so government can fund social welfare programs.",
    category: 'economic',
    scoringPAP: -2,
    scoringWP: 2,
    scoringSDP: 2,
    scoringPSP: 2,
    isInverted: true
  },
  {
    id: 2,
    text: "Raising corporate tax to at least 15% will help share prosperity more fairly.",
    category: 'economic',
    scoringPAP: -2,
    scoringWP: 2,
    scoringSDP: 1,
    scoringPSP: 2,
    isInverted: true
  },
  {
    id: 3,
    text: "Goods and Services Tax (GST) on basic essentials should be cut or exempted.",
    category: 'economic',
    scoringPAP: -1,
    scoringWP: 1,
    scoringSDP: 2,
    scoringPSP: 2,
    isInverted: true
  },
  {
    id: 4,
    text: "Government should keep a balanced budget and build reserves instead of running deficits.",
    category: 'economic',
    scoringPAP: 2,
    scoringWP: -2,
    scoringSDP: -2,
    scoringPSP: -1
  },
  {
    id: 5,
    text: "We should use national reserves freely now (e.g. through Net Investment Returns) to fund social programs.",
    category: 'economic',
    scoringPAP: -2,
    scoringWP: 2,
    scoringSDP: 2,
    scoringPSP: 1,
    isInverted: true
  },
  {
    id: 6,
    text: "Government subsidies and cash transfers are better than giving one-time handouts.",
    category: 'economic',
    scoringPAP: 2,
    scoringWP: -1,
    scoringSDP: -2,
    scoringPSP: -1
  },
  {
    id: 7,
    text: "All full-time workers should have a legally mandated minimum wage.",
    category: 'economic',
    scoringPAP: -2,
    scoringWP: 2,
    scoringSDP: 2,
    scoringPSP: 2,
    isInverted: true
  },
  {
    id: 8,
    text: "Singapore should not have a national minimum wage law.",
    category: 'economic',
    scoringPAP: 2,
    scoringWP: -2,
    scoringSDP: -2,
    scoringPSP: -2
  },
  {
    id: 9,
    text: "The Progressive Wage Credit Scheme (co-funding wage increases) is more effective than a flat minimum wage law.",
    category: 'economic',
    scoringPAP: 2,
    scoringWP: -1,
    scoringSDP: -1,
    scoringPSP: -1
  },
  {
    id: 10,
    text: "Employers should be required to demonstrate skills transfer to Singaporean employees before hiring foreign workers.",
    category: 'economic',
    scoringPAP: -1,
    scoringWP: 2,
    scoringSDP: 2,
    scoringPSP: 2,
    isInverted: true
  },
  {
    id: 11,
    text: "Foreign professionals who meet skills needs should be able to work in Singapore easily.",
    category: 'economic',
    scoringPAP: 2,
    scoringWP: -2,
    scoringSDP: -2,
    scoringPSP: -2
  },
  {
    id: 12,
    text: "Building more HDB flats quickly is the best way to keep housing affordable.",
    category: 'economic',
    scoringPAP: 2,
    scoringWP: 1,
    scoringSDP: -1,
    scoringPSP: -1
  },
  {
    id: 13,
    text: "HDB owners should not have to pay for the land cost of their flats.",
    category: 'economic',
    scoringPAP: -2,
    scoringWP: 2,
    scoringSDP: 2,
    scoringPSP: 2,
    isInverted: true
  },
  {
    id: 14,
    text: "Government should stabilize housing prices, even if it means capping resale prices.",
    category: 'economic',
    scoringPAP: -1,
    scoringWP: 2,
    scoringSDP: 2,
    scoringPSP: 2,
    isInverted: true
  },
  {
    id: 15,
    text: "It's acceptable that older flats lose value (lease decay) because Singaporeans can downsize or use savings.",
    category: 'economic',
    scoringPAP: 2,
    scoringWP: -2,
    scoringSDP: -2,
    scoringPSP: -2
  },
  {
    id: 16,
    text: "Healthcare costs should be paid by personal Medisave, not covered by general taxation.",
    category: 'economic',
    scoringPAP: 2,
    scoringWP: -1,
    scoringSDP: -2,
    scoringPSP: -1
  },
  {
    id: 17,
    text: "The government should guarantee a basic level of healthcare for all citizens from taxes.",
    category: 'economic',
    scoringPAP: -1,
    scoringWP: 1,
    scoringSDP: 2,
    scoringPSP: 1,
    isInverted: true
  },
  {
    id: 18,
    text: "Government can invest more (e.g. through Temasek/GIC) to fund public healthcare and social schemes.",
    category: 'economic',
    scoringPAP: 1,
    scoringWP: 2,
    scoringSDP: 2,
    scoringPSP: 1,
    isInverted: true
  },
  {
    id: 19,
    text: "Our economy should rely more on small and medium enterprises (SMEs) rather than multinational corporations (MNCs).",
    category: 'economic',
    scoringPAP: -1,
    scoringWP: 1,
    scoringSDP: 2,
    scoringPSP: 1,
    isInverted: true
  },
  {
    id: 20,
    text: "Singapore should not grow its foreign reserves further; instead the government should spend to help citizens now.",
    category: 'economic',
    scoringPAP: -2,
    scoringWP: 2,
    scoringSDP: 2,
    scoringPSP: 1,
    isInverted: true
  },
  {
    id: 21,
    text: "Tax cuts for middle-income families are more important than expanded welfare.",
    category: 'economic',
    scoringPAP: 2,
    scoringWP: -1,
    scoringSDP: -2,
    scoringPSP: -1
  },
  {
    id: 22,
    text: "My family would benefit more from cash vouchers (handouts) than paying more into CPF/Medisave.",
    category: 'economic',
    scoringPAP: -1,
    scoringWP: 1,
    scoringSDP: 2,
    scoringPSP: 1,
    isInverted: true
  },
  {
    id: 23,
    text: "Employers should get more tax rebates for investing in technology and skills for workers.",
    category: 'economic',
    scoringPAP: 2,
    scoringWP: 1,
    scoringSDP: -1,
    scoringPSP: 1
  },
  {
    id: 24,
    text: "Central Provident Fund (CPF) should remain a personal savings account, not be used for broad social support.",
    category: 'economic',
    scoringPAP: 2,
    scoringWP: -1,
    scoringSDP: -2,
    scoringPSP: -1
  },
  {
    id: 25,
    text: "Government welfare should be conditional on active job-seeking or retraining.",
    category: 'economic',
    scoringPAP: 2,
    scoringWP: -1,
    scoringSDP: -2,
    scoringPSP: -1
  },

  // Social Questions (26-50)
  {
    id: 26,
    text: "Same-sex couples should have the right to marry and adopt children.",
    category: 'social',
    scoringPAP: -2,
    scoringWP: 1,
    scoringSDP: 2,
    scoringPSP: 1,
    isInverted: true
  },
  {
    id: 27,
    text: "It is not a government's role to prevent discrimination against LGBTQ individuals.",
    category: 'social',
    scoringPAP: 1,
    scoringWP: -1,
    scoringSDP: -2,
    scoringPSP: -1
  },
  {
    id: 28,
    text: "Immigration levels should be kept low to protect local culture and jobs.",
    category: 'social',
    scoringPAP: -2,
    scoringWP: 2,
    scoringSDP: 2,
    scoringPSP: 2
  },
  {
    id: 29,
    text: "Singapore should welcome as many qualified immigrants as needed for economic growth.",
    category: 'social',
    scoringPAP: 2,
    scoringWP: -2,
    scoringSDP: -2,
    scoringPSP: -2,
    isInverted: true
  },
  {
    id: 30,
    text: "The Ethnic Integration Policy (HDB quotas) should be scrapped so sellers can freely price their flats.",
    category: 'social',
    scoringPAP: -2,
    scoringWP: 2,
    scoringSDP: 2,
    scoringPSP: 1,
    isInverted: true
  },
  {
    id: 31,
    text: "The government should require tight racial/ethnic ratios in each HDB block.",
    category: 'social',
    scoringPAP: 2,
    scoringWP: -1,
    scoringSDP: -2,
    scoringPSP: -1
  },
  {
    id: 32,
    text: "Our media and press should be free to criticize the government without fear of reprisal.",
    category: 'social',
    scoringPAP: -2,
    scoringWP: 2,
    scoringSDP: 2,
    scoringPSP: 2,
    isInverted: true
  },
  {
    id: 33,
    text: "Content on the internet should be regulated by the government to maintain social harmony.",
    category: 'social',
    scoringPAP: 2,
    scoringWP: -2,
    scoringSDP: -2,
    scoringPSP: -2
  },
  {
    id: 34,
    text: "People should be allowed to hold political rallies even if their views are unpopular.",
    category: 'social',
    scoringPAP: -2,
    scoringWP: 2,
    scoringSDP: 2,
    scoringPSP: 2,
    isInverted: true
  },
  {
    id: 35,
    text: "Schools should adjust or remove streaming/exams (like PSLE) to reduce stress on children.",
    category: 'social',
    scoringPAP: -2,
    scoringWP: 1,
    scoringSDP: 2,
    scoringPSP: 1,
    isInverted: true
  },
  {
    id: 36,
    text: "Preschool and primary education should be fully free for all families.",
    category: 'social',
    scoringPAP: -1,
    scoringWP: 1,
    scoringSDP: 2,
    scoringPSP: 1,
    isInverted: true
  },
  {
    id: 37,
    text: "University education should be tuition-free (with loans or bonds for graduates).",
    category: 'social',
    scoringPAP: -1,
    scoringWP: 1,
    scoringSDP: 2,
    scoringPSP: 1,
    isInverted: true
  },
  {
    id: 38,
    text: "Religious institutions should have influence over public policy in Singapore.",
    category: 'social',
    scoringPAP: 1,
    scoringWP: -1,
    scoringSDP: -2,
    scoringPSP: -1
  },
  {
    id: 39,
    text: "Government must protect traditional values even if it limits personal freedoms.",
    category: 'social',
    scoringPAP: 2,
    scoringWP: -2,
    scoringSDP: -2,
    scoringPSP: -2
  },
  {
    id: 40,
    text: "Our national identity is strengthened by integrating all cultures, not by emphasizing differences.",
    category: 'social',
    scoringPAP: 1,
    scoringWP: 2,
    scoringSDP: 2,
    scoringPSP: 2,
    isInverted: true
  },
  {
    id: 41,
    text: "Censorship of movies or books is sometimes necessary to protect society.",
    category: 'social',
    scoringPAP: 2,
    scoringWP: -2,
    scoringSDP: -2,
    scoringPSP: -2
  },
  {
    id: 42,
    text: "Politicians and public servants should be required to declare their assets for transparency.",
    category: 'social',
    scoringPAP: -1,
    scoringWP: 1,
    scoringSDP: 2,
    scoringPSP: 1,
    isInverted: true
  },
  {
    id: 43,
    text: "Students should spend more time on vocational skills and less on academic theory.",
    category: 'social',
    scoringPAP: 1,
    scoringWP: 2,
    scoringSDP: -1,
    scoringPSP: 2
  },
  {
    id: 44,
    text: "Higher education admissions should give priority to lower-income or disadvantaged students.",
    category: 'social',
    scoringPAP: -2,
    scoringWP: 2,
    scoringSDP: 2,
    scoringPSP: 1,
    isInverted: true
  },
  {
    id: 45,
    text: "The voting age should be lowered to 18 since many 18-year-olds already serve in the military.",
    category: 'social',
    scoringPAP: -2,
    scoringWP: 1,
    scoringSDP: 2,
    scoringPSP: 2,
    isInverted: true
  },
  {
    id: 46,
    text: "All Singaporeans who complete National Service should have guaranteed public housing priority.",
    category: 'social',
    scoringPAP: 1,
    scoringWP: 2,
    scoringSDP: 1,
    scoringPSP: 1
  },
  {
    id: 47,
    text: "The government should increase the allowances of full-time national servicemen (NSFs).",
    category: 'social',
    scoringPAP: -1,
    scoringWP: 2,
    scoringSDP: 1,
    scoringPSP: 1,
    isInverted: true
  },
  {
    id: 48,
    text: "Segregation by race or religion (e.g. in schools or communities) should be actively prevented.",
    category: 'social',
    scoringPAP: 1,
    scoringWP: 2,
    scoringSDP: 2,
    scoringPSP: 2
  },
  {
    id: 49,
    text: "Veteran ministers and MPs should continue to hold power to ensure stability.",
    category: 'social',
    scoringPAP: 2,
    scoringWP: -2,
    scoringSDP: -2,
    scoringPSP: -2
  },
  {
    id: 50,
    text: "The President should have more independent power over budgets and reserves.",
    category: 'social',
    scoringPAP: -1,
    scoringWP: 1,
    scoringSDP: 2,
    scoringPSP: 1,
    isInverted: true
  }
];

export type Answer = -2 | -1 | 0 | 1 | 2;

export interface QuizState {
  answers: Record<number, Answer>;
  currentQuestionIndex: number;
  economicScore: number;
  socialScore: number;
  scoresByParty: {
    pap: number;
    wp: number;
    sdp: number;
    psp: number;
  };
  completed: boolean;
}

export const calculateScores = (answers: Record<number, Answer>): {
  economicScore: number;
  socialScore: number;
  scoresByParty: { pap: number; wp: number; sdp: number; psp: number };
} => {
  let currentEconomicScore = 0;
  let currentSocialScore = 0;
  let papScore = 0;
  let wpScore = 0;
  let sdpScore = 0;
  let pspScore = 0;
  
  let economicQuestionsAnswered = 0;
  let socialQuestionsAnswered = 0;

  Object.entries(answers).forEach(([questionIdStr, rawAnswer]) => {
    const questionId = parseInt(questionIdStr, 10);
    const question = questions.find(q => q.id === questionId);
    
    if (!question) return;
    
    const multiplier = question.isInverted ? -1 : 1;
    const axisSpecificUserAnswerValue = rawAnswer * multiplier;
    
    if (question.category === 'economic') {
      currentEconomicScore += axisSpecificUserAnswerValue;
      economicQuestionsAnswered++;
    } else {
      currentSocialScore += axisSpecificUserAnswerValue;
      socialQuestionsAnswered++;
    }
    
    papScore += rawAnswer * question.scoringPAP;
    wpScore += rawAnswer * question.scoringWP;
    sdpScore += rawAnswer * question.scoringSDP;
    pspScore += rawAnswer * question.scoringPSP;
  });
  
  const maxPossibleEconomicScore = economicQuestionsAnswered * 2;
  const maxPossibleSocialScore = socialQuestionsAnswered * 2;
  
  const finalEconomicScore = maxPossibleEconomicScore > 0 
    ? (currentEconomicScore / maxPossibleEconomicScore) * 10 
    : 0;
  const finalSocialScore = maxPossibleSocialScore > 0 
    ? (currentSocialScore / maxPossibleSocialScore) * 10 
    : 0;
  
  return {
    economicScore: finalEconomicScore,
    socialScore: finalSocialScore,
    scoresByParty: {
      pap: papScore,
      wp: wpScore,
      sdp: sdpScore,
      psp: pspScore
    }
  };
}; 