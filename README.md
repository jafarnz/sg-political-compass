# Singapore Political Compass 🇸🇬

A political compass quiz tailored for Singapore's 2025 General Election. Answer 40 policy questions and discover which political party aligns most with your views.

## Features

- **40 Policy Questions** based on actual 2025 manifesto positions across 8 categories
- **Fair Scoring System** - Party positions are calculated from the same questions users answer
- **Close Match Detection** - When parties are within 9%, shows detailed comparison
- **Detailed Review** - See all questions with party stances and AI-powered explanations
- **Verified Sources** - AI explanations include links to manifestos, parliament records, and news
- **Shareable Results** - Download your results as an image

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## AI-Powered Explanations (Optional)

The "Detailed Review" page includes a "Why this stance?" feature that uses Google Gemini with Search Grounding to provide **100% accurate, sourced explanations**.

### Setup Google Gemini API

1. Get an API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a `.env.local` file in the project root:

```env
GOOGLE_AI_API_KEY=your_api_key_here
```

**Features:**
- Uses Google Search grounding for real-time source verification
- Returns links to official manifestos, parliament records, and news articles
- Includes direct quotes from verified sources
- Shows confidence level (Verified/Likely/Inferred)

**Note:** If no API key is configured, the app will show fallback explanations based on known manifesto positions.

---

## Deployment to Cloudflare Workers

This app is optimized for Cloudflare Pages/Workers deployment.

### Prerequisites

1. [Cloudflare account](https://dash.cloudflare.com/sign-up)
2. [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

```bash
npm install -g wrangler
wrangler login
```

### Deploy Steps

#### Option 1: One-Command Deploy

```bash
npm run deploy:prod
```

#### Option 2: Manual Steps

```bash
# 1. Build for Cloudflare
npm run build:cloudflare

# 2. Preview locally (optional)
npm run preview:cloudflare

# 3. Deploy to Cloudflare Pages
npx wrangler pages deploy .vercel/output/static --project-name=sg-political-compass
```

### Set Environment Variables

After first deployment, add your API key in Cloudflare Dashboard:

1. Go to **Workers & Pages** → **sg-political-compass**
2. Click **Settings** → **Environment variables**
3. Add: `GOOGLE_AI_API_KEY` = your API key
4. Choose **Encrypt** for security

### Custom Domain (Optional)

1. Go to **Workers & Pages** → **sg-political-compass** → **Custom domains**
2. Add your domain (e.g., `sgcompass.example.com`)
3. Follow DNS setup instructions

---

## How Scoring Works

### Party Positions
- Each question has a `partyScores` object showing how each party would answer (-2 to +2)
- Party positions on the compass are calculated by summing these scores (not hardcoded)
- This ensures parties and users are measured on the exact same scale

### User Scoring
- User answers are transformed using `getAxisDirection()` to determine ideological direction
- The same transformation is applied to party scores for fair comparison
- Alignment % is based on Euclidean distance in the normalized political space

### Close Match Threshold
- When two parties are within 9% alignment, the app shows a detailed comparison
- Includes "What Swayed Your Result" analysis showing which questions made the difference

---

## Project Structure

```
src/app/
├── components/
│   ├── Introduction.tsx    # Landing page
│   ├── Quiz.tsx           # Quiz interface
│   ├── QuizQuestion.tsx   # Individual question component
│   ├── Results.tsx        # Results page with close match detection
│   ├── DetailedReview.tsx # Full question review with AI explanations
│   └── PoliticalCompass.tsx # Canvas-based compass visualization
├── data/
│   ├── questions.ts       # 40 questions with party scores
│   ├── parties.ts         # Party data and scoring functions
│   └── axes.ts           # Axis configuration
└── api/
    └── explain-stance/route.ts # AI explanation API (Edge Runtime)
```

## Parties Covered

- **PAP** - People's Action Party
- **WP** - Workers' Party
- **PSP** - Progress Singapore Party
- **SDP** - Singapore Democratic Party

## Tech Stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- html2canvas (for sharing)
- Google Gemini 2.0 Flash (for AI explanations)
- Cloudflare Pages/Workers (deployment)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_AI_API_KEY` | No | Google AI API key for AI explanations |
| `CLOUDFLARE` | No | Set to `true` when building for Cloudflare |

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production (Vercel/Node) |
| `npm run build:cloudflare` | Build for Cloudflare Workers |
| `npm run preview:cloudflare` | Preview Cloudflare build locally |
| `npm run deploy` | Deploy to Cloudflare Pages |
| `npm run deploy:prod` | Deploy to production |

---

## Disclaimer

This quiz is for educational purposes only. Political positions are complex and nuanced. Party positions are derived from official manifesto stances from the 2025 General Election. This tool is not affiliated with any political party. Always research parties thoroughly before voting.

## License

MIT
