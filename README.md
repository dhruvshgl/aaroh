# Aaroh

Aaroh is an AI career consultant. It turns a career profile and an optional resume into a report, alternative paths, a roadmap, projects, and a consultant that keeps that record.

The loop is current state, desired state, gap, path, progress. A resume is evidence, not the whole person. A skill that is only listed is not treated as a skill used in production.

## What you can do

- Read the landing page and create an account with email and password. Google, LinkedIn, and Apple appear only when those providers are configured.
- Complete onboarding: background, goal, timeframe, preferences, and an optional PDF or DOCX resume (10 MB).
- Run an eight-stage career analysis and watch each stage complete.
- Open a report of strengths, gaps, recommendations, and an alignment estimate, and download it as a PDF.
- Review alternative paths, follow a four-phase roadmap, set weekly hours, and track projects.
- Ask the consultant follow-up questions. It answers from the saved profile, report, gaps, roadmap, and projects.
- Remove a resume or delete the account.

## How analysis works

Analysis runs on the server. The browser receives an id and polls status. Each stage must match a fixed schema before it is saved. A failed stage can be retried. Finished stages are kept.

1. Extract the resume, or skip that stage when there is no resume.
2. Normalize the background.
3. Analyze skills and depth: listed, practiced, or production.
4. Interpret the goal as specific, broad, or open.
5. Compare the profile with the target and name the gaps.
6. Suggest adjacent paths.
7. Build a four-phase roadmap with projects.
8. Write the report narrative.

Alignment is calculated in [`lib/career/alignment.ts`](lib/career/alignment.ts). Skill depth is 40%, relevant experience is 25%, evidence strength is 20%, and goal clarity is 15%. A capped penalty for serious gaps is then applied. The result stays between 8 and 92. The model explains that number. It does not choose a different one.

The product states this directly: the figure is an internal estimate based on the stated goal, demonstrated skills, experience, and identified gaps. It is not a prediction of hiring outcomes.

Alternative paths get a separate fit score from skill overlap, interest overlap, transferable experience, and how heavy the remaining gaps are.

## Stack

Next.js 16, React 19, Tailwind CSS, PostgreSQL 16, Prisma, Auth.js, and the OpenAI API on the server. Analysis defaults to `gpt-5-mini`. Chat defaults to `gpt-5-nano`.

PostgreSQL holds the career record because a report, its paths, its roadmap, and its projects are related rows written in one transaction. An earlier engineering note mentioned MongoDB. The running application uses PostgreSQL. The schema in [`prisma/schema.prisma`](prisma/schema.prisma) is the source of truth.

## Getting started

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and set `AUTH_SECRET`.
3. Start Postgres: `docker compose up -d`
4. Apply the schema: `npx prisma migrate dev`
5. Optional demo profile: `npx prisma db seed`
   - Email: `demo@aaroh.local`
   - Password: `AarohDemo123!`
6. `npm run dev`

### Test login mode

For demos and testing only. With `TEST_LOGIN_MODE="true"`, any email and any password log in: an existing email signs in whatever the password, and a new email gets a fresh account that starts at onboarding. Sessions, protected routes and per-user data work exactly as normal; only the credential check is relaxed. The login and signup screens show a notice while it is on.

- Enable locally: set `TEST_LOGIN_MODE="true"` in `.env` and restart `npm run dev`.
- Enable on Vercel: add `TEST_LOGIN_MODE` = `true` under Project → Settings → Environment Variables, then redeploy.
- Test account (created by `npx prisma db seed`): `test@gmail.com` / `test123`. It has an empty profile, so it goes through onboarding and a real analysis.

> **Warning:** set `TEST_LOGIN_MODE` back to `false` (and redeploy) before real users sign up. While it is on, anyone who knows an email address can open that account.

Other commands:

| Command | What it does |
| --- | --- |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm run lint` | ESLint |
| `npm test` | The alignment formula only |
| `npm run db:up` | Start Postgres in Docker |

`postinstall` runs `prisma generate`.

## Environment

Copy from [`.env.example`](.env.example).

| Variable | Role |
| --- | --- |
| `DATABASE_URL` | Postgres connection string. Local default is `postgresql://aaroh:aaroh@localhost:5432/aaroh`. |
| `AUTH_SECRET` | Auth.js secret. Use a long random string. |
| `AUTH_URL` | Public app URL. Local default is `http://localhost:3000`. |
| `TEST_LOGIN_MODE` | Testing only. `"true"` lets any email + password log in. Default `"false"`. See [Test login mode](#test-login-mode). |
| `OPENAI_API_KEY` | Required for live analysis and chat. Server only. Never prefix it with `NEXT_PUBLIC_`. |
| `AI_MODEL` | Analysis model. Default `gpt-5-mini`. Low reasoning effort. |
| `AI_MODEL_CHAT` | Chat model. Default `gpt-5-nano`. Minimal reasoning effort. |
| `ANALYSIS_DAILY_LIMIT` | Analyses per user per UTC day. Default `5`. Regenerating a roadmap uses this same limit. |
| `CHAT_HOURLY_LIMIT` | Chat messages per user per UTC hour. Default `40`. |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Optional Google sign-in. |
| `AUTH_LINKEDIN_ID` / `AUTH_LINKEDIN_SECRET` | Optional LinkedIn sign-in. |
| `AUTH_APPLE_ID` / `AUTH_APPLE_SECRET` | Optional Apple sign-in. |

A provider button is shown only when both its id and secret are set. Email and password always work.

Resumes are stored on local disk under `storage/` (or `STORAGE_DIR` if set). On Vercel the project folder is read-only, so files go to the temporary directory instead; that is fine because analysis only uses the resume text saved in Postgres.

`npm run build` runs `prisma migrate deploy` first, so every deploy brings the database schema up to date. `DATABASE_URL` must be available at build time (it is on Vercel when set as an environment variable).

## Layout

| Path | What lives there |
| --- | --- |
| `app/` | Pages and API routes |
| `components/` | Interface |
| `lib/ai/` | Analysis pipeline, prompts, and model calls |
| `lib/career/` | Scoring and the schemas those stages must match |
| `lib/chat/` | The career context attached to chat |
| `lib/resume/` | PDF and DOCX text extraction |
| `prisma/` | Schema, migrations, and the demo seed |
| `storage/` | Uploaded resumes, created at runtime |

## Out of this version

This version does not scrape jobs, sell courses, submit applications, offer a voice consultant, or maintain a live labour-market feed. Chat can discuss a job description the user pastes, using the profile already stored.

## Further reading

- [AAROH_PROJECT_EXPLAINER.md](AAROH_PROJECT_EXPLAINER.md) — product and engineering briefing
- [AAROH_SYNOPSIS.md](AAROH_SYNOPSIS.md) — college synopsis manuscript
- [AAROH_PRESENTATION_BRIEF.md](AAROH_PRESENTATION_BRIEF.md) — slide script
- [productvision.md](productvision.md) — product intent, including later ideas
- [proedctdocumentation.md](proedctdocumentation.md) — build specification. Its database chapter still says MongoDB; follow the Prisma schema instead.
