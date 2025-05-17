export interface Party {
  id: string;
  name: string;
  shortName: string;
  economicPosition: number; // -10 to 10
  socialPosition: number; // -10 to 10
  color: string;
  description: string;
  logoPath: string;
}

export const parties: Party[] = [
  {
    id: 'pap',
    name: 'People\'s Action Party',
    shortName: 'PAP',
    economicPosition: 4.0, // +20 / 5
    socialPosition: 3.0, // +15 / 5
    color: '#0065BF', // PAP blue
    description: 'Pro-growth, market-oriented with targeted social welfare programs. Socially conservative with top-down governance.',
    logoPath: '/party-logos/pap-logo.png',
  },
  {
    id: 'wp',
    name: 'Workers\' Party',
    shortName: 'WP',
    economicPosition: -2.0, // -10 / 5
    socialPosition: -1.0, // -5 / 5
    color: '#00A4E4', // WP blue
    description: 'Supports stronger social safety nets while accepting market economy. More progressive on civil rights and participatory democracy.',
    logoPath: '/party-logos/wp-logo.png',
  },
  {
    id: 'sdp',
    name: 'Singapore Democratic Party',
    shortName: 'SDP',
    economicPosition: -3.0, // -15 / 5
    socialPosition: -2.0, // -10 / 5
    color: '#FF0000', // SDP red
    description: 'Advocates universal healthcare, minimum wage, and wealth redistribution. Strongly pro-civil liberties and democratic reform.',
    logoPath: '/party-logos/sdp-logo.png',
  },
  {
    id: 'psp',
    name: 'Progress Singapore Party',
    shortName: 'PSP',
    economicPosition: -1.6, // -8 / 5
    socialPosition: -0.6, // -3 / 5
    color: '#FF9E18', // PSP orange
    description: 'Promotes progressive taxes, welfare expansion, and prioritizing local workers. Calls for accountability and transparency in governance.',
    logoPath: '/party-logos/psp-logo.png',
  }
];

export const getPartyPosition = (partyId: string): { x: number; y: number } | undefined => {
  const party = parties.find(p => p.id === partyId);
  if (!party) return undefined;
  return { x: party.economicPosition, y: party.socialPosition };
};

export const getQuadrantDescription = (x: number, y: number): string => {
  if (x >= 0 && y >= 0) return 'Authoritarian Right';
  if (x < 0 && y >= 0) return 'Authoritarian Left';
  if (x < 0 && y < 0) return 'Libertarian Left';
  if (x >= 0 && y < 0) return 'Libertarian Right';
  return 'Centrist';
};

export const getClosestParty = (x: number, y: number): Party => {
  let closestParty = parties[0];
  let closestDistance = Infinity;
  
  parties.forEach(party => {
    const distance = Math.sqrt(
      Math.pow(party.economicPosition - x, 2) + 
      Math.pow(party.socialPosition - y, 2)
    );
    
    if (distance < closestDistance) {
      closestDistance = distance;
      closestParty = party;
    }
  });
  
  return closestParty;
}; 