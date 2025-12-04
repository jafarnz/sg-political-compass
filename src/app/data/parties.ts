import { AXIS_RANGE } from './axes';
import { questions, Question, getAxisDirection } from './questions';

export interface Party {
  id: string;
  name: string;
  shortName: string;
  color: string;
  secondaryColor: string;
  description: string;
  logoPath: string;
  founded: number;
  leader: string;
  keyPolicies: string[];
  website: string;
}

// Party positions are calculated dynamically from question data
// Economic: Left (-) = redistribution, welfare, public ownership | Right (+) = free market, low taxes, privatization
// Social: Libertarian (-) = civil liberties, personal freedom | Authoritarian (+) = state control, traditional values

export const parties: Party[] = [
  {
    id: 'pap',
    name: "People's Action Party",
    shortName: 'PAP',
    color: '#0065BF',
    secondaryColor: '#003d73',
    description: 'The ruling party since 1959, emphasizing economic growth, meritocracy, and strong governance. Supports targeted subsidies over universal welfare, fiscal prudence, and maintaining national reserves.',
    logoPath: 'https://upload.wikimedia.org/wikipedia/commons/1/18/PAP_logo_variation.svg',
    founded: 1954,
    leader: 'Lawrence Wong',
    keyPolicies: [
      'Build more public housing (HDB) to address affordability',
      'Financial aid and vouchers for cost of living support',
      'Healthcare expansion with Medisave/Medishield framework',
      'Progressive Wage Model over minimum wage',
      'Maintain large national reserves for future generations',
      'Strong emphasis on law and order'
    ],
    website: 'https://www.pap.org.sg'
  },
  {
    id: 'wp',
    name: "Workers' Party",
    shortName: 'WP',
    color: '#00A4E4',
    secondaryColor: '#0077a8',
    description: 'The main opposition party advocating for stronger social safety nets while working within the parliamentary system. Supports using national reserves more actively and protecting local workers.',
    logoPath: 'https://upload.wikimedia.org/wikipedia/en/3/34/Workers%27_Party_of_Singapore_logo.png',
    founded: 1957,
    leader: 'Pritam Singh',
    keyPolicies: [
      'GST exemption on essential goods (food, medicine)',
      'Increased use of national reserves for fiscal spending',
      'Redundancy insurance for retrenched workers',
      'Affordable public housing with shorter leases',
      'More parliamentary checks on government',
      'Greater transparency in public finances'
    ],
    website: 'https://www.wp.sg'
  },
  {
    id: 'psp',
    name: 'Progress Singapore Party',
    shortName: 'PSP',
    color: '#FF9E18',
    secondaryColor: '#cc7e13',
    description: 'Founded by former PAP MP Dr Tan Cheng Bock, advocating for Singaporeans-first policies, greater government accountability, and innovative housing solutions that exclude land cost.',
    logoPath: 'https://upload.wikimedia.org/wikipedia/commons/2/21/PSP_logo_variation.png',
    founded: 2019,
    leader: 'Tan Cheng Bock',
    keyPolicies: [
      'Reduce GST back to 7% or exempt essentials',
      'Housing schemes excluding land cost component',
      'Centralized drug procurement to lower healthcare costs',
      'Minimum living wage for workers',
      'Greater scrutiny of government spending',
      'Singaporeans-first employment policies'
    ],
    website: 'https://www.psp.org.sg'
  },
  {
    id: 'sdp',
    name: 'Singapore Democratic Party',
    shortName: 'SDP',
    color: '#E31C23',
    secondaryColor: '#b31519',
    description: 'The most progressive major opposition party, advocating for universal healthcare, significant democratic reforms, and strong civil liberties protections. Led by Dr Chee Soon Juan.',
    logoPath: 'https://upload.wikimedia.org/wikipedia/commons/4/47/SDP_logo_variation.png',
    founded: 1980,
    leader: 'Chee Soon Juan',
    keyPolicies: [
      'Universal national healthcare system (SingHealth)',
      'GST reduction with exemptions on essentials',
      'Non-open market housing with rebated land costs',
      'National minimum wage policy',
      'Freedom of speech and assembly',
      'Elected presidency reform'
    ],
    website: 'https://yoursdp.org'
  }
];

// ============================================================================
// PARTY POSITION CALCULATION - Derived from question data, not hardcoded
// ============================================================================

/**
 * Calculate a party's position on the political compass by summing their
 * "answers" (partyScores) to each question, weighted by question importance.
 * 
 * CRITICAL: We apply getAxisDirection() to transform raw agree/disagree scores
 * into ideological direction. This ensures parties and users are placed using
 * the SAME transformation:
 * 
 *   axisContribution = partyAnswer * axisDirection * weight
 * 
 * Without this, disagreeing with pro-liberty statements would incorrectly
 * make parties look libertarian instead of authoritarian.
 */
export const calculatePartyPosition = (partyId: string): { x: number; y: number } => {
  let economicScore = 0;
  let socialScore = 0;
  let economicMaxScore = 0;
  let socialMaxScore = 0;

  questions.forEach((question: Question) => {
    const partyAnswer = question.partyScores[partyId as keyof typeof question.partyScores];
    if (partyAnswer === undefined || partyAnswer === 0) return;

    // Get the ideological direction: does "Agree" move left/right or lib/auth?
    const axisDirection = getAxisDirection(question);
    if (axisDirection === 0) return; // Skip questions with no clear direction

    // Apply the same transformation as user scoring
    const contribution = partyAnswer * axisDirection * question.weight;
    const maxContribution = 2 * question.weight;

    if (question.axis === 'economic') {
      economicScore += contribution;
      economicMaxScore += maxContribution;
    } else {
      socialScore += contribution;
      socialMaxScore += maxContribution;
    }
  });

  // Normalize to -AXIS_RANGE to +AXIS_RANGE
  const normalizedEconomic = economicMaxScore > 0 
    ? (economicScore / economicMaxScore) * AXIS_RANGE 
    : 0;
  const normalizedSocial = socialMaxScore > 0 
    ? (socialScore / socialMaxScore) * AXIS_RANGE 
    : 0;

  return { x: normalizedEconomic, y: normalizedSocial };
};

// Cache calculated party positions for performance
let _partyPositionsCache: Map<string, { x: number; y: number }> | null = null;

const getPartyPositionsCache = (): Map<string, { x: number; y: number }> => {
  if (!_partyPositionsCache) {
    _partyPositionsCache = new Map();
    parties.forEach(party => {
      _partyPositionsCache!.set(party.id, calculatePartyPosition(party.id));
    });
  }
  return _partyPositionsCache;
};

/**
 * Get a party's calculated position on the compass
 */
export const getPartyPosition = (partyId: string): { x: number; y: number } | undefined => {
  const cache = getPartyPositionsCache();
  return cache.get(partyId);
};

/**
 * Get all party positions as an array
 */
export const getAllPartyPositions = (): { party: Party; position: { x: number; y: number } }[] => {
  return parties.map(party => ({
    party,
    position: getPartyPosition(party.id) || { x: 0, y: 0 }
  }));
};

// ============================================================================
// NORMALIZATION - Recenter around SG party landscape mean
// ============================================================================

/**
 * Calculate the mean (centroid) of all party positions
 * This represents the "center" of the SG political spectrum
 */
export const getPartyMeanPosition = (): { x: number; y: number } => {
  const positions = getAllPartyPositions();
  const sumX = positions.reduce((sum, p) => sum + p.position.x, 0);
  const sumY = positions.reduce((sum, p) => sum + p.position.y, 0);
  return {
    x: sumX / positions.length,
    y: sumY / positions.length
  };
};

/**
 * Get a party's position normalized around the party mean
 * This shows position relative to the SG party landscape
 */
export const getNormalizedPartyPosition = (partyId: string): { x: number; y: number } | undefined => {
  const position = getPartyPosition(partyId);
  if (!position) return undefined;
  
  const mean = getPartyMeanPosition();
  return {
    x: position.x - mean.x,
    y: position.y - mean.y
  };
};

/**
 * Normalize any position (user or party) around the party mean
 */
export const normalizePosition = (x: number, y: number): { x: number; y: number } => {
  const mean = getPartyMeanPosition();
  return {
    x: x - mean.x,
    y: y - mean.y
  };
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const getPartyById = (id: string): Party | undefined => {
  return parties.find(p => p.id === id);
};

export const getQuadrantName = (x: number, y: number): string => {
  if (x >= 0 && y > 0) return 'Authoritarian Right';
  if (x < 0 && y > 0) return 'Authoritarian Left';
  if (x < 0 && y <= 0) return 'Libertarian Left';
  if (x >= 0 && y <= 0) return 'Libertarian Right';
  return 'Centrist';
};

export const getQuadrantDescription = (x: number, y: number): string => {
  const quadrant = getQuadrantName(x, y);
  
  const descriptions: Record<string, string> = {
    'Authoritarian Right': 'You favor free market economics combined with traditional values and strong state authority. You believe in meritocracy, personal responsibility, and maintaining social order.',
    'Authoritarian Left': 'You support economic redistribution and a strong welfare state, but also believe in state authority to maintain social cohesion and traditional values.',
    'Libertarian Left': 'You support economic equality and redistribution while strongly valuing personal freedoms, civil liberties, and progressive social policies.',
    'Libertarian Right': 'You favor free market economics and minimal government intervention in both economic and personal matters. You value individual liberty above collective needs.',
    'Centrist': 'You hold moderate views that balance between different political philosophies, avoiding extremes on both economic and social issues.'
  };
  
  return descriptions[quadrant] || descriptions['Centrist'];
};

// ============================================================================
// PARTY ALIGNMENT & DISTANCE CALCULATIONS (using normalized positions)
// ============================================================================

export interface PartyAlignment {
  party: Party;
  position: { x: number; y: number };
  distance: number;
  alignment: number; // 0-100 percentage
  economicDiff: number;
  socialDiff: number;
}

/**
 * Calculate distances from user position to all parties
 * Uses normalized positions for fair comparison
 */
export const calculatePartyDistances = (userX: number, userY: number): PartyAlignment[] => {
  const mean = getPartyMeanPosition();
  const normalizedUserX = userX - mean.x;
  const normalizedUserY = userY - mean.y;
  
  // Max distance is the diagonal across the normalized compass
  // We calculate this dynamically based on party spread
  const positions = getAllPartyPositions();
  const normalizedPositions = positions.map(p => ({
    x: p.position.x - mean.x,
    y: p.position.y - mean.y
  }));
  
  // Find the max extent from normalized center
  const maxExtent = Math.max(
    ...normalizedPositions.map(p => Math.hypot(p.x, p.y)),
    Math.hypot(normalizedUserX, normalizedUserY)
  );
  const maxDistance = maxExtent * 2.5; // Allow for spread beyond parties
  
  return positions.map(({ party, position }) => {
    const normalizedPartyX = position.x - mean.x;
    const normalizedPartyY = position.y - mean.y;
    
    const economicDiff = position.x - userX;
    const socialDiff = position.y - userY;
    
    const distance = Math.hypot(
      normalizedPartyX - normalizedUserX,
      normalizedPartyY - normalizedUserY
    );
    
    // Convert distance to alignment percentage (closer = higher alignment)
    const alignment = Math.max(0, Math.min(100, ((maxDistance - distance) / maxDistance) * 100));
    
    return { 
      party, 
      position,
      distance, 
      alignment,
      economicDiff,
      socialDiff
    };
  }).sort((a, b) => a.distance - b.distance);
};

/**
 * Get the single closest party
 */
export const getClosestParty = (x: number, y: number): Party => {
  const distances = calculatePartyDistances(x, y);
  return distances[0].party;
};

// ============================================================================
// TIE DETECTION & TOP ALIGNED PARTIES
// ============================================================================

export interface TopAlignedResult {
  best: PartyAlignment;
  closeOnes: PartyAlignment[];
  isTie: boolean;
  tieThreshold: number;
}

/**
 * Get top aligned parties with tie detection
 * @param x User's economic position
 * @param y User's social position  
 * @param threshold Percentage point difference to consider a "close" match (default 5)
 */
export const getTopAlignedParties = (
  x: number,
  y: number,
  threshold: number = 5
): TopAlignedResult => {
  const distances = calculatePartyDistances(x, y);
  const best = distances[0];
  
  const closeOnes = distances
    .slice(1)
    .filter(p => Math.abs(p.alignment - best.alignment) <= threshold);
  
  return {
    best,
    closeOnes,
    isTie: closeOnes.length > 0,
    tieThreshold: threshold
  };
};

// ============================================================================
// KEY DIFFERENCES ANALYSIS (for comparing close parties)
// ============================================================================

export interface PolicyDifference {
  questionId: number;
  questionText: string;
  category: string;
  axis: 'economic' | 'social';
  party1Answer: number;
  party2Answer: number;
  userAnswer: number | undefined;
  differenceScore: number; // Higher = more different between parties
  userAlignsWith: string | 'both' | 'neither';
}

/**
 * Get key policy differences between two parties based on question data
 * Returns questions where the parties disagree most
 */
export const getKeyDifferences = (
  party1Id: string,
  party2Id: string,
  userAnswers: Record<number, number> = {},
  limit: number = 5
): PolicyDifference[] => {
  const differences: PolicyDifference[] = [];
  
  questions.forEach(question => {
    const p1Answer = question.partyScores[party1Id as keyof typeof question.partyScores];
    const p2Answer = question.partyScores[party2Id as keyof typeof question.partyScores];
    const userAnswer = userAnswers[question.id];
    
    if (p1Answer === undefined || p2Answer === undefined) return;
    
    const differenceScore = Math.abs(p1Answer - p2Answer);
    
    // Only include questions where parties meaningfully differ
    if (differenceScore >= 2) {
      let userAlignsWith: 'both' | 'neither' | string = 'neither';
      if (userAnswer !== undefined && userAnswer !== 0) {
        const distToP1 = Math.abs(userAnswer - p1Answer);
        const distToP2 = Math.abs(userAnswer - p2Answer);
        
        if (distToP1 <= 1 && distToP2 <= 1) {
          userAlignsWith = 'both';
        } else if (distToP1 <= distToP2 - 1) {
          userAlignsWith = party1Id;
        } else if (distToP2 <= distToP1 - 1) {
          userAlignsWith = party2Id;
        }
      }
      
      differences.push({
        questionId: question.id,
        questionText: question.text,
        category: question.category,
        axis: question.axis,
        party1Answer: p1Answer,
        party2Answer: p2Answer,
        userAnswer,
        differenceScore,
        userAlignsWith
      });
    }
  });
  
  // Sort by difference score and limit
  return differences
    .sort((a, b) => b.differenceScore - a.differenceScore)
    .slice(0, limit);
};

/**
 * Get common ground between two parties (where they agree)
 */
export const getCommonGround = (
  party1Id: string,
  party2Id: string,
  limit: number = 3
): { questionText: string; sharedStance: string }[] => {
  const commonGround: { questionText: string; sharedStance: string; agreement: number }[] = [];
  
  questions.forEach(question => {
    const p1Answer = question.partyScores[party1Id as keyof typeof question.partyScores];
    const p2Answer = question.partyScores[party2Id as keyof typeof question.partyScores];
    
    if (p1Answer === undefined || p2Answer === undefined) return;
    
    // Both agree (same sign and both non-zero)
    if (p1Answer !== 0 && p2Answer !== 0 && Math.sign(p1Answer) === Math.sign(p2Answer)) {
      const avgStance = (p1Answer + p2Answer) / 2;
      let sharedStance: string;
      if (avgStance >= 1.5) sharedStance = 'Strongly support';
      else if (avgStance > 0) sharedStance = 'Support';
      else if (avgStance <= -1.5) sharedStance = 'Strongly oppose';
      else sharedStance = 'Oppose';
      
      commonGround.push({
        questionText: question.text,
        sharedStance,
        agreement: Math.min(Math.abs(p1Answer), Math.abs(p2Answer))
      });
    }
  });
  
  return commonGround
    .sort((a, b) => b.agreement - a.agreement)
    .slice(0, limit)
    .map(({ questionText, sharedStance }) => ({ questionText, sharedStance }));
};
