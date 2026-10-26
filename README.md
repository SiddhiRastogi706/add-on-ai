# MarketMind AI - Autonomous AI-Powered Digital Marketing Automation SaaS Platform

> **"Your AI Marketing Team, Working 24/7."**

MarketMind AI is an enterprise-ready, autonomous digital marketing SaaS platform. A business connects their website and marketing accounts once, configures their budget and goals once, and the centralized **Marketing Brain** coordinates 10 specialized AI agents to continuously handle SEO, social media, Google & Meta Ads, content generation, analytics, competitor intelligence, and lead qualification in the background.

---

## 🌟 Key Highlights & Core Capabilities

- **10 Autonomous AI Agents Orchestrated by "Marketing Brain"**:
  1. **Business Intelligence Agent**: Crawls target domain, extracts brand voice, target personas, and USPs.
  2. **SEO Agent**: Technical SEO health audits, keyword clustering across search intents, and local NAP diagnostics.
  3. **Content Agent**: Generates long-form SEO blog posts, landing pages, meta tags, and FAQ schema markup.
  4. **Social Media Agent**: Crafts 30-day cross-platform schedules (LinkedIn, Instagram, X, Facebook, YouTube) and auto-publishes where permitted.
  5. **Ads Agent**: Plans Google Search Ads (responsive ads, negative keywords) and Meta Ads (creatives, lookalikes).
  6. **Analytics Agent**: Synthesizes cross-channel traffic, conversion funnels, and blended ROAS metrics.
  7. **Competitor Agent**: Non-invasive public crawl detecting content gaps, keyword vacuums, and rival vulnerabilities.
  8. **Optimization Agent**: Evaluates algorithmic budget reallocation and bid shifts within strict safety guardrails.
  9. **Reporting Agent**: Compiles standardized 6-part executive briefings with 1-click CSV and print-ready PDF export.
  10. **Lead Agent**: CRM pipeline with automated intent scoring (Hot/Warm/Cold) and personalized follow-up guidance.
- **Autonomous Background Execution**:
  - Continuous 24/7 background scheduler engine running independent of the browser.
  - Periodic SEO crawling, ad bid monitoring, and social queue broadcast.
- **Strict Budget Guardrails & Emergency Stop**:
  - Enforced monthly budgets and daily caps.
  - Budget shifts >20% or live ad launches automatically route to the **Needs Your Approval** center.
  - 1-Click **Emergency Stop** immediately pauses all active campaigns.
- **Honest Integration Architecture**:
  - Live API status indicators for Google Search Console, Google Analytics 4, Google Ads, Meta Ads, and LinkedIn.
  - Unconnected platforms run seamlessly in an isolated **Sandbox Demo Mode**, clearly labeled to prevent confusion.
- **Premium Soft Colorful UI / UX**:
  - Built with Tailwind CSS, Framer Motion, soft pastel gradients (lavender, mint, sky blue, peach, blush), 16–24px rounded corners, glassmorphic elevation, and interactive Recharts data visualizations.

---

## 🏗 System Architecture

```mermaid
flowchart TD
    subgraph Frontend["Frontend (React 18 + Vite + Tailwind CSS + Framer Motion)"]
        Landing["Landing Page & Hero Visualizer"]
        Onboarding["11-Step Calibration Wizard"]
        Dashboard["Command Center Dashboard"]
        AgentGraph["Interactive Marketing Brain Visualizer"]
        Modules["SEO, Content, Social, Ads, CRM, Reports, Settings"]
    end

    subgraph BackendAPI["Backend API (Node.js + Express + TypeScript)"]
        Router["Modular REST Gateway (/api/*)"]
        AuthMid["JWT Auth & Tenant Isolation"]
        Crawler["Cheerio Web Crawler Engine"]
        Safety["Safety, Fact & Brand Tone Validator"]
    end

    subgraph CentralBrain["Central Marketing Brain (10 AI Agents)"]
        Brain["Marketing Brain Master Orchestrator"]
        BI["BI Agent"]
        SEO["SEO Agent"]
        Content["Content Agent"]
        Social["Social Agent"]
        Ads["Ads Agent"]
        Analytics["Analytics Agent"]
        Competitor["Competitor Agent"]
        Opt["Optimization Agent"]
        Report["Reporting Agent"]
        Lead["Lead Agent"]
    end

    subgraph BackgroundEngine["Background Automation Engine"]
        Scheduler["Scheduler (Daily / Weekly / Monthly)"]
        Queue["BullMQ / Resilient In-Process Queue"]
    end

    subgraph DataStorage["Data & State Layer"]
        PrismaORM["Prisma ORM (24 Relational Models)"]
        Database[(PostgreSQL)]
        AIMemory["Isolated Tenant AI Memory"]
    end

    Frontend <--> BackendAPI
    BackendAPI <--> CentralBrain
    CentralBrain --> Safety
    CentralBrain <--> BackgroundEngine
    BackendAPI <--> DataStorage
    BackgroundEngine <--> DataStorage
    Brain --> BI & SEO & Content & Social & Ads & Analytics & Competitor & Opt & Report & Lead
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v22+ recommended)
- **npm**: v9.0.0 or higher

### 2. Clone & Install
```bash
git clone https://github.com/your-org/marketmind-ai.git
cd marketmind-ai
npm install
cp .env.example .env
```

Set `DATABASE_URL` in `.env` to a PostgreSQL connection string. For local
development, start a local PostgreSQL instance or use a hosted PostgreSQL
database. The same setting must be configured on the production API host.

### 3. Initialize Database & Seed Demo Data
```bash
# Create/update the PostgreSQL schema
npm run db:push

# Seed with verified realistic demo data (NexusFlow AI)
npm run db:seed
```

### 4. Run Development Servers
```bash
# Starts both Express Backend (:5000) and Vite Frontend (:5173) concurrently
npm run dev
```

Open your browser at `http://localhost:5173`.
Use the language menu in the top-right corner to translate the page between English and Hindi.

### Account sign-in

Create an account with a unique username, email address, and your own password. Sign in later with either your email or username and that password. Passwords are stored as bcrypt hashes. If you forget your password, choose **Forgot password?** to receive a one-time reset code by email; configure `RESEND_API_KEY` (and optionally `EMAIL_FROM`) on the server for password recovery emails.

### Wallet and AI usage billing

Signed-in users can open the wallet from the top-right header, add ₹100–₹50,000 through the configured Cashfree or Razorpay gateway, and review recent wallet transactions. Successful top-ups are credited once after payment verification. Authenticated Gemini requests reserve funds before calling the provider, then settle against Gemini's returned input/output token counts; unused reservation is released. Wallet values are stored in paise.

Set the server-only `AI_USAGE_PRICING_INR_PER_MILLION_TOKENS` environment variable to a JSON object mapping each Gemini model name to its current INR-per-million-token `input` and `output` rates. A `*` entry can provide a shared rate for configured fallback models. Use the rates applicable to your Google AI billing account; rates are deliberately not guessed or bundled because provider/model pricing and account terms can differ. Live Gemini wallet usage is blocked with an explicit error until a valid rate is configured. AI usage below one paise is carried forward and rounded down cumulatively rather than rounded up on every request.

This metering covers Gemini token usage. Advertising spend remains billed by the user's connected ad platform; external services that do not return a verifiable per-request charge are not deducted from the wallet.

---

## 🔑 Demo Account Credentials

| Role | Email | Password | Workspace |
| :--- | :--- | :--- | :--- |
| **Super Admin / Founder** | `founder@nexusflow.io` | `password123` | NexusFlow Technologies |
| **Instant 1-Click Access** | Click **"Instant 1-Click Demo Login"** on the Sign In page |

---

## ⚙️ Environment Configuration (`.env`)

Copy `.env.example` to `.env`:

```env
# Server
PORT=5000
NODE_ENV=development
APP_URL=http://localhost:5173

# PostgreSQL database (replace with your local/hosted connection string)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here
SESSION_SECRET=your_session_secret_key_here

# AI Provider ("auto", "gemini", "openai", "smart-mock")
# If API keys are omitted, MarketMind runs on the Neural Heuristic Engine with zero failure
AI_PROVIDER=auto
GEMINI_API_KEY=
OPENAI_API_KEY=

# Phone OTP provider: StartMessaging uses an X-API-Key header.
SMS_PROVIDER=startmessaging
SMS_GATEWAY_URL=https://api.startmessaging.com/otp/send
SMS_API_KEY=your_startmessaging_api_key

# Background Queue (Optional: uses high-speed in-process queue if Redis is not set)
REDIS_URL=

# External OAuth Integrations
# Google sign-in requires a Google Cloud OAuth 2.0 Web application client ID.
# Add each frontend origin under Authorized JavaScript origins (not redirect URIs):
#   http://localhost:5173
#   https://your-production-domain.example
# GOOGLE_CLIENT_ID must be this same Web application client ID on the API server.
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
META_APP_ID=
META_APP_SECRET=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
```

---

### Google sign-in troubleshooting

If Google shows `Error 401: invalid_client` or `no registered origin`, the OAuth
client is not authorized for the exact website origin currently open in the
browser. In Google Cloud Console, open **APIs & Services → Credentials**, edit
the OAuth 2.0 Client ID used by this app, and confirm its application type is
**Web application**. Under **Authorized JavaScript origins**, add
`http://localhost:5173` for local Vite development. For a deployed site, add its
origin too. For the current production site, add `https://addonaix.com`; add
`https://www.addonaix.com` as a separate origin only if the site is also served
from that hostname. Enter only the scheme and hostname plus an optional
port—do not include `/login`, another path, or a trailing slash. Add
`http://127.0.0.1:5173` separately only if you open the app using that host.

Set `GOOGLE_CLIENT_ID` on the API server to the exact client ID of that same
Web application OAuth client, then restart the local API or redeploy/restart
the production backend. The frontend loads this ID from `/api/auth/google-config`,
and the backend uses it to verify the returned Google credential. A client ID
being present in `.env` alone does not register a browser origin; that must be
done in Google Cloud Console.

### Local competitor analysis setup

The local competitor page uses OpenStreetMap's public Nominatim geocoder and
Overpass service to return live mapped business names, categories, addresses,
websites (when mapped), and approximate distance. It needs no paid API key.
Searches are authenticated and rate-limited; results are not persisted, and
geocoding requests are serialized and briefly cached in process. Public
community services are shared resources with usage limits and no uptime
guarantee. If the primary Overpass endpoint is busy, the backend tries two
compatible public mirrors, then searches mapped place names via Nominatim. The
fallback is a smaller name-based search and may return fewer listings.
`OSM_NOMINATIM_URL` and `OSM_OVERPASS_URL` can be set to compatible providers if
the defaults need to be changed. Set `OSM_CONTACT_EMAIL` to a
maintainer contact for the identifying geocoder User-Agent in production. The
built-in throttle is per backend process; keep a single backend instance when
using the public endpoints, or use a shared distributed throttle and compatible
provider before scaling horizontally.

OpenStreetMap does not provide Google ratings, reviews, or photos; the UI does
not invent or estimate them. Results require OpenStreetMap attribution, and
OpenStreetMap data is available under the ODbL. For a commercial production
service, review the
[Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/)
and [OpenStreetMap copyright/attribution terms](https://www.openstreetmap.org/copyright).

## 🧪 Automated Testing

Run the full end-to-end verification suite covering safety validators, crawler accuracy, agent generation, budget guardrails, and lead scoring:

```bash
npx tsx test/system.test.ts
```

Output:
```
Verification Complete: 22 Passed, 0 Failed
```

---

## 📦 Production Build & Deployment

### Build Client & Server
```bash
npm run build
```

This compiles:
- `dist/server/`: Production CommonJS Node server
- `dist/client/`: Minified, tree-shaken static assets with gzip compression

### Production Start
```bash
npm start
```
The server serves the REST API on `/api/*` and delivers the static React client from `dist/client` for all other routes.

### Docker Deployment
Configure `DATABASE_URL` on the API host. Before starting the deployment, run
the schema command from the project checkout in an environment that can reach
that PostgreSQL instance:

```bash
npm run db:push
```

Do not run this during the Docker image build: the database must be reachable
from the deployment environment, and schema changes should be applied as an
explicit deployment step. The application no longer uses or copies a local
`dev.db` file.

Create a `Dockerfile`:
```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run db:generate && npm run build

FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
EXPOSE 5000
CMD ["npm", "start"]
```

---

## 🛡 Security & Compliance

- **Tenant Isolation**: Organizations, AI memory, and credentials strictly segregated by `organizationId`.
- **Encrypted Secrets**: OAuth tokens and API secrets stored encrypted, never exposed to client bundles.
- **Budget Guardrails**: Hard spend caps enforced in software with immediate emergency stop overrides.
- **AI Safety Disclaimer**: Transparency notices on all generated assets with confidence scoring and fact validation checks.

---

## 📌 Roadmap & Future Integrations (TODO)

The following integrations are intentionally deferred and scheduled for future phases as they require separate developer app approvals and elevated enterprise verification:

1. **YouTube Data API v3 & YouTube Shorts Auto-Publisher**:
   - Requires Google Cloud Console verification for `https://www.googleapis.com/auth/youtube.upload` scope and OAuth consent screen brand audit.
   - Will support direct automated upload of generated video assets, title/description tagging, and short-form video distribution.

2. **Google Business Profile (GBP) API**:
   - Requires Google Business Profile API account approval via Google Partner program.
   - Will support local business post broadcasts, review response automation, and local NAP (Name, Address, Phone) citation synchronization.

---

## 📄 License

MIT License &copy; 2026 MarketMind Technologies Inc.
