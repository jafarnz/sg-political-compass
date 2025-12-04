import { NextRequest, NextResponse } from 'next/server';

// For Cloudflare Pages environment access
// @ts-ignore - This is available in Cloudflare Pages runtime
const getCloudflareEnv = () => {
  try {
    // Try Cloudflare's getRequestContext for Pages
    // @ts-ignore
    const { env } = process.env.CLOUDFLARE === 'true' || typeof process.env.CF_PAGES !== 'undefined'
      ? { env: process.env }
      : { env: process.env };
    return env;
  } catch {
    return process.env;
  }
};

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20; // requests per window
const RATE_WINDOW = 60 * 1000; // 1 minute window

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}

// Types
interface ExplainRequest {
  partyName: string;
  partyId: string;
  questionText: string;
  stance: string;
  stanceScore: number;
  category: string;
}

// Party resources for context
const PARTY_RESOURCES: Record<string, { website: string; leader: string }> = {
  pap: { website: 'https://www.pap.org.sg', leader: 'Prime Minister Lawrence Wong' },
  wp: { website: 'https://www.wp.sg', leader: 'Pritam Singh' },
  psp: { website: 'https://www.psp.org.sg', leader: 'Tan Cheng Bock' },
  sdp: { website: 'https://yoursdp.org', leader: 'Chee Soon Juan' }
};

const CATEGORY_CONTEXT: Record<string, string> = {
  taxation: 'GST, taxation policy, fiscal policy, government budget, reserves, wealth tax',
  housing: 'HDB, public housing, BTO, resale flats, housing affordability, land costs',
  healthcare: 'healthcare costs, Medisave, Medishield, hospital bills, universal healthcare',
  employment: 'minimum wage, Progressive Wage Model, foreign workers, PMET, jobs',
  welfare: 'CPF, social safety net, welfare, subsidies, ComCare, Silver Support',
  governance: 'parliament, transparency, GRC, NCMP, elected president, checks and balances',
  civil_liberties: 'freedom of speech, media freedom, POFMA, protests, assembly, Section 377A',
  immigration: 'immigration policy, foreign talent, new citizens, population growth'
};

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               request.headers.get('cf-connecting-ip') ||
               'unknown';
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a minute and try again.' },
        { status: 429 }
      );
    }

    // Get API key from environment
    const env = getCloudflareEnv();
    const apiKey = env.GOOGLE_AI_API_KEY;
    
    if (!apiKey) {
      console.error('GOOGLE_AI_API_KEY not found in environment');
      return NextResponse.json(
        { error: 'API key not configured. Please contact the administrator.' },
        { status: 500 }
      );
    }

    const body: ExplainRequest = await request.json();
    const { partyName, partyId, questionText, stance, category } = body;
    const categoryContext = CATEGORY_CONTEXT[category] || '';
    const partyInfo = PARTY_RESOURCES[partyId];

    // Detailed prompt that asks for comprehensive explanation with quotes
    const prompt = `You are an expert political analyst specializing in Singapore politics. Provide a COMPREHENSIVE, DETAILED explanation for why "${partyName}" would "${stance}" with this policy statement:

"${questionText}"

REQUIREMENTS - Your response must include ALL of these:

1. **POLICY RATIONALE** (2-3 paragraphs):
   - Explain the party's ideological foundation for this position
   - Connect it to their broader political philosophy and manifesto
   - Discuss how this fits into Singapore's political landscape

2. **DIRECT QUOTES** (mandatory):
   - Include at least 2-3 EXACT QUOTES from party leaders, manifestos, or parliamentary speeches
   - Format quotes like: "Quote here" - Speaker Name, Source/Date
   - Use real statements from ${partyInfo?.leader || 'party leaders'}, MPs, or official documents

3. **HISTORICAL CONTEXT**:
   - Reference any relevant parliamentary debates, policy announcements, or manifesto points
   - Mention how this position has evolved or stayed consistent over time

4. **POLICY SPECIFICS**:
   - Cite specific numbers, proposals, or policy mechanisms the party has mentioned
   - Reference their 2020 or 2025 manifesto where applicable

5. **COMPARATIVE ANALYSIS** (brief):
   - How does this compare to other parties' positions on this issue?

Context: This is about ${category} policy in Singapore. Related topics: ${categoryContext}

Party website: ${partyInfo?.website}

Write in a professional, analytical tone. Be thorough and specific. Do not make up quotes - only use real statements you can verify from your search.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2000,
          },
          tools: [{
            googleSearch: {}
          }]
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      return NextResponse.json(
        { error: `AI service error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    if (data.error) {
      console.error('Gemini API returned error:', data.error);
      return NextResponse.json(
        { error: data.error.message || 'AI service error' },
        { status: 500 }
      );
    }

    // Get the explanation text
    const explanation = data.candidates?.[0]?.content?.parts?.[0]?.text || 
      'Unable to generate explanation.';

    // ONLY use grounding sources - these have REAL URLs via vertex redirect
    const groundingMetadata = data.candidates?.[0]?.groundingMetadata;
    const sources: { title: string; url: string; type: string; snippet?: string }[] = [];
    
    // Extract grounding chunks - these are the ONLY reliable sources
    if (groundingMetadata?.groundingChunks) {
      for (const chunk of groundingMetadata.groundingChunks) {
        if (chunk.web?.uri && chunk.web?.title) {
          let type = 'search';
          const url = chunk.web.uri.toLowerCase();
          if (url.includes('parliament') || url.includes('hansard')) {
            type = 'parliament';
          } else if (url.includes('.gov.sg')) {
            type = 'official';
          } else if (url.includes('straitstimes') || url.includes('channelnewsasia') || 
                     url.includes('todayonline') || url.includes('cna.')) {
            type = 'news';
          } else if (url.includes('pap.org') || url.includes('wp.sg') || 
                     url.includes('psp.org') || url.includes('yoursdp')) {
            type = 'manifesto';
          } else if (url.includes('youtube')) {
            type = 'video';
          }
          
          sources.push({
            title: chunk.web.title,
            url: chunk.web.uri,
            type
          });
        }
      }
    }

    // Extract grounding support segments if available
    if (groundingMetadata?.groundingSupports) {
      for (const support of groundingMetadata.groundingSupports) {
        if (support.segment?.text && support.groundingChunkIndices) {
          for (const idx of support.groundingChunkIndices) {
            if (sources[idx] && !sources[idx].snippet) {
              sources[idx].snippet = support.segment.text;
            }
          }
        }
      }
    }

    // Fallback to party website if no grounding sources
    if (sources.length === 0) {
      const partyWebsite = PARTY_RESOURCES[partyId]?.website;
      if (partyWebsite) {
        sources.push({
          title: `${partyName} Official Website`,
          url: partyWebsite,
          type: 'official'
        });
      }
    }

    // Determine confidence based on source quality
    let confidence = 'low';
    const hasOfficialSource = sources.some(s => 
      s.type === 'manifesto' || s.type === 'parliament' || s.type === 'official'
    );
    const hasNewsSource = sources.some(s => s.type === 'news');
    
    if (hasOfficialSource && sources.length >= 3) {
      confidence = 'high';
    } else if (hasOfficialSource || (hasNewsSource && sources.length >= 2)) {
      confidence = 'medium';
    }

    return NextResponse.json({
      explanation: explanation.trim(),
      sources,
      confidence,
      searchQueries: groundingMetadata?.webSearchQueries || []
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

export const runtime = 'edge';
