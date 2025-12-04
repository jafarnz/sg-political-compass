import { NextRequest } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW = 60 * 1000;

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

interface ExplainRequest {
  partyName: string;
  partyId: string;
  questionText: string;
  stance: string;
  stanceScore: number;
  category: string;
}

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

// Get API key from environment (works for both local and Cloudflare)
function getApiKey(): string | undefined {
  // Try Cloudflare Pages context first
  try {
    const ctx = getRequestContext();
    const env = ctx?.env as Record<string, string> | undefined;
    if (env?.GOOGLE_AI_API_KEY) {
      return env.GOOGLE_AI_API_KEY;
    }
  } catch (e) {
    // Not in Cloudflare context
  }
  
  // Fall back to process.env (for local dev)
  return process.env.GOOGLE_AI_API_KEY;
}

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             request.headers.get('cf-connecting-ip') ||
             'unknown';
  
  if (!checkRateLimit(ip)) {
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please wait a minute.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Get API key
  const apiKey = getApiKey();
  
  if (!apiKey) {
    console.error('GOOGLE_AI_API_KEY not found in environment');
    return new Response(
      JSON.stringify({ error: 'API key not configured. Please contact the administrator.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body: ExplainRequest;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(
      JSON.stringify({ error: 'Invalid request body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { partyName, partyId, questionText, stance, category } = body;
  const categoryContext = CATEGORY_CONTEXT[category] || '';
  const partyInfo = PARTY_RESOURCES[partyId];

  // Detailed prompt for comprehensive explanation
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

  // Create streaming response
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Make request to Gemini with streaming
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${apiKey}&alt=sse`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 2000,
              },
              tools: [{ googleSearch: {} }]
            })
          }
        );

        if (!response.ok) {
          let errorMessage = `AI service error: ${response.status}`;
          try {
            const errorText = await response.text();
            console.error('Gemini API error:', response.status, errorText);
            const errorJson = JSON.parse(errorText);
            if (errorJson.error?.message) {
              errorMessage = errorJson.error.message;
            }
          } catch (e) {
            // Ignore parsing error
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`));
          controller.close();
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'No response body from AI service' })}\n\n`));
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let fullText = '';
        let groundingMetadata: any = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          
          // Process SSE events
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                
                // Extract text chunks
                const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                  fullText += text;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text, type: 'text' })}\n\n`));
                }
                
                // Capture grounding metadata when it appears
                if (parsed.candidates?.[0]?.groundingMetadata) {
                  groundingMetadata = parsed.candidates[0].groundingMetadata;
                }
              } catch (e) {
                // Skip unparseable lines
              }
            }
          }
        }

        // Send sources at the end (ONLY from grounding - these are real URLs)
        const sources: { title: string; url: string; type: string; snippet?: string }[] = [];
        
        if (groundingMetadata?.groundingChunks) {
          for (const chunk of groundingMetadata.groundingChunks) {
            if (chunk.web?.uri && chunk.web?.title) {
              let type = 'search';
              const url = chunk.web.uri.toLowerCase();
              if (url.includes('parliament') || url.includes('hansard')) type = 'parliament';
              else if (url.includes('.gov.sg')) type = 'official';
              else if (url.includes('straitstimes') || url.includes('channelnewsasia') || 
                       url.includes('todayonline') || url.includes('cna.')) type = 'news';
              else if (url.includes('pap.org') || url.includes('wp.sg') || 
                       url.includes('psp.org') || url.includes('yoursdp')) type = 'manifesto';
              else if (url.includes('youtube')) type = 'video';
              
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

        // Determine confidence
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

        // Send final message with sources
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'done',
          sources,
          confidence,
          searchQueries: groundingMetadata?.webSearchQueries || []
        })}\n\n`));

        controller.close();
      } catch (error) {
        console.error('Streaming error:', error);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          error: error instanceof Error ? error.message : 'Unknown error occurred' 
        })}\n\n`));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

export const runtime = 'edge';
